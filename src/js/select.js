/**
 * mo - Select Component
 *
 * Custom listbox select on the Popover API, shadcn/ui Select behavior:
 * - A [data-select-trigger] button opens a ul[popover][role="listbox"] via
 *   native popovertarget; Esc and outside clicks close through the light
 *   dismiss, Tab closes through focusout.
 * - Opening places the list below the trigger, flipped above on viewport
 *   overflow and clamped (dropdown.js placement recipe), widened to match.
 * - Arrows/Home/End rove [aria-selected] with wrap-around, skipping
 *   disabled options; printable keys typeahead jump ("c" → Carrot),
 *   cycling on repeats.
 * - Enter / Space / a click picks: the trigger label updates, the roving
 *   [aria-selected] commits, the list closes and 'mo-select-change'
 *   { value } is emitted. Disabled options are never picked.
 * - While no value is chosen the trigger shows the host's data-placeholder
 *   text, dimmed via [data-empty].
 *
 * Usage:
 * <mo-select data-placeholder="Select a fruit" name="fruit" required>
 *   <button type="button" popovertarget="s1" data-select-trigger aria-label="Fruit"></button>
 *   <ul popover id="s1" class="popover" role="listbox" aria-label="Fruits">
 *     <li><button type="button" role="option" value="apple">Apple</button></li>
 *     <li role="group"><div data-label>Citrus</div><button type="button" role="option">Lemon</button></li>
 *   </ul>
 * </mo-select>
 *
 * Form participation: mo-select is not a form-associated custom element, so
 * name/required mirror onto a hidden input it manages — the value (and the
 * required gate) flows through FormData and reportValidity() natively.
 */

import { MoBase } from './base.js';

/**
 * Select pairing a trigger with a listbox popover on the Popover API.
 *
 * @tag mo-select
 * @attr {string} data-placeholder - Placeholder shown on the trigger when nothing is picked.
 * @attr {string} name - Mirrored onto a managed hidden input so the value submits with forms.
 * @attr {boolean} required - Mirrored onto the hidden input so reportValidity() gates empty picks.
 * @prop {string | null} value - The picked value (read-only; null when empty).
 * @fires {CustomEvent<{ value: string }>} mo-select-change - An option was picked.
 */
class OtSelect extends MoBase {
  #trigger;
  #list;
  #label;
  #selected;
  #hidden;
  #pressedWhileOpen = false;
  #typeBuffer = '';
  #typeUntil = 0;

  init() {
    this.#trigger = this.querySelector('[data-select-trigger]');
    this.#list = this.querySelector(':scope > [popover]');
    if (!this.#trigger || !this.#list) return;

    if (!this.#list.getAttribute('role')) this.#list.setAttribute('role', 'listbox');
    if (!this.#list.id) this.#list.id = `${this.uid()}-list`;
    this.#trigger.setAttribute('aria-haspopup', 'listbox');
    this.#trigger.setAttribute('aria-controls', this.#list.id);
    this.#options().forEach((option) => {
      option.id ||= `${this.uid()}-opt`;
      // Roving is virtual ([aria-selected]); items never take Tab focus.
      option.tabIndex = -1;
    });

    // Hidden input mirror: mo-select is not form-associated, so a plain
    // <input type="hidden" name> carries the value into FormData and native
    // validation (required). Kept in sync on every commit/placeholder.
    const name = this.getAttribute('name');
    if (name) {
      this.#hidden = document.createElement('input');
      this.#hidden.type = 'hidden';
      this.#hidden.name = name;
      if (this.hasAttribute('required')) this.#hidden.required = true;
      this.appendChild(this.#hidden);
    }

    // Trigger label: an explicit [data-select-value] span wins, else one is
    // created ahead of any author content (the chevron is CSS ::after).
    this.#label = this.#trigger.querySelector('[data-select-value]');
    if (!this.#label) {
      this.#label = document.createElement('span');
      this.#label.setAttribute('data-select-value', '');
      this.#trigger.prepend(this.#label);
    }

    // A pre-marked option (author's default value) seeds the trigger label;
    // otherwise show the placeholder dimmed.
    const initial = this.#options().find((o) => o.getAttribute('aria-selected') === 'true');
    if (initial) this.#commit(initial);
    else this.#showPlaceholder();

    // Capture: must run before the Popover API's document-level light dismiss
    // (a bubble-phase document listener) so presses on our own trigger can be
    // told apart from genuine outside clicks.
    this.addEventListener('pointerdown', this, true);
    // beforetoggle does not bubble; placement runs on 'toggle' because state
    // has been applied by then and rects are measurable.
    this.addEventListener('beforetoggle', this, true);
    this.addEventListener('toggle', this, true);
    this.addEventListener('click', this);
    this.addEventListener('keydown', this);
    this.addEventListener('focusout', this);
  }

  cleanup() {
    window.removeEventListener('scroll', this.#reposition, true);
    window.removeEventListener('resize', this.#reposition);
  }

  get #open() {
    return this.#list.matches(':popover-open');
  }

  get value() {
    const current = this.#options().find((o) => o.getAttribute('aria-selected') === 'true');
    return current ? this.#valueOf(current) : null;
  }

  onbeforetoggle(e) {
    if (!(e.target instanceof HTMLElement)) return;

    if (e.newState !== 'open') {
      this.cleanup();
      this.#trigger.ariaExpanded = 'false';
      // Click-selection moves focus to the page; don't yank it back then.
      if (document.activeElement === document.body || this.#list.contains(document.activeElement)) {
        this.#trigger.focus();
      }
      return;
    }

    window.addEventListener('scroll', this.#reposition, true);
    window.addEventListener('resize', this.#reposition);
    this.#trigger.ariaExpanded = 'true';
  }

  // 'toggle' fires once the :popover-open state has applied, so rects are
  // real here: placement and first-item highlight are reliable.
  // Implements shadcn's "item-aligned" positioning: the selected item is
  // scrolled into view and the list is positioned so the selected item
  // aligns with the trigger (centered if possible).
  ontoggle(e) {
    if (!(e.target instanceof HTMLElement) || e.newState !== 'open') return;

    this.#place();

    // Reopening highlights the committed value's option, else the first
    // enabled one.
    const committed = this.#options().find((o) => o.getAttribute('aria-selected') === 'true');
    const target = committed && !committed.matches(':disabled, [aria-disabled="true"]')
      ? committed
      : this.#visible()[0];
    this.#mark(target);

    // Item-aligned: scroll the selected item into the center of the viewport
    // and adjust list position so the selected item aligns with the trigger.
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        // Center selected in the list's scroll viewport if possible
        const list = this.#list;
        const targetTop = target.offsetTop;
        const targetHeight = target.offsetHeight;
        const listHeight = list.clientHeight;
        // Scroll so selected is centered
        const desiredScroll = targetTop - (listHeight / 2) + (targetHeight / 2);
        list.scrollTop = Math.max(0, desiredScroll);

        // Adjust list top so selected aligns with trigger (item-aligned)
        // Only if the list is tall enough and viewport allows
        const triggerRect = this.#trigger.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        const selectedRect = target.getBoundingClientRect();
        const offsetInList = selectedRect.top - listRect.top;
        const triggerCenter = triggerRect.top + triggerRect.height / 2;
        const selectedCenter = selectedRect.top + selectedRect.height / 2;
        const delta = triggerCenter - selectedCenter;
        // Nudge the list by delta, clamped to viewport
        let newTop = listRect.top + delta;
        newTop = Math.max(4, Math.min(newTop, window.innerHeight - listRect.height - 4));
        list.style.top = `${newTop}px`;
        target.focus();
      });
    } else {
      requestAnimationFrame(() => target?.focus());
    }
  }

  onfocusout(e) {
    // Outside pointerdown is light-dismissed natively; here we only close
    // when focus moves away through the keyboard (Tab).
    if (!e.relatedTarget || this.contains(e.relatedTarget)) return;
    this.#hide();
  }

  onpointerdown(e) {
    // The Popover API light-dismisses on any pointerdown outside the list —
    // including presses on our own trigger, which would race the invoker's
    // click-toggle (close via dismiss, reopen via invoker). Close it here
    // instead and let onclick know this press already did the closing.
    if (!this.#open || this.#list.contains(e.target)) return;
    this.#pressedWhileOpen = true;
    this.#hide();
  }

  onclick(e) {
    const pressedOpen = this.#pressedWhileOpen;
    this.#pressedWhileOpen = false;

    const option = e.target.closest('[role="option"]');
    if (option) return this.#choose(option);

    // Trigger press while open: pointerdown did the closing; cancel the
    // invoker's default toggle so the click cannot reopen it right away.
    if (pressedOpen && e.target.closest('[data-select-trigger]')) e.preventDefault();
  }

  onkeydown(e) {
    // Arrows on the trigger open a closed list first (APG select pattern).
    if (e.target === this.#trigger && !this.#open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.#show();
      }
      return;
    }

    if (!this.#open) return;
    const visible = this.#visible();
    if (visible.length === 0) return;

    // Roving arrows + Home/End within the enabled options.
    const next = this.keyNav(
      e,
      visible.indexOf(document.activeElement),
      visible.length,
      'ArrowUp',
      'ArrowDown',
      true
    );
    if (next >= 0) {
      this.#resetTypeahead();
      this.#mark(visible[next]);
      visible[next].focus();
      return;
    }

    // Enter/Space activate the focused option natively (click → #choose).

    // Typeahead: jump to options starting with the typed letters, cycling
    // on repeats. Space is excluded so focused options activate normally.
    if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const now = Date.now();
      if (now > this.#typeUntil) this.#typeBuffer = '';
      this.#typeUntil = now + 500;
      this.#typeBuffer += e.key.toLowerCase();

      const start = Math.max(0, visible.indexOf(document.activeElement));
      for (let i = 1; i <= visible.length; i++) {
        const candidate = visible[(start + i) % visible.length];
        if (candidate.textContent.trim().toLowerCase().startsWith(this.#typeBuffer)) {
          this.#mark(candidate);
          candidate.focus();
          return;
        }
      }
      // No match: start fresh on the next key instead of compounding a dead prefix.
      this.#resetTypeahead();
    }
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

  // Move the roving [aria-selected] marker and scroll the row into view.
  #mark(option) {
    this.#selected?.removeAttribute('aria-selected');
    this.#selected = option ?? null;

    if (option) {
      option.setAttribute('aria-selected', 'true');
      option.scrollIntoView({ block: 'nearest' });
    }
  }

  // Commit an option as the value: roving marker, trigger label, placeholder state.
  // Uses data-select-empty (namespaced) to avoid collision with Empty component's [data-empty].
  #commit(option) {
    this.#mark(option);
    this.#label.textContent = option.textContent.trim();
    if (this.#hidden) this.#hidden.value = this.#valueOf(option);
    this.removeAttribute('data-empty');
    this.removeAttribute('data-select-empty');
  }

  #showPlaceholder() {
    this.#selected?.removeAttribute('aria-selected');
    this.#label.textContent = this.getAttribute('data-placeholder') ?? '';
    if (this.#hidden) this.#hidden.value = '';
    this.setAttribute('data-select-empty', '');
    // keep legacy data-empty for backward compat, but empty.css now excludes mo-select
    this.setAttribute('data-empty', '');
  }

  #choose(option) {
    if (!option || option.matches(':disabled, [aria-disabled="true"]')) return;

    this.#commit(option);
    this.#hide();
    this.emit('mo-select-change', { value: this.#valueOf(option) });
  }

  // Below the trigger by default; flipped above on viewport overflow, clamped
  // to the viewport like dropdown.js. Width matches the trigger frame.
  #place() {
    // Same clean-slate rule as dropdown.js: stale inline top/left plus the
    // UA inset:0 stretch the list box and break the flip math.
    this.#list.style.top = '0px';
    this.#list.style.left = '0px';
    this.#list.style.right = 'auto';
    this.#list.style.bottom = 'auto';

    const r = this.#trigger.getBoundingClientRect();
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

  #resetTypeahead() {
    this.#typeBuffer = '';
    this.#typeUntil = 0;
  }
}

customElements.define('mo-select', OtSelect);
