/**
 * mo - Navigation Menu Component
 *
 * Orchestrates nav triggers + their native popover panels, shadcn-style:
 * - Hover opens a panel after a short delay (default, like Radix
 *   delayDuration 200) and keeps it open while the pointer travels between
 *   trigger and panel. data-open="click" requires explicit clicks instead.
 * - Click toggles in both modes; Esc / outside click close natively and
 *   aria-expanded stays in sync via the toggle event.
 * - ArrowLeft/ArrowRight rove between top-level items; ArrowDown opens the
 *   focused trigger's panel.
 * - Panels are placed below their trigger (centered, 6px gap) with viewport
 *   flipping, and reposition on scroll/resize.
 *
 * Usage:
 * <mo-navigation-menu>
 *   <nav data-navigation-menu>
 *     <ul>
 *       <li><a data-navigation-link href="#">Docs</a></li>
 *       <li>
 *         <button type="button" popovertarget="nm1">Components ▾</button>
 *         <div popover id="nm1" class="popover">…</div>
 *       </li>
 *     </ul>
 *   </nav>
 * </mo-navigation-menu>
 *
 * @tag mo-navigation-menu
 * @attr {string} data-open - "hover" (default) · "click": how panels open.
 */
import { MoBase } from './base.js';

class MoNavigationMenu extends MoBase {
  #triggers = [];
  #openTimer = null;
  #closeTimer = null;

  init() {
    this.#triggers = [...this.querySelectorAll('li > button[popovertarget]')];
    this.#triggers.forEach((t) => t.setAttribute('aria-haspopup', 'true'));

    this.addEventListener('pointerenter', this, true);
    this.addEventListener('pointerleave', this, true);
    this.addEventListener('toggle', this, true);
    this.addEventListener('keydown', this, true);
  }

  cleanup() {
    clearTimeout(this.#openTimer);
    clearTimeout(this.#closeTimer);
    window.removeEventListener('scroll', this.#reposition, true);
    window.removeEventListener('resize', this.#reposition);
  }

  #popoverFor(trigger) {
    return document.getElementById(trigger.getAttribute('popovertarget'));
  }

  #isHoverMode() {
    return this.dataset.open !== 'click';
  }

  onpointerenter(e) {
    if (!this.#isHoverMode()) return;
    const trigger = e.target.closest('li > button[popovertarget]');
    const panel = trigger ? this.#popoverFor(trigger) : null;

    // Pointer entered the trigger or its open panel → cancel pending close.
    if (trigger || e.target.closest('[popover]')) {
      clearTimeout(this.#closeTimer);
    }

    // Hover intent: open shortly after entering the trigger.
    if (trigger && panel && !panel.matches(':popover-open')) {
      clearTimeout(this.#openTimer);
      this.#openTimer = setTimeout(() => {
        try {
          panel.showPopover();
        } catch { /* already open or ancestor blocked */ }
      }, 200);
    }
  }

  onpointerleave(e) {
    if (!this.#isHoverMode()) return;
    // Leaving the whole menu root (trigger + panels live inside) → close.
    if (e.target === this) {
      clearTimeout(this.#openTimer);
      this.#closeTimer = setTimeout(() => this.#closeAll(), 250);
    }
  }

  onkeydown(e) {
    const items = [...this.querySelectorAll('li > :is(a[data-navigation-link], button[popovertarget])')];
    const idx = items.indexOf(e.target);
    if (idx === -1) return;

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (idx + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    } else if (e.key === 'ArrowDown') {
      const trigger = e.target.closest('li > button[popovertarget]');
      if (!trigger) return;
      e.preventDefault();
      const panel = this.#popoverFor(trigger);
      if (panel && !panel.matches(':popover-open')) {
        try {
          panel.showPopover();
        } catch { /* noop */ }
      }
    }
  }

  ontoggle(e) {
    const panel = e.target;
    if (!(panel instanceof HTMLElement) || !panel.matches('[popover]')) return;
    const trigger = this.#triggers.find((t) => this.#popoverFor(t) === panel);
    if (!trigger) return;

    if (e.newState === 'open') {
      trigger.ariaExpanded = 'true';
      window.addEventListener('scroll', this.#reposition, true);
      window.addEventListener('resize', this.#reposition);
      this.#place(panel);
    } else {
      trigger.ariaExpanded = 'false';
      window.removeEventListener('scroll', this.#reposition, true);
      window.removeEventListener('resize', this.#reposition);
    }
  }

  #closeAll() {
    for (const t of this.#triggers) {
      const panel = this.#popoverFor(t);
      if (panel?.matches(':popover-open')) panel.hidePopover();
    }
  }

  #place(panel) {
    const trigger = this.#triggers.find((t) => this.#popoverFor(t) === panel);
    if (!trigger) return;

    // Clean slate before measuring (see dropdown.js): stale inline top/left
    // plus the UA inset:0 stretch the surface and poison the flip math.
    panel.style.top = '0px';
    panel.style.left = '0px';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';

    const r = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const offset = 6; /* mt-1.5 */
    const margin = 4;

    let top = r.bottom + offset;
    let left = r.left + r.width / 2 - p.width / 2;
    if (top + p.height > window.innerHeight - margin) top = r.top - p.height - offset;
    left = Math.max(margin, Math.min(left, window.innerWidth - p.width - margin));
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
  }

  #reposition = () => {
    for (const t of this.#triggers) {
      const panel = this.#popoverFor(t);
      if (panel?.matches(':popover-open')) this.#place(panel);
    }
  };
}

customElements.define('mo-navigation-menu', MoNavigationMenu);