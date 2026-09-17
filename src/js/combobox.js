/**
 * mo - Combobox Component
 *
 * Editable input + chevron trigger opening a filterable listbox popover,
 * shadcn/ui Combobox behavior:
 * - Focus / click / ArrowDown opens the list below the trigger, flipped
 *   above on viewport overflow (dropdown.js placement recipe).
 * - Typing filters options case-insensitively; an optional
 *   [data-combobox-empty] row shows when nothing matches. Options may sit in
 *   [role="group"] sections with a [data-label] heading — filtering hides
 *   emptied groups and orphaned separators.
 * - A [data-combobox-clear] button in the frame empties the input (shadcn's
 *   showClear) and emits 'mo-combobox-change' { value: '' }.
 * - ArrowUp/Down/Home/End rove [aria-selected] with wrap-around; Enter or a
 *   click picks: fills the input, closes, emits 'mo-combobox-change' {value}.
 * - Esc and outside clicks close natively via the Popover API light dismiss;
 *   focus moving away (Tab) closes too.
 *
 * Usage:
 * <mo-combobox>
 *   <div data-combobox>
 *     <input role="combobox" aria-expanded="false" placeholder="Select…" />
 *     <button type="button" class="icon ghost" data-combobox-toggle aria-label="Toggle options">
 *       <svg><!-- chevron-down --></svg>
 *     </button>
 *   </div>
 *   <ul popover id="cb1" role="listbox" aria-label="Fruits">
 *     <li><button type="button" role="option" value="apple">Apple</button></li>
 *     <li data-combobox-empty hidden>No items found.</li>
 *   </ul>
 * </mo-combobox>
 */

import { MoBase } from './base.js';

/**
 * Combobox pairing an editable input with a filterable listbox popover.
 *
 * @tag mo-combobox
 * @fires {CustomEvent<{ value: string }>} mo-combobox-change - An option was picked (value "" when cleared).
 */
class OtCombobox extends MoBase {
  #frame;
  #input;
  #toggle;
  #list;
  #selected;
  #pressedWhileOpen = false;

  init() {
    this.#frame = this.querySelector('[data-combobox]');
    this.#input = this.querySelector('[data-combobox] input[role="combobox"]');
    this.#toggle = this.querySelector('[data-combobox-toggle]');
    this.#list = this.querySelector(':scope > [popover]');
    if (!this.#input || !this.#list) return;

    if (!this.#list.getAttribute('role')) this.#list.setAttribute('role', 'listbox');
    if (!this.#list.id) this.#list.id = `${this.uid()}-list`;
    this.#input.setAttribute('aria-controls', this.#list.id);
    this.#options().forEach((option) => {
      option.id ||= `${this.uid()}-opt`;
      // Roving is virtual ([aria-selected]); items never take Tab focus.
      option.tabIndex = -1;
    });

    this.addEventListener('input', this);
    this.addEventListener('keydown', this);
    // Capture: must run before the Popover API's document-level light dismiss
    // (a bubble-phase document listener) so presses on our own frame can be
    // told apart from genuine outside clicks.
    this.addEventListener('pointerdown', this, true);
    this.addEventListener('click', this);
    this.addEventListener('focusin', this);
    this.addEventListener('focusout', this);
    // beforetoggle does not bubble; placement runs on 'toggle' because state
    // has been applied by then and rects are measurable.
    this.#list.addEventListener('toggle', this);

    // Keep focus on the input when the toggle is pressed, so closing the list
    // cannot be immediately undone by a refocus-triggered open.
    this.#toggle?.addEventListener('mousedown', (e) => e.preventDefault());  }

  cleanup() {
    window.removeEventListener('scroll', this.#reposition, true);
    window.removeEventListener('resize', this.#reposition);
  }

  get #open() {
    return this.#list.matches(':popover-open');
  }

  ontoggle(e) {
    if (!(e.target instanceof HTMLElement)) return;
    const open = e.newState === 'open';
    this.#input.ariaExpanded = String(open);

    if (!open) {
      this.cleanup();
      return;
    }

    window.addEventListener('scroll', this.#reposition, true);
    window.addEventListener('resize', this.#reposition);

    this.#filter();
    // Place synchronously then again on next frame to avoid flick:
    // first frame positions the popover before the opacity/transform
    // transition starts, second frame corrects after layout settles.
    this.#place();
    requestAnimationFrame(() => this.#place());
    requestAnimationFrame(() => {
      // ensure transform origin matches flip direction
      const r = this.#frame.getBoundingClientRect();
      const top = parseFloat(this.#list.style.top);
      this.#list.style.transformOrigin = top < r.top ? 'bottom center' : 'top center';
    });

    // Reopening highlights the typed value's option, else the first match.
    const q = this.#input.value.trim().toLowerCase();
    const items = this.#visible();
    const exact = q ? items.find((o) => this.#valueOf(o).toLowerCase() === q) : null;
    this.#mark(exact ?? items[0]);
  }

  onfocusin(e) {
    if (e.target === this.#input && !this.#open) this.#show();
  }

  oninput() {
    if (!this.#open) {
      this.#show(); // ontoggle runs the filter for us
      return;
    }
    this.#filter();
    this.#place();
    this.#mark(this.#visible()[0]);
  }

  onkeydown(e) {
    if (e.target !== this.#input || e.isComposing) return;

    // Arrows open a closed list first (APG combobox pattern).
    if (!this.#open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.#show();
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      this.#choose(this.#selected ?? this.#visible()[0]);
      return;
    }

    const next = this.keyNav(
      e,
      this.#visible().indexOf(this.#selected),
      this.#visible().length,
      'ArrowUp',
      'ArrowDown',
      true
    );
    if (next >= 0) this.#mark(this.#visible()[next]);
  }

  onpointerdown(e) {
    // The Popover API light-dismisses on any pointerdown outside the list —
    // including presses on our own trigger frame, which would then race the
    // click handler (close via dismiss, reopen via click). Close it here
    // instead and let the click know this press already did the closing.
    if (!this.#open || this.#list.contains(e.target)) return;
    this.#pressedWhileOpen = true;
    this.#hide();
  }

  onclick(e) {
    // Clear: empty the input like shadcn's showClear; the change event
    // tells listeners the value went back to ''.
    if (e.target.closest('[data-combobox-clear]')) {
      this.#input.value = '';
      this.#hide();
      this.emit('mo-combobox-change', { value: '' });
      return;
    }

    const option = e.target.closest('[role="option"]');
    if (option) return this.#choose(option);

    const pressedOpen = this.#pressedWhileOpen;
    this.#pressedWhileOpen = false;

    // Toggle: pointerdown did the closing; a fresh press just opens (and
    // hands focus to the input so typing filters right away).
    if (e.target.closest('[data-combobox-toggle]')) {
      if (!pressedOpen) {
        this.#show();
        this.#input.focus();
      }
      return;
    }

    // Clicking the input opens or keeps the list so the caret can move.
    if (e.target === this.#input && (!this.#open || pressedOpen)) this.#show();
  }

  onfocusout(e) {
    // Outside pointerdown is light-dismissed natively; here we only close
    // when focus moves away through the keyboard (Tab).
    if (!e.relatedTarget || this.contains(e.relatedTarget)) return;
    this.#hide();
  }

  #show() {
    try {
      if (!this.#open) this.#list.showPopover();
    } catch { /* ancestor closed meanwhile */ }
  }

  #hide() {
    if (this.#open) this.#list.hidePopover();
  }

  #options() {
    return [...this.#list.querySelectorAll('[role="option"]')];
  }

  #visible() {
    return this.#options().filter((o) => !o.hidden && !o.matches(':disabled, [aria-disabled="true"]'));
  }

  #valueOf(option) {
    return option.getAttribute('value') ?? option.textContent.trim();
  }

  #filter() {
    const q = this.#input.value.trim().toLowerCase();

    let shown = 0;
    for (const option of this.#options()) {
      const haystack = `${this.#valueOf(option)} ${option.dataset.keywords ?? ''}`.toLowerCase();
      option.hidden = Boolean(q) && !haystack.includes(q);
      if (!option.hidden) shown++;
    }

    const empty = this.#list.querySelector('[data-combobox-empty]');
    if (empty) empty.hidden = shown > 0;

    this.#syncGroups();
  }

  // Groups left without visible options disappear whole; separators that lost
  // a visible neighbour on either side hide with them.
  #syncGroups() {
    for (const group of this.#list.querySelectorAll('[role="group"]')) {
      group.hidden = ![...group.querySelectorAll('[role="option"]')].some((o) => !o.hidden);
    }
    for (const hr of this.#list.querySelectorAll('hr')) {
      let before = hr.previousElementSibling;
      while (before && (before.hidden || before.matches('hr'))) before = before.previousElementSibling;
      let after = hr.nextElementSibling;
      while (after && (after.hidden || after.matches('hr'))) after = after.nextElementSibling;
      hr.hidden = !(before && after);
    }
  }

  #mark(option) {
    this.#selected?.removeAttribute('aria-selected');
    this.#selected = option ?? null;

    if (option) {
      option.setAttribute('aria-selected', 'true');
      this.#input.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    } else {
      this.#input.removeAttribute('aria-activedescendant');
    }
  }

  #choose(option) {
    if (!option || option.matches(':disabled, [aria-disabled="true"]')) return;

    this.#input.value = this.#valueOf(option);
    this.#hide();
    this.emit('mo-combobox-change', { value: this.#input.value });
  }

  // Below the trigger by default; flipped above on viewport overflow, clamped
  // to the viewport like dropdown.js. Width matches the trigger frame.
  #place() {
    // Clean slate before measuring (see dropdown.js): stale inline top/left
    // plus the UA inset:0 stretch the surface and poison the flip math.
    this.#list.style.top = '0px';
    this.#list.style.left = '0px';
    this.#list.style.right = 'auto';
    this.#list.style.bottom = 'auto';

    const r = this.#frame.getBoundingClientRect();
    const p = this.#list.getBoundingClientRect();

    const left = r.left + r.width > window.innerWidth ? r.right - p.width : r.left;
    const top = r.bottom + p.height > window.innerHeight ? r.top - p.height : r.bottom;

    this.#list.style.top = `${Math.max(4, Math.min(top, window.innerHeight - p.height))}px`;
    this.#list.style.left = `${Math.max(4, Math.min(left, window.innerWidth - p.width))}px`;
    this.#list.style.minWidth = `${r.width}px`;
  }

  #reposition = () => {
    if (this.#open) this.#place();
  };
}

customElements.define('mo-combobox', OtCombobox);
