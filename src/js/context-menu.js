/**
 * mo - Context Menu Component (Radix-aligned, manual popover)
 *
 * Uses native Popover API with `popover="manual"` to avoid the browser's
 * auto light-dismiss race that caused the menu to flash-close on right-click.
 * Positioning mirrors shadcn/Radix via Floating-UI-inspired side/align/sideOffset
 * with collision handling, and trigger via `contextmenu` + long-press + keyboard.
 */

class OtContextMenu {
  #el;
  #point = { x: 0, y: 0 };
  #hoverTimer;
  #typeBuffer = '';
  #typeUntil = 0;
  #outsideHandler = null;
  #pressTimer = null;
  #pressPoint = null;

  constructor(el) {
    this.#el = el;

    for (const popup of el.querySelectorAll('menu[popover]')) {
      if (!popup.getAttribute('role')) popup.setAttribute('role', 'menu');
      // Switch to manual so the browser does not auto-dismiss before we place.
      // Keep as manual for full control; show/hide is imperative.
      popup.setAttribute('popover', 'manual');
      // Remember original configured side (if any) so pointer-anchored menus don't become side-anchored after first open
      popup._origSide = popup.getAttribute('data-side');
      // Ensure data-state sync for CSS animations
      popup.dataset.state = 'closed';
    }

    el.addEventListener('beforetoggle', this, true);
    el.addEventListener('toggle', this, true);
    el.addEventListener('contextmenu', this);
    el.addEventListener('click', this);
    el.addEventListener('keydown', this);
    el.addEventListener('pointerover', this);
    // Long-press for touch + pointer tracking for reposition
    el.addEventListener('pointerdown', this);
    el.addEventListener('pointermove', this);
    el.addEventListener('pointerup', this);
    el.addEventListener('pointercancel', this);
  }

  destroy() {
    this.cleanup();
    this.#el.removeEventListener('beforetoggle', this, true);
    this.#el.removeEventListener('toggle', this, true);
    this.#el.removeEventListener('contextmenu', this);
    this.#el.removeEventListener('click', this);
    this.#el.removeEventListener('keydown', this);
    this.#el.removeEventListener('pointerover', this);
    this.#el.removeEventListener('pointerdown', this);
    this.#el.removeEventListener('pointermove', this);
    this.#el.removeEventListener('pointerup', this);
    this.#el.removeEventListener('pointercancel', this);
  }

  cleanup() {
    clearTimeout(this.#hoverTimer);
    clearTimeout(this.#pressTimer);
    this.#pressPoint = null;
    window.removeEventListener('scroll', this.#reposition, true);
    window.removeEventListener('resize', this.#reposition);
    if (this.#outsideHandler) {
      document.removeEventListener('pointerdown', this.#outsideHandler, true);
      document.removeEventListener('keydown', this.#outsideHandler, true);
      this.#outsideHandler = null;
    }
  }

  handleEvent(event) {
    const handler = this[`on${event.type}`];
    if (handler) handler.call(this, event);
  }

  emit(name, detail = null) {
    return this.#el.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail
    }));
  }

  rootMenu() {
    return this.#el.querySelector('menu[popover]');
  }

  #controlFor(popup) {
    if (popup === this.rootMenu()) return null;
    return this.#el.querySelector(`[popovertarget="${CSS.escape(popup.id)}"]`);
  }

  #isOpen(popup) {
    return popup?.matches(':popover-open');
  }

  #closeAll() {
    for (const p of this.#el.querySelectorAll('menu[popover]:popover-open')) {
      try { p.hidePopover(); } catch {}
    }
  }

  #openAtPoint(menu) {
    if (!menu) return;
    if (this.#isOpen(menu)) {
      this.#place(menu);
      return;
    }
    // Pre-position at point to avoid 0,0 flash; then show
    menu.style.top = `${this.#point.y}px`;
    menu.style.left = `${this.#point.x}px`;
    try { menu.showPopover(); } catch {}
  }

  oncontextmenu(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.closest?.('[popover]')) return;
    const menu = this.rootMenu();
    if (!menu) return;
    this.#point = { x: e.clientX, y: e.clientY };
    this.#openAtPoint(menu);
  }

  onpointerdown(e) {
    // Touch long-press detection (pen/touch)
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
    if (e.button !== 0) return;
    if (e.target.closest?.('[popover]')) return;
    this.#pressPoint = { x: e.clientX, y: e.clientY };
    clearTimeout(this.#pressTimer);
    this.#pressTimer = setTimeout(() => {
      const menu = this.rootMenu();
      if (!menu || this.#isOpen(menu)) return;
      // Still within threshold and still pressed
      this.#point = { ...this.#pressPoint };
      this.#openAtPoint(menu);
    }, 600);
  }

  onpointermove(e) {
    if (!this.#pressPoint) return;
    if (Math.hypot(e.clientX - this.#pressPoint.x, e.clientY - this.#pressPoint.y) > 12) {
      clearTimeout(this.#pressTimer);
      this.#pressPoint = null;
    }
  }

  onpointerup(e) {
    clearTimeout(this.#pressTimer);
    this.#pressPoint = null;
    // Track last pointerdown button for potential outside handling (not needed with manual)
  }

  onpointercancel(e) {
    clearTimeout(this.#pressTimer);
    this.#pressPoint = null;
  }

  onbeforetoggle(e) {
    const popup = e.target;
    if (!(popup instanceof HTMLElement)) return;
    // Sync data-state for CSS (Radix-like)
    popup.dataset.state = e.newState === 'open' ? 'open' : 'closed';

    if (e.newState !== 'open') {
      if (popup === this.rootMenu()) {
        this.cleanup();
        return;
      }
      if (popup.contains(document.activeElement)) {
        this.#controlFor(popup)?.focus();
      }
      return;
    }

    window.addEventListener('scroll', this.#reposition, true);
    window.addEventListener('resize', this.#reposition);

    if (popup === this.rootMenu()) {
      // Dismiss on outside pointerdown and Escape, like DismissableLayer
      this.#outsideHandler = (ev) => {
        if (ev.type === 'keydown') {
          if (ev.key === 'Escape') {
            ev.preventDefault();
            // Close deepest first, then root
            const open = [...this.#el.querySelectorAll('menu[popover]:popover-open')];
            const deepest = open.find((p) => !open.some((o) => o !== p && p.contains(o))) ?? open[0];
            if (deepest) {
              try { deepest.hidePopover(); } catch {}
              if (deepest !== popup) ev.stopPropagation();
              else if (open.length === 1) { /* root closed */ }
            }
          }
          return;
        }
        if (ev.type === 'pointerdown') {
          // Ignore right-clicks that will become contextmenu (reposition)
          if (ev.button === 2) return;
          const path = ev.composedPath?.() ?? [];
          const insidePopover = path.some((n) => n instanceof HTMLElement && n.closest?.('menu[popover]:popover-open'));
          const insideTrigger = this.#el.contains(ev.target);
          // If click is inside an open popover, keep open
          if (insidePopover) return;
          // If click is inside the trigger area while menu is open, close (like native)
          // - but the next contextmenu will reopen, which is fine.
          // We close on any outside pointerdown.
          if (!insidePopover) {
            // Use rAF to allow contextmenu handler to run first if this was a right-click
            // (but we already returned for button 2). So left clicks close.
            this.#closeAll();
          }
        }
      };
      document.addEventListener('pointerdown', this.#outsideHandler, true);
      document.addEventListener('keydown', this.#outsideHandler, true);
    }
  }

  ontoggle(e) {
    const popup = e.target;
    if (!(popup instanceof HTMLElement) || e.newState !== 'open') return;

    this.#place(popup);

    if (popup === this.rootMenu()) {
      requestAnimationFrame(() => this.#currentItems()[0]?.focus());
    } else {
      const ctrl = this.#controlFor(popup);
      if (ctrl?.contains(document.activeElement)) {
        requestAnimationFrame(() => this.#currentItems()[0]?.focus());
      }
    }
  }

  onclick(e) {
    const item = e.target.closest('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]');
    if (!item || item.matches(':disabled, [disabled], [aria-disabled="true"]')) return;

    if (item.getAttribute('role') === 'menuitem' && !item.hasAttribute('popovertarget')) {
      this.#closeAll();
      return;
    }

    if (item.getAttribute('role') === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
      this.emit('mo-context-menu-change', { item, checked: item.getAttribute('aria-checked') === 'true' });
    } else if (item.getAttribute('role') === 'menuitemradio') {
      const group = item.closest('[role="group"], menu');
      for (const sibling of group.querySelectorAll('[role="menuitemradio"]')) {
        sibling.setAttribute('aria-checked', String(sibling === item));
      }
      this.emit('mo-context-menu-change', { item, checked: item.getAttribute('aria-checked') === 'true' });
    }
  }

  onpointerover(e) {
    if (!e.target.closest('[popover]')) return;

    for (const popup of [...this.#el.querySelectorAll('menu[popover]:popover-open')]) {
      if (popup === this.rootMenu()) continue;
      const ctrl = this.#controlFor(popup);
      if (!ctrl?.contains(e.target) && !popup.contains(e.target)) {
        try { popup.hidePopover(); } catch {}
      }
    }

    const trigger = e.target.closest('[role="menuitem"][popovertarget]');
    clearTimeout(this.#hoverTimer);
    if (trigger && !trigger.matches(':disabled, [disabled], [aria-disabled="true"]')) {
      const sub = document.getElementById(trigger.getAttribute('popovertarget'));
      if (sub && !sub.matches(':popover-open')) {
        this.#hoverTimer = setTimeout(() => {
          try { sub.showPopover(); } catch {}
        }, 120);
      }
    }
  }

  onkeydown(e) {
    // Support Shift+F10 / ContextMenu key to open at center of trigger
    if (!e.target.closest?.('[popover]') && (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) {
      if (this.#el.contains(e.target) || e.target === this.#el) {
        e.preventDefault();
        const r = this.#el.getBoundingClientRect();
        this.#point = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        this.#openAtPoint(this.rootMenu());
        return;
      }
    }

    const popup = e.target.closest?.('[popover]');
    if (!popup || !popup.matches(':popover-open')) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      this.#closeAll();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      // Handled via outsideHandler's keydown, but also close deepest here for immediate feedback
      try { popup.hidePopover(); } catch {}
      return;
    }

    if (e.key === 'ArrowRight') {
      const trigger = e.target.closest('[role="menuitem"][popovertarget]');
      if (!trigger) return;
      e.preventDefault();
      const sub = document.getElementById(trigger.getAttribute('popovertarget'));
      if (sub && !sub.matches(':popover-open')) {
        try { sub.showPopover(); } catch {}
        requestAnimationFrame(() => this.#currentItems()[0]?.focus());
      }
      return;
    }

    if (e.key === 'ArrowLeft' && popup !== this.rootMenu()) {
      e.preventDefault();
      try { popup.hidePopover(); } catch {}
      return;
    }

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
      this.#resetTypeahead();
    }
  }

  #resetTypeahead() {
    this.#typeBuffer = '';
    this.#typeUntil = 0;
  }

  #currentItems() {
    const open = [...this.#el.querySelectorAll('menu[popover]:popover-open')];
    if (open.length === 0) return [];
    const current = open.find((p) => !open.some((o) => o !== p && p.contains(o))) ?? open[0];

    const sel = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
    return [...current.querySelectorAll(sel)]
      .filter((el) => el.closest('menu[popover]') === current)
      .filter((el) => !el.matches(':disabled, [disabled], [aria-disabled="true"]'));
  }

  #place(popup) {
    // Ensure fixed positioning base
    popup.style.position = 'fixed';
    popup.style.margin = '0';
    popup.style.inset = 'auto';
    const p = popup.getBoundingClientRect();

    if (popup === this.rootMenu()) {
      const configuredSide = popup._origSide;
      if (configuredSide) {
        const r = this.#el.getBoundingClientRect();
        const gap = parseInt(popup.dataset.sideOffset || '4', 10);
        let top, left;
        let resolvedSide = configuredSide;
        if (configuredSide === 'top') {
          top = r.top - p.height - gap;
          left = r.left + (r.width - p.width) / 2 + parseInt(popup.dataset.alignOffset || '0', 10);
          if (top < gap) { top = r.bottom + gap; resolvedSide = 'bottom'; }
        } else if (configuredSide === 'bottom') {
          top = r.bottom + gap;
          left = r.left + (r.width - p.width) / 2 + parseInt(popup.dataset.alignOffset || '0', 10);
          if (top + p.height > window.innerHeight - gap) { top = r.top - p.height - gap; resolvedSide = 'top'; }
        } else if (configuredSide === 'left') {
          left = r.left - p.width - gap;
          top = r.top + (r.height - p.height) / 2 + parseInt(popup.dataset.alignOffset || '0', 10);
          if (left < gap) { left = r.right + gap; resolvedSide = 'right'; }
        } else if (configuredSide === 'right') {
          left = r.right + gap;
          top = r.top + (r.height - p.height) / 2 + parseInt(popup.dataset.alignOffset || '0', 10);
          if (left + p.width > window.innerWidth - gap) { left = r.left - p.width - gap; resolvedSide = 'left'; }
        }
        popup.style.top = `${Math.max(gap, Math.min(top, window.innerHeight - p.height - gap))}px`;
        popup.style.left = `${Math.max(gap, Math.min(left, window.innerWidth - p.width - gap))}px`;
        popup.dataset.side = resolvedSide;
        return;
      }
      // Pointer-anchored (Radix virtual anchor)
      let top = this.#point.y;
      let left = this.#point.x;
      const pad = 4;
      if (left + p.width > window.innerWidth - pad) left = this.#point.x - p.width;
      if (top + p.height > window.innerHeight - pad) top = this.#point.y - p.height;
      // Also flip if pointer near edge with side awareness for animation
      let resolvedSide = 'bottom';
      if (top < pad) resolvedSide = 'bottom';
      else if (top + p.height > window.innerHeight - pad) resolvedSide = 'top';
      popup.dataset.side = resolvedSide;
      popup.style.top = `${Math.max(pad, Math.min(top, window.innerHeight - p.height - pad))}px`;
      popup.style.left = `${Math.max(pad, Math.min(left, window.innerWidth - p.width - pad))}px`;
      return;
    }

    const ctrl = this.#controlFor(popup);
    if (!ctrl) return;

    const r = ctrl.getBoundingClientRect();
    const side = popup.dataset.side || 'right';
    const align = popup.dataset.align || 'start';
    const sideOffset = parseInt(popup.dataset.sideOffset || '0', 10);
    const alignOffset = parseInt(popup.dataset.alignOffset || '0', 10);
    let left, top;
    if (side === 'right') {
      left = r.right + sideOffset;
      if (left + p.width > window.innerWidth - 4) left = r.left - p.width - sideOffset;
    } else if (side === 'left') {
      left = r.left - p.width - sideOffset;
      if (left < 4) left = r.right + sideOffset;
    }
    if (align === 'start') top = r.top + alignOffset - 4;
    else if (align === 'center') top = r.top + (r.height - p.height) / 2 + alignOffset;
    else top = r.bottom - p.height + alignOffset;

    popup.style.top = `${Math.max(4, Math.min(top, window.innerHeight - p.height - 4))}px`;
    popup.style.left = `${Math.max(4, Math.min(left, window.innerWidth - p.width - 4))}px`;
    popup.dataset.side = side;
  }

  #reposition = () => {
    for (const popup of this.#el.querySelectorAll('menu[popover]:popover-open')) {
      this.#place(popup);
    }
  };
}

const controllers = new WeakMap();
export function scan(root = document) {
  for (const el of root.querySelectorAll('[data-context-menu]')) {
    if (!controllers.has(el)) controllers.set(el, new OtContextMenu(el));
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => scan(), { once: true });
} else {
  scan();
}
new MutationObserver(() => scan()).observe(document.documentElement, { childList: true, subtree: true });
