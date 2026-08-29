/**
 * mo - Accordion Component
 * Orchestrates details/summary children so they behave like a shadcn Accordion.
 *
 * Usage:
 * <mo-accordion type="single" collapsible>
 *   <details><summary>Item 1</summary><p>Content</p></details>
 *   <details open><summary>Item 2</summary><p>Content</p></details>
 * </mo-accordion>
 *
 * type="single" (default): opening one item closes the others.
 *   Without collapsible one item always stays open, like shadcn.
 *   Add collapsible to let the open item close itself.
 * type="multiple": items are independent, like native details.
 *
 * details[disabled] blocks the trigger for mouse and keyboard.
 */

import { MoBase } from './base.js';

/**
 * Accordion orchestrating details/summary children into single/multiple modes.
 *
 * @tag mo-accordion
 * @attr {string} type - "single" (default, opening one closes the others) or "multiple" (independent items).
 * @attr {boolean} collapsible - Single mode: allow all items closed. Present = true.
 * @fires {CustomEvent<{ item: HTMLDetailsElement }>} mo-accordion-change - A sibling item was closed by single mode.
 */
class MoAccordion extends MoBase {
  #items = [];

  init() {
    this.#items = [...this.querySelectorAll(':scope > details')];
    if (this.#items.length === 0) return;

    // toggle does not bubble; capture it as it crosses this element's tree.
    this.addEventListener('toggle', this, true);
    // Native summary activation happens before we see the toggle event,
    // so guard clicks and key presses to enforce disabled/collapsible.
    this.addEventListener('click', this, true);
    this.addEventListener('keydown', this, true);
    this.#sync();
  }

  cleanup() {
    this.removeEventListener('toggle', this, true);
    this.removeEventListener('click', this, true);
    this.removeEventListener('keydown', this, true);
  }

  onclick(e) {
    const summary = e.target.closest?.('summary');
    if (!summary) return;

    const item = summary.parentElement;
    if (!this.#items.includes(item)) return;
    if (item.hasAttribute('disabled')) {
      e.preventDefault();
      return;
    }

    // Non-collapsible single mode keeps its open item open.
    if (this.#mustStayOpen(item)) e.preventDefault();
  }

  onkeydown(e) {
    const summary = e.target.closest?.('summary');
    if (!summary) return;

    const item = summary.parentElement;
    if (!this.#items.includes(item)) return;

    // Arrow navigation like shadcn/Radix accordion (vertical)
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      const summaries = this.#items.map(it => it.querySelector(':scope > summary'));
      const idx = summaries.indexOf(summary);
      if (idx < 0) return;

      // Find next enabled index, skipping disabled items
      let next = -1;
      if (e.key === 'Home') {
        next = this.#items.findIndex(it => !it.hasAttribute('disabled'));
      } else if (e.key === 'End') {
        for (let i = this.#items.length - 1; i >= 0; i--) {
          if (!this.#items[i].hasAttribute('disabled')) { next = i; break; }
        }
      } else {
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        let cur = idx;
        for (let i = 0; i < this.#items.length; i++) {
          cur = (cur + dir + this.#items.length) % this.#items.length;
          if (!this.#items[cur].hasAttribute('disabled')) { next = cur; break; }
        }
      }

      if (next >= 0) {
        e.preventDefault();
        summaries[next]?.focus();
      }
      return;
    }

    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (item.hasAttribute('disabled') || this.#mustStayOpen(item)) {
      e.preventDefault();
    }
  }

  #mustStayOpen(item) {
    return this.type === 'single' && !this.collapsible && item.open &&
      !this.#items.some(other => other !== item && other.open);
  }

  ontoggle(e) {
    const target = e.target;
    if (!this.#items.includes(target) || !target.open) return;
    if (this.type !== 'single') return;

    // Opening one item closes the others.
    for (const item of this.#items) {
      if (item !== target && item.open) {
        item.open = false;
        this.emit('mo-accordion-change', { item });
      }
    }
  }

  get type() {
    return this.getAttribute('type') || 'single';
  }

  set type(value) {
    this.setAttribute('type', value);
    this.#sync();
  }

  get collapsible() {
    return this.hasAttribute('collapsible');
  }

  set collapsible(value) {
    this.toggleAttribute('collapsible', Boolean(value));
    this.#sync();
  }

  // Enforce the invariant after any programmatic change: in single mode
  // only the first open item stays open (zero if collapsible).
  #sync() {
    if (this.type !== 'single' || this.#items.length === 0) return;
    let seenOpen = false;
    for (const item of this.#items) {
      if (!item.open) continue;
      if (seenOpen) item.open = false;
      else seenOpen = true;
    }
    // Non-collapsible single must keep one item open
    if (!seenOpen && !this.collapsible) {
      const firstEnabled = this.#items.find(it => !it.hasAttribute('disabled'));
      if (firstEnabled) firstEnabled.open = true;
    }
  }
}

customElements.define('mo-accordion', MoAccordion);
