/**
 * mo - Tabs Component
 * Provides keyboard navigation and ARIA state management.
 *
 * Usage:
 * <mo-tabs>
 *   <div role="tablist">
 *     <button role="tab">Tab 1</button>
 *     <button role="tab">Tab 2</button>
 *   </div>
 *   <div role="tabpanel">Content 1</div>
 *   <div role="tabpanel">Content 2</div>
 * </mo-tabs>
 *
 * data-orientation="vertical" on the host turns the tablist into a column
 * navigated with ArrowUp/ArrowDown. The line look is pure CSS: set
 * data-variant="line" on the tablist.
 *
 * Add data-anchor="key" to deep link the active tab's id in the URL's #anchor.
 */

import { MoBase } from './base.js';

/**
 * Tabs with roving tabindex keyboard navigation and hash deep-linking.
 *
 * @tag mo-tabs
 * @attr {string} data-anchor - Deep-links the active tab id under this URL hash key.
 * @prop {number} activeIndex - Index of the active tab (get/set).
 * @fires {CustomEvent<{ index: number, tab: HTMLElement }>} mo-tab-change - Fired when the active tab changes.
 */
class MoTabs extends MoBase {
  #tabs = [];
  #panels = [];
  #anchor;
  #ids = [];

  init() {
    const tablist = this.querySelector(':scope > [role="tablist"]');
    this.#tabs = tablist ? [...tablist.querySelectorAll('[role="tab"]')] : [];
    this.#panels = [...this.querySelectorAll(':scope > [role="tabpanel"]')];

    if (this.#tabs.length === 0 || this.#panels.length === 0) {
      console.warn('mo-tabs: Missing tab or tabpanel elements');
      return;
    }

    // data-anchor="tab" deep-links the active tab's id in the URL's #anchor.
    this.#anchor = this.dataset.anchor;

    this.#tabs.forEach((tab, i) => {
      const panel = this.#panels[i];
      if (!panel) return;

      this.#ids[i] = tab.id || '';
      tab.id ||= `mo-tab-${this.uid()}`;
      panel.id ||= `mo-panel-${this.uid()}`;
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('aria-labelledby', tab.id);
    });

    tablist.addEventListener('click', this);
    tablist.addEventListener('keydown', this);
    if (this.#anchor) window.addEventListener('hashchange', this);

    // Select from the hash, else the marked tab, else the first.
    const marked = this.#tabs.findIndex(t => t.ariaSelected === 'true');
    const fromHash = this.#hashIndex();
    this.#activate(Math.max(0, fromHash >= 0 ? fromHash : marked), false);
  }

  cleanup() {
    window.removeEventListener('hashchange', this);
  }

  onclick(e) {
    const index = this.#tabs.indexOf(e.target.closest('[role="tab"]'));
    if (index >= 0) this.#activate(index);
  }

  onkeydown(e) {
    const target = e.target.closest('[role="tab"]');
    if (!target) return;

    // Manual activation: arrows move focus only (like shadcn/Radix manual),
    // Enter/Space activates the focused tab. This prevents layout shifts
    // when the user just wants to navigate past tabs.
    if (e.key === 'Enter' || e.key === ' ') {
      const idx = this.#tabs.indexOf(target);
      if (idx >= 0) {
        e.preventDefault();
        this.#activate(idx);
        target.focus();
      }
      return;
    }

    // Vertical tablists follow the APG: Up/Down instead of Left/Right.
    const vertical = this.dataset.orientation === 'vertical';
    // Use focused index, not activeIndex, for roving
    const focusedIdx = this.#tabs.indexOf(document.activeElement);
    const current = focusedIdx >= 0 ? focusedIdx : this.activeIndex;
    const next = this.keyNav(
      e,
      current,
      this.#tabs.length,
      vertical ? 'ArrowUp' : 'ArrowLeft',
      vertical ? 'ArrowDown' : 'ArrowRight',
      true,
    );
    if (next >= 0) {
      e.preventDefault();
      // Move focus only, don't activate
      this.#tabs.forEach((tab, i) => tab.tabIndex = i === next ? 0 : -1);
      this.#tabs[next].focus();
    }
  }

  onhashchange() {
    const idx = this.#hashIndex();
    if (idx >= 0) this.#activate(idx, false);
  }

  #activate(idx, syncHash = true) {
    this.#tabs.forEach((tab, i) => {
      const isActive = i === idx;
      tab.ariaSelected = String(isActive);
      tab.tabIndex = isActive ? 0 : -1;
    });
    this.#panels.forEach((panel, i) => panel.hidden = i !== idx);

    if (syncHash) this.#syncHash(idx);
    this.emit('mo-tab-change', { index: idx, tab: this.#tabs[idx] });
  }

  // Index of the tab whose id is in the hash, or return -1.
  #hashIndex() {
    const id = this.#anchor && new URLSearchParams(location.hash.slice(1)).get(this.#anchor);
    return id ? this.#ids.indexOf(id) : -1;
  }

  // Set the active tab's id in the URL hash under the anchor key, preserving any other eys.
  #syncHash(idx) {
    if (!this.#anchor) return;

    const params = new URLSearchParams(location.hash.slice(1));
    params.set(this.#anchor, this.#ids[idx]);
    for (const [k, v] of [...params]) {
      if (!v) params.delete(k);
    }

    const hash = params.toString();
    history.replaceState(null, '', hash ? `#${hash}` : location.pathname + location.search);
  }

  get activeIndex() {
    return this.#tabs.findIndex(t => t.ariaSelected === 'true');
  }

  set activeIndex(value) {
    if (value >= 0 && value < this.#tabs.length) {
      this.#activate(value);
    }
  }
}

customElements.define('mo-tabs', MoTabs);
