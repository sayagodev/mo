/**
 * mo - Menubar Component
 *
 * Horizontal bar of root menus (File · Edit · View…), Radix-style:
 * - Click or ArrowDown opens the focused segment; Enter/Space activate the
 *   popovertarget natively.
 * - While a menu is open, ArrowLeft/Right move between ROOT menus (auto-
 *   closing the current one), Home/End jump to the first/last one.
 * - Hovering another bar trigger switches menus once one is already open.
 * - Inside every menu the dropdown keyboard model applies: arrows trap per
 *   menu, typeahead, Tab dismisses, disabled skip, click-selects-closes,
 *   ArrowRight/Left open/close nested submenus.
 *
 * Usage:
 * <mo-menubar>
 *   <button role="menuitem" popovertarget="m-file">File</button>
 *   <menu popover id="m-file">
 *     <div data-label>Label</div>
 *     <button role="menuitem">Open <span data-shortcut>⌘O</span></button>
 *     <button role="menuitemcheckbox" aria-checked="true">Autosave</button>
 *     <hr />
 *     <button role="menuitem" popovertarget="s-share">Share…</button>
 *     <menu popover id="s-share">
 *       <button role="menuitem">Email link</button>
 *     </menu>
 *   </menu>
 *   <button role="menuitem" popovertarget="m-edit">Edit</button>
 *   <menu popover id="m-edit">
 *     <button role="menuitem">Undo</button>
 *   </menu>
 * </mo-menubar>
 */

import { MoBase } from './base.js';

/**
 * Menubar of root menus with hover switching and Radix-style keyboard nav.
 *
 * @tag mo-menubar
 * @fires {CustomEvent<{ item: HTMLElement, checked: boolean }>} mo-menubar-change - A checkbox/radio menu item changed.
 */
class OtMenubar extends MoBase {
  #hoverTimer;
  #typeBuffer = '';
  #typeUntil = 0;

  init() {
    if (!this.getAttribute('role')) this.setAttribute('role', 'menubar');

    // Menu semantics: axe requires [role=menuitem] to live inside [role=menu].
    for (const popup of this.querySelectorAll('menu[popover]')) {
      if (!popup.getAttribute('role')) popup.setAttribute('role', 'menu');
    }
    for (const trigger of this.#triggers()) {
      trigger.setAttribute('aria-haspopup', 'menu');
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

  // Bar segments in DOM order: direct-child triggers + their root menus.
  #triggers() {
    return [...this.querySelectorAll(':scope > [popovertarget]')];
  }

  #roots() {
    return [...this.querySelectorAll(':scope > menu[popover]')];
  }

  // The control that opens the given popover: a bar trigger or a nested
  // [popovertarget] item.
  #controlFor(popup) {
    return this.querySelector(`[popovertarget="${CSS.escape(popup.id)}"]`);
  }

  // The currently open root menu, if any.
  #openRoot() {
    return this.#roots().find((root) => root.matches(':popover-open')) ?? null;
  }

  onbeforetoggle(e) {
    const popup = e.target;
    if (!(popup instanceof HTMLElement)) return;

    if (e.newState !== 'open') {
      if (this.#roots().includes(popup)) {
        this.cleanup();
        const ctrl = this.#controlFor(popup);
        if (!ctrl) return;
        ctrl.ariaExpanded = 'false';
        // Click-selection moves focus to the page; don't yank it back then.
        if (document.activeElement === document.body || popup.contains(document.activeElement)) {
          ctrl.focus();
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

    if (this.#roots().includes(popup)) {
      const ctrl = this.#controlFor(popup);
      if (ctrl) ctrl.ariaExpanded = 'true';
    }
  }

  // 'toggle' fires once the :popover-open state has applied, so rects are
  // real here: placement and first-item focus are reliable.
  ontoggle(e) {
    const popup = e.target;
    if (!(popup instanceof HTMLElement) || e.newState !== 'open') return;

    this.#place(popup);

    if (this.#roots().includes(popup)) {
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
      this.#openRoot()?.hidePopover();
      return;
    }

    if (item.getAttribute('role') === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
      this.emit('mo-menubar-change', { item, checked: item.getAttribute('aria-checked') === 'true' });
    } else if (item.getAttribute('role') === 'menuitemradio') {
      const group = item.closest('[role="group"], menu');
      for (const sibling of group.querySelectorAll('[role="menuitemradio"]')) {
        sibling.setAttribute('aria-checked', String(sibling === item));
      }
      this.emit('mo-menubar-change', { item, checked: item.getAttribute('aria-checked') === 'true' });
    }
  }

  onpointerover(e) {
    // Hover another bar trigger to switch menus while one is open (Radix
    // menubar behavior). With nothing open, hovering the bar does nothing.
    if (!e.target.closest('[popover]')) {
      if (!this.#openRoot()) return;
      const trigger = e.target.closest('[popovertarget]');
      if (!trigger || !this.#triggers().includes(trigger)) return;
      if (trigger.matches(':disabled, [disabled], [aria-disabled="true"]')) return;

      const menu = document.getElementById(trigger.getAttribute('popovertarget'));
      if (menu && !menu.matches(':popover-open')) {
        clearTimeout(this.#hoverTimer);
        this.#hoverTimer = setTimeout(() => {
          if (!this.#openRoot()) return;
          try { menu.showPopover(); } catch { /* ancestor closed meanwhile */ }
        }, 100);
      }
      return;
    }

    // Close stale submenus unrelated to whatever is being hovered.
    for (const popup of [...this.querySelectorAll('[popover]:popover-open')]) {
      if (this.#roots().includes(popup)) continue;
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
    if (!popup || !popup.matches(':popover-open')) {
      this.#barKeys(e);
      return;
    }

    // Tab dismisses the whole tree; items are arrow-only.
    if (e.key === 'Tab') {
      e.preventDefault();
      this.#openRoot()?.hidePopover();
      return;
    }

    const atRoot = this.#roots().includes(popup);

    // ArrowRight opens the focused sub-trigger's submenu; on a plain item it
    // moves to the next root menu instead.
    if (e.key === 'ArrowRight') {
      const trigger = e.target.closest('[role="menuitem"][popovertarget]');
      if (trigger && !trigger.matches(':disabled, [disabled], [aria-disabled="true"]')) {
        e.preventDefault();
        const sub = document.getElementById(trigger.getAttribute('popovertarget'));
        if (sub && !sub.matches(':popover-open')) {
          try { sub.showPopover(); } catch { /* noop */ }
          requestAnimationFrame(() => this.#currentItems()[0]?.focus());
        }
        return;
      }
      if (atRoot) {
        e.preventDefault();
        this.#step(1);
      }
      return;
    }

    // ArrowLeft closes the current nested submenu (focus returns via the
    // beforetoggle handler); at the root level it moves to the previous
    // root menu.
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (!atRoot) popup.hidePopover();
      else this.#step(-1);
      return;
    }

    // Home/End jump between the first/last ROOT menus while one is open.
    if ((e.key === 'Home' || e.key === 'End') && atRoot) {
      e.preventDefault();
      const roots = this.#roots();
      const target = e.key === 'Home' ? roots[0] : roots[roots.length - 1];
      if (target && target !== popup) {
        try { target.showPopover(); } catch { /* noop */ }
      }
      return;
    }

    // Roving arrows + Home/End within nested menus only (the root level owns
    // Home/End for menu switching above).
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

  // Bar-level keys: Left/Right/Home/End rove the triggers, ArrowDown opens.
  // Enter/Space toggle via native popovertarget activation.
  #barKeys(e) {
    const trigger = e.target.closest?.('[popovertarget]');
    if (!trigger || !this.#triggers().includes(trigger)) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const menu = document.getElementById(trigger.getAttribute('popovertarget'));
      if (menu && !menu.matches(':popover-open')) {
        try { menu.showPopover(); } catch { /* noop */ }
      }
      return;
    }

    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();

    const triggers = this.#triggers()
      .filter((t) => !t.matches(':disabled, [disabled], [aria-disabled="true"]'));
    if (triggers.length === 0) return;

    const idx = triggers.indexOf(trigger);
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % triggers.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + triggers.length) % triggers.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = triggers.length - 1;

    triggers[next]?.focus();
    this.#resetTypeahead();
  }

  // Open the previous/next root menu (wraps around). Auto-popover exclusivity
  // hides the currently open tree when the new one shows.
  #step(dir) {
    const roots = this.#roots();
    const idx = roots.indexOf(this.#openRoot());
    if (idx < 0 || roots.length < 2) return;

    const next = roots[(idx + dir + roots.length) % roots.length];
    if (!next.matches(':popover-open')) {
      try { next.showPopover(); } catch { /* noop */ }
    }
  }

  #resetTypeahead() {
    this.#typeBuffer = '';
    this.#typeUntil = 0;
  }

  // The deepest open popover's enabled items: arrows never leave this set,
  // mirroring Radix's per-submenu focus trap.
  #currentItems() {
    const open = [...this.querySelectorAll('[popover]:popover-open')];
    if (open.length === 0) return [];
    const current = open.find((p) => !open.some((o) => o !== p && p.contains(o))) ?? open[0];

    const sel = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
    return [...current.querySelectorAll(sel)]
      .filter((el) => !el.matches(':disabled, [disabled], [aria-disabled="true"]'));
  }

  #place(popup) {
    const ctrl = this.#controlFor(popup);
    if (!ctrl) return;

    // Clean slate before measuring (see dropdown.js): stale inline top/left
    // plus the UA inset:0 stretch the surface and poison the flip math.
    popup.style.top = '0px';
    popup.style.left = '0px';
    popup.style.right = 'auto';
    popup.style.bottom = 'auto';

    const r = ctrl.getBoundingClientRect();
    const p = popup.getBoundingClientRect();
    const nested = ctrl.closest('[popover]') !== null;

    let top;
    let left;

    if (nested) {
      // Side placement: flush against the trigger's far edge, like Radix
      // sub-content with sideOffset -4 (overlaps the parent's padding).
      left = r.right - 4;
      if (left + p.width > window.innerWidth) left = r.left - p.width + 4;
      top = r.top - 5; /* compensate surface padding */
    } else {
      // Drop placement: below the bar trigger, flipped if it would overflow.
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

customElements.define('mo-menubar', OtMenubar);
