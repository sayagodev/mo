/**
 * mo - Command Component
 *
 * Searchable list of actions (shadcn/ui Command, built on cmdk's model).
 * Two flavors share one anatomy:
 * - Palette: <mo-command> wraps a <dialog class="command"> opened through
 *   the native `commandfor="show-modal"` (works via the base polyfill too).
 * - Inline: no <dialog> child — the host itself renders as a bordered card.
 *
 * Behavior:
 * - Typing filters items case-insensitively; non-matching items AND groups
 *   left without visible items are hidden, separators collapse accordingly,
 *   and [data-command-empty] shows only when nothing matches.
 * - ArrowUp/Down/Home/End rove [aria-selected] among visible options with
 *   wrap-around; focus stays on the input (cmdk-style virtual roving).
 * - Enter (or click / hover-select) chooses the selected option: emits
 *   'mo-command-select' {value} and closes the dialog.
 * - Esc closes the dialog natively; clicking the backdrop closes too.
 *
 * Usage:
 * <mo-command>
 *   <button type="button" command="show-modal" commandfor="cmd1">Open…</button>
 *   <dialog class="command" id="cmd1" aria-label="Command palette">
 *     <input data-command-input type="text" placeholder="Type a command…" />
 *     <div data-command-list>
 *       <div data-command-empty hidden>No results found.</div>
 *       <section data-command-groups>
 *         <div data-command-label>Suggestions</div>
 *         <button type="button" role="option">Calendar</button>
 *       </section>
 *       <hr />
 *       <section data-command-groups>
 *         <button type="button" role="option">Profile <kbd>⌘P</kbd></button>
 *       </section>
 *     </div>
 *   </dialog>
 * </mo-command>
 */

import { MoBase } from './base.js';

/**
 * Command palette or inline card with case-insensitive action filtering.
 *
 * @tag mo-command
 * @fires {CustomEvent<{ value: string }>} mo-command-select - An option was chosen; the palette dialog closes.
 */
class OtCommand extends MoBase {
  #dialog;
  #input;
  #selected;

  init() {
    this.#dialog = this.querySelector(':scope > dialog');
    this.#input = this.querySelector('[data-command-input]');
    if (!this.#input) return;

    this.#wireSemantics();
    this.#applyFilter();

    if (this.#dialog) this.#dialog.addEventListener('toggle', this);
    this.addEventListener('input', this);
    this.addEventListener('keydown', this);
    this.addEventListener('click', this);
    this.addEventListener('pointerover', this);
  }

  // Roles the author should not have to write: a single listbox owning every
  // option (axe requires options under a listbox), group semantics per
  // section, ids for aria-activedescendant, and non-tab-focusable items.
  #wireSemantics() {
    const options = this.#options();
    if (options.length && !this.querySelector('[role="listbox"]')) {
      // Walk past single-group layouts: a lone [data-command-groups] holding
      // every option must stay role="group", so the listbox lands above it.
      let box = options[0].parentElement;
      while (box && (!options.every((o) => box.contains(o)) || box.matches('[data-command-groups]'))) {
        box = box.parentElement;
      }
      if (box && box !== this && box !== this.#dialog) box.setAttribute('role', 'listbox');
    }

    for (const group of this.querySelectorAll('[data-command-groups]')) {
      group.setAttribute('role', 'group');
      const label = group.querySelector('[data-command-label]');
      if (label) {
        label.id ||= `${this.uid()}-label`;
        group.setAttribute('aria-labelledby', label.id);
      }
    }

    options.forEach((option, i) => {
      option.id ||= `${this.uid()}-${i}`;
      option.tabIndex = -1;
    });

    this.#input.setAttribute('aria-autocomplete', 'list');
  }

  ontoggle(e) {
    if (!(e.target instanceof HTMLDialogElement) || e.newState !== 'open') return;

    // Fresh start each open, like shadcn remounting its CommandDialog.
    this.#input.value = '';
    this.#applyFilter();
    requestAnimationFrame(() => {
      this.#input.focus();
      this.#select(this.#visible()[0]);
    });
  }

  oninput(e) {
    if (e.target !== this.#input) return;
    this.#applyFilter();
  }

  onkeydown(e) {
    if (e.target !== this.#input || e.isComposing) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      this.#choose(this.#selected);
      return;
    }

    const items = this.#visible();
    const next = this.keyNav(e, items.indexOf(this.#selected), items.length, 'ArrowUp', 'ArrowDown', true);
    if (next >= 0) this.#select(items[next]);
  }

  onclick(e) {
    // Modal backdrop clicks land on the dialog element itself.
    if (e.target === this.#dialog) return this.#dialog.close();

    const item = e.target.closest('[role="option"]');
    if (item) this.#choose(item);
  }

  onpointerover(e) {
    const item = e.target.closest('[role="option"]');
    if (item && !item.matches(':disabled, [aria-disabled="true"]')) this.#select(item);
  }

  #options() {
    return [...this.querySelectorAll('[role="option"]')];
  }

  #visible() {
    return this.#options().filter((o) => !o.hidden && !o.matches(':disabled, [aria-disabled="true"]'));
  }

  #applyFilter() {
    const q = this.#input.value.trim().toLowerCase();

    for (const item of this.#options()) {
      item.hidden = Boolean(q) && !this.#haystack(item).includes(q);
    }

    // Groups left without visible items disappear whole.
    for (const group of this.querySelectorAll('[data-command-groups]')) {
      group.hidden = ![...group.querySelectorAll('[role="option"]')].some((o) => !o.hidden);
    }

    this.#pruneSeparators();

    const empty = this.querySelector('[data-command-empty]');
    if (empty) empty.hidden = this.#options().some((o) => !o.hidden);

    // Selection may have been filtered out or hidden with its group.
    if (!this.#selected || this.#selected.hidden) this.#select(this.#visible()[0]);
  }

  #haystack(item) {
    // Shortcut chips ("⌘P") must not pollute matching.
    const clone = item.cloneNode(true);
    clone.querySelectorAll('kbd, [data-shortcut]').forEach((el) => el.remove());
    return `${item.getAttribute('value') ?? ''} ${clone.textContent} ${item.dataset.keywords ?? ''}`
      .trim()
      .toLowerCase();
  }

  // Hide separators that lost a visible neighbour on either side.
  #pruneSeparators() {
    for (const hr of this.querySelectorAll('hr')) {
      let before = hr.previousElementSibling;
      while (before && (before.hidden || before.matches('hr'))) before = before.previousElementSibling;
      let after = hr.nextElementSibling;
      while (after && (after.hidden || after.matches('hr'))) after = after.nextElementSibling;
      hr.hidden = !(before && after);
    }
  }

  #select(item) {
    this.#selected?.removeAttribute('aria-selected');
    this.#selected = item ?? null;

    if (item) {
      item.setAttribute('aria-selected', 'true');
      this.#input.setAttribute('aria-activedescendant', item.id);
      item.scrollIntoView({ block: 'nearest' });
    } else {
      this.#input.removeAttribute('aria-activedescendant');
    }
  }

  #choose(item) {
    if (!item || item.matches(':disabled, [aria-disabled="true"]')) return;
    this.emit('mo-command-select', { value: this.#valueOf(item) });
    this.#dialog?.close();
  }

  // Explicit value attribute wins; the label fallback ignores shortcut chips.
  #valueOf(item) {
    if (item.getAttribute('value')) return item.getAttribute('value');
    const clone = item.cloneNode(true);
    clone.querySelectorAll('kbd, [data-shortcut]').forEach((el) => el.remove());
    return clone.textContent.trim();
  }
}

customElements.define('mo-command', OtCommand);
