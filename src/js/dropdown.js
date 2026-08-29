/**
 * mo - Dropdown Component
 *
 * Trigger + popover menus with nested submenus, Radix-style keyboard model:
 * - Arrows rove items inside the CURRENT menu only (submenus trap focus).
 * - ArrowRight / Enter / hover opens a submenu; ArrowLeft / Esc closes it
 *   and returns focus to its trigger.
 * - Tab dismisses the whole menu (items are arrow-only).
 * - Printable keys typeahead: focus jumps to items starting with the typed
 *   letters ("s" → Settings…), cycling on repeats.
 * - Disabled items are skipped by arrows and typeahead.
 *
 * Usage:
 * <mo-dropdown>
 *   <button popovertarget="m1">Options</button>
 *   <menu popover id="m1">
 *     <div data-label>Label</div>
 *     <button role="menuitem">Item <span data-shortcut>⌘N</span></button>
 *     <button role="menuitemcheckbox" aria-checked="true">Toggle</button>
 *     <hr />
 *     <button role="menuitem" popovertarget="s1">Submenu…</button>
 *     <menu popover id="s1">
 *       <button role="menuitem">Nested</button>
 *     </menu>
 *   </menu>
 * </mo-dropdown>
 */

import { MoBase } from './base.js';

/**
 * Dropdown menu with nested submenus, typeahead and Radix-style keyboard nav.
 *
 * @tag mo-dropdown
 * @attr {string} data-dropdown-side - "right" or "left": force the menu to open beside the trigger instead of below (sidebar pickers).
 * @fires {CustomEvent<{ item: HTMLElement, checked: boolean }>} mo-dropdown-change - A menuitemcheckbox/menuitemradio toggled.
 */
class OtDropdown extends MoBase {
  #trigger;
  #hoverTimer;
  #typeBuffer = '';
  #typeUntil = 0;

  init() {
    this.#trigger = this.querySelector('[popovertarget]');
    if (!this.#trigger?.getAttribute('popovertarget')) return;
    this.#trigger.setAttribute('aria-haspopup', 'menu');

    // Menu semantics: axe requires [role=menuitem] to live inside [role=menu].
    for (const popup of this.querySelectorAll('menu[popover]')) {
      if (!popup.getAttribute('role')) popup.setAttribute('role', 'menu');
    }

    // beforetoggle does not bubble; capture intercepts nested popovers too.
    // Placement runs on 'toggle' (state already applied, rects measurable).
    this.addEventListener('beforetoggle', this, true);
    this.addEventListener('toggle', this, true);
    this.addEventListener('click', this);
    this.addEventListener('keydown', this);
    this.addEventListener('pointerover', this);
  }

  cleanup() {
    clearTimeout(this.#hoverTimer);
    window.removeEventListener('scroll', this.#reposition, true);
    window.removeEventListener('resize', this.#reposition);
  }

  rootMenu() {
    return this.querySelector(':scope > [popover]');
  }

  // The control that opens the given popover: the root trigger or a nested
  // [popovertarget] item.
  #controlFor(popup) {
    if (popup === this.rootMenu()) return this.#trigger;
    return this.querySelector(`[popovertarget="${CSS.escape(popup.id)}"]`);
  }

  onbeforetoggle(e) {
    const popup = e.target;
    if (!(popup instanceof HTMLElement)) return;

    if (e.newState !== 'open') {
      if (popup === this.rootMenu()) {
        this.cleanup();
        this.#trigger.ariaExpanded = 'false';
        // Click-selection moves focus to the page; don't yank it back then.
        if (document.activeElement === document.body || popup.contains(document.activeElement)) {
          this.#trigger.focus();
        }
        return;
      }
      // Nested submenu closed (Esc / ArrowLeft / hover-out): hand focus back
      // to its trigger, but only when focus was actually trapped inside it.
      if (popup.contains(document.activeElement)) {
        this.#controlFor(popup)?.focus();
      }
      return;
    }

    window.addEventListener('scroll', this.#reposition, true);
    window.addEventListener('resize', this.#reposition);

    if (popup === this.rootMenu()) {
      this.#trigger.ariaExpanded = 'true';
    }
  }

  // 'toggle' fires once the :popover-open state has applied, so rects are
  // real here: placement and first-item focus are reliable.
  ontoggle(e) {
    const popup = e.target;
    if (!(popup instanceof HTMLElement) || e.newState !== 'open') return;

    this.#place(popup);

    if (popup === this.rootMenu()) {
      requestAnimationFrame(() => this.#currentItems()[0]?.focus());
    } else {
      // Submenu opened via native click/Space on its trigger: trap focus inside.
      const ctrl = this.#controlFor(popup);
      if (ctrl?.contains(document.activeElement)) {
        requestAnimationFrame(() => this.#currentItems()[0]?.focus());
      }
    }
  }

  onclick(e) {
    const item = e.target.closest('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]');
    if (!item || item.matches(':disabled, [disabled], [aria-disabled="true"]')) return;

    // Selecting a plain item closes the whole menu (Radix behavior).
    // Checkbox/radio items stay open so their state remains visible.
    if (item.getAttribute('role') === 'menuitem' && !item.hasAttribute('popovertarget')) {
      this.rootMenu().hidePopover();
      return;
    }

    if (item.getAttribute('role') === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
      this.emit('mo-dropdown-change', { item, checked: item.getAttribute('aria-checked') === 'true' });
    } else if (item.getAttribute('role') === 'menuitemradio') {
      const group = item.closest('[role="group"], menu');
      for (const sibling of group.querySelectorAll('[role="menuitemradio"]')) {
        sibling.setAttribute('aria-checked', String(sibling === item));
      }
      this.emit('mo-dropdown-change', { item, checked: item.getAttribute('aria-checked') === 'true' });
    }
  }

  onpointerover(e) {
    if (!e.target.closest('[popover]')) return;

    // Close stale submenus unrelated to whatever is being hovered.
    for (const popup of [...this.querySelectorAll('[popover]:popover-open')]) {
      if (popup === this.rootMenu()) continue;
      const ctrl = this.#controlFor(popup);
      if (!ctrl?.contains(e.target) && !popup.contains(e.target)) {
        popup.hidePopover();
      }
    }

    // Hover intent: open the hovered sub-trigger's menu shortly after.
    const trigger = e.target.closest('[role="menuitem"][popovertarget]');
    clearTimeout(this.#hoverTimer);
    if (trigger && !trigger.matches(':disabled, [disabled], [aria-disabled="true"]')) {
      const sub = document.getElementById(trigger.getAttribute('popovertarget'));
      if (sub && !sub.matches(':popover-open')) {
        this.#hoverTimer = setTimeout(() => {
          try { sub.showPopover(); } catch { /* ancestor closed meanwhile */ }
        }, 100);
      }
    }
  }

  onkeydown(e) {
    const popup = e.target.closest?.('[popover]');
    if (!popup || !popup.matches(':popover-open')) return;

    // Tab dismisses the whole tree; items are arrow-only.
    if (e.key === 'Tab') {
      e.preventDefault();
      this.rootMenu().hidePopover();
      return;
    }

    // ArrowRight opens the focused sub-trigger's submenu.
    if (e.key === 'ArrowRight') {
      const trigger = e.target.closest('[role="menuitem"][popovertarget]');
      if (!trigger) return;
      e.preventDefault();
      const sub = document.getElementById(trigger.getAttribute('popovertarget'));
      if (sub && !sub.matches(':popover-open')) {
        try { sub.showPopover(); } catch { /* noop */ }
        requestAnimationFrame(() => this.#currentItems()[0]?.focus());
      }
      return;
    }

    // ArrowLeft closes the current nested submenu; focus returns via
    // the beforetoggle handler.
    if (e.key === 'ArrowLeft' && popup !== this.rootMenu()) {
      e.preventDefault();
      popup.hidePopover();
      return;
    }

    // Roving arrows + Home/End within the current menu only.
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      const items = this.#currentItems();
      if (items.length === 0) return;
      e.preventDefault();

      const idx = items.indexOf(document.activeElement);
      let next = idx;
      if (e.key === 'ArrowDown') next = (idx + 1) % items.length;
      else if (e.key === 'ArrowUp') next = (idx - 1 + items.length) % items.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;

      items[next]?.focus();
      this.#resetTypeahead();
      return;
    }

    // Typeahead: jump to items starting with the typed letters. Space is
    // excluded so focused buttons/checkboxes activate normally.
    if (e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const now = Date.now();
      if (now > this.#typeUntil) this.#typeBuffer = '';
      this.#typeUntil = now + 500;
      this.#typeBuffer += e.key.toLowerCase();

      const items = this.#currentItems();
      const start = Math.max(0, items.indexOf(document.activeElement));
      for (let i = 1; i <= items.length; i++) {
        const candidate = items[(start + i) % items.length];
        if (candidate.textContent.trim().toLowerCase().startsWith(this.#typeBuffer)) {
          candidate.focus();
          return;
        }
      }
      // No match: start fresh on the next key instead of compounding a dead prefix.
      this.#resetTypeahead();
    }
  }

  #resetTypeahead() {
    this.#typeBuffer = '';
    this.#typeUntil = 0;
  }

  // The deepest open popover's enabled items: arrows never leave this set,
  // mirroring Radix's per-submenu focus trap. Items of CLOSED nested menus
  // must be excluded — they are DOM descendants of `current` but hidden.
  #currentItems() {
    const open = [...this.querySelectorAll('[popover]:popover-open')];
    if (open.length === 0) return [];
    const current = open.find((p) => !open.some((o) => o !== p && p.contains(o))) ?? open[0];

    const sel = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
    return [...current.querySelectorAll(sel)]
      .filter((el) => el.closest('[popover]') === current)
      .filter((el) => !el.matches(':disabled, [disabled], [aria-disabled="true"]'));
  }

  #place(popup) {
    const ctrl = this.#controlFor(popup);
    if (!ctrl) return;

    const r = ctrl.getBoundingClientRect();
    const p = popup.getBoundingClientRect();
    const nested = ctrl.closest('[popover]') !== null;
    const side = ctrl.getAttribute('data-dropdown-side');

    let top;
    let left;

    if (side === 'right' || side === 'left') {
      // Author-forced side placement (sidebar pickers open to the side so
      // they do not cover the panel's own rows).
      left = side === 'right' ? r.right + 4 : r.left - p.width - 4;
      if (left + p.width > window.innerWidth) left = r.left - p.width - 4;
      if (left + p.width > window.innerWidth) left = Math.max(4, window.innerWidth - p.width - 4);
      top = r.top;
    } else if (nested) {
      // Side placement: flush against the trigger's far edge, like Radix
      // sub-content with sideOffset -4 (overlaps the parent's padding).
      left = r.right - 4;
      if (left + p.width > window.innerWidth) left = r.left - p.width + 4;
      top = r.top - 5; /* compensate surface padding */
    } else {
      // Drop placement: below the trigger, flipped if it would overflow.
      left = r.left + r.width > window.innerWidth ? r.right - p.width : r.left;
      top = r.bottom + p.height > window.innerHeight ? r.top - p.height : r.bottom;
    }

    popup.style.top = `${Math.max(4, Math.min(top, window.innerHeight - p.height))}px`;
    popup.style.left = `${Math.max(4, Math.min(left, window.innerWidth - p.width))}px`;
  }

  #reposition = () => {
    for (const popup of this.querySelectorAll('[popover]:popover-open')) {
      this.#place(popup);
    }
  };
}

customElements.define('mo-dropdown', OtDropdown);
