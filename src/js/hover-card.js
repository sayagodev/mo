/**
 * mo - HoverCard Component
 *
 * Trigger + card revealed on hover/focus, like shadcn/ui HoverCard:
 * - Opens ~200ms after pointer enters the trigger (hover intent).
 * - Closes ~100ms after the pointer leaves BOTH trigger and card (grace
 *   period lets the cursor cross the gap between them).
 * - Focus follows the same lifecycle so keyboard users get the card.
 * - Esc closes natively via the Popover API's light dismiss.
 * - The card places below the trigger; data-side="top" on the card prefers
 *   above. Either side flips on viewport overflow (left/right are not
 *   explicit placements — they resolve through the flip).
 *
 * Usage:
 * <mo-hovercard>
 *   <button type="button" class="link">@nextjs</button>
 *   <div popover id="hc1">…</div>
 * </mo-hovercard>
 */

import { MoBase } from './base.js';

const OPEN_DELAY = 200;
const CLOSE_DELAY = 100;

/**
 * HoverCard revealing a popover card on trigger hover or focus.
 *
 * @tag mo-hovercard
 * @attr {string} data-side - On the card child: "top" or "bottom" preferred placement (flips on overflow).
 */
class OtHoverCard extends MoBase {
  #trigger;
  #card;
  #openTimer;
  #closeTimer;

  init() {
    this.#trigger = this.querySelector(':scope > :not([popover])');
    this.#card = this.querySelector(':scope > [popover]');
    if (!this.#trigger || !this.#card) return;

    this.#trigger.ariaExpanded = 'false';
    // beforetoggle does not bubble; listen directly on the card.
    // Placement runs on 'toggle' (state already applied, rects measurable).
    this.#card.addEventListener('beforetoggle', this);
    this.#card.addEventListener('toggle', this);
    for (const el of [this.#trigger, this.#card]) {
      el.addEventListener('pointerenter', this);
      el.addEventListener('pointerleave', this);
      el.addEventListener('focusin', this);
      el.addEventListener('focusout', this);
    }
  }

  cleanup() {
    clearTimeout(this.#openTimer);
    clearTimeout(this.#closeTimer);
    window.removeEventListener('scroll', this.#reposition, true);
    window.removeEventListener('resize', this.#reposition);
  }

  onbeforetoggle(e) {
    if (!(e.target instanceof HTMLElement)) return;
    const open = e.newState === 'open';
    this.#trigger.ariaExpanded = String(open);

    if (!open) {
      clearTimeout(this.#closeTimer);
      window.removeEventListener('scroll', this.#reposition, true);
      window.removeEventListener('resize', this.#reposition);
      return;
    }

    window.addEventListener('scroll', this.#reposition, true);
    window.addEventListener('resize', this.#reposition);
  }

  // 'toggle' fires once :popover-open has applied, so rects are real here.
  ontoggle(e) {
    if (!(e.target instanceof HTMLElement) || e.newState !== 'open') return;
    this.#place();
  }

  onpointerenter() {
    clearTimeout(this.#closeTimer);
    if (this.#card.matches(':popover-open')) return;
    clearTimeout(this.#openTimer);
    this.#openTimer = setTimeout(() => this.#show(), OPEN_DELAY);
  }

  onpointerleave(e) {
    // Ignore transitions into the trigger/card itself (e.g. moving over
    // children); the close grace period covers the gap between surfaces.
    if (this.contains(e.relatedTarget)) return;
    clearTimeout(this.#openTimer);
    this.#hideAfterGrace();
  }

  onfocusin(e) {
    clearTimeout(this.#closeTimer);
    if (this.#card.matches(':popover-open')) return;
    clearTimeout(this.#openTimer);
    this.#openTimer = setTimeout(() => this.#show(), OPEN_DELAY);
  }

  onfocusout(e) {
    if (this.contains(e.relatedTarget)) return;
    clearTimeout(this.#openTimer);
    this.#hideAfterGrace();
  }

  #show() {
    try {
      if (!this.#card.matches(':popover-open')) this.#card.showPopover();
    } catch { /* ancestor closed meanwhile */ }
  }

  #hideAfterGrace() {
    clearTimeout(this.#closeTimer);
    this.#closeTimer = setTimeout(() => {
      if (this.#card.matches(':popover-open')) this.#card.hidePopover();
    }, CLOSE_DELAY);
  }

  // Placement: supports data-side="top" | "bottom" | "left" | "right".
  // Each prefers that edge and flips on overflow. Bottom is default.
  #place() {
    const t = this.#trigger.getBoundingClientRect();
    const c = this.#card.getBoundingClientRect();
    const side = this.#card.dataset.side;
    const gap = 4;

    const fits = {
      top: t.top - c.height >= gap,
      bottom: t.bottom + c.height <= window.innerHeight - gap,
      left: t.left - c.width >= gap,
      right: t.right + c.width <= window.innerWidth - gap,
    };

    let resolved = side;
    if (side === 'top') resolved = fits.top || !fits.bottom ? 'top' : 'bottom';
    else if (side === 'bottom') resolved = fits.bottom || !fits.top ? 'bottom' : 'top';
    else if (side === 'left') resolved = fits.left || !fits.right ? 'left' : 'right';
    else if (side === 'right') resolved = fits.right || !fits.left ? 'right' : 'left';
    else {
      // default bottom with flip
      if (!fits.bottom && fits.top) resolved = 'top';
      else resolved = 'bottom';
    }

    let top, left;
    if (resolved === 'top') {
      top = Math.max(gap, t.top - c.height - gap);
      left = t.left + (t.width - c.width) / 2;
    } else if (resolved === 'bottom') {
      top = t.bottom + gap;
      left = t.left + (t.width - c.width) / 2;
    } else if (resolved === 'left') {
      top = t.top + (t.height - c.height) / 2;
      left = Math.max(gap, t.left - c.width - gap);
    } else { // right
      top = t.top + (t.height - c.height) / 2;
      left = t.right + gap;
    }

    left = Math.max(gap, Math.min(left, window.innerWidth - c.width - gap));
    top = Math.max(gap, Math.min(top, window.innerHeight - c.height - gap));

    this.#card.dataset.side = resolved;
    this.#card.style.top = `${top}px`;
    this.#card.style.left = `${left}px`;
  }

  #reposition = () => {
    if (this.#card?.matches(':popover-open')) this.#place();
  };
}

customElements.define('mo-hovercard', OtHoverCard);
