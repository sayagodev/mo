/**
 * mo - ToggleGroup Component
 *
 * Orchestrates the existing button[aria-pressed] toggles inside a group:
 * - type="single" (default): activating one un-presses its siblings, like a
 *   radio group. Add collapsible to allow unpressing the active one.
 * - type="multiple": each button flips independently.
 * Emits 'mo-toggle-change' with { values: [...] } after every change.
 *
 * Keyboard: buttons are plain Tab stops (no roving tabindex).
 *
 * Usage:
 * <mo-toggle-group type="single">
 *   <button type="button" value="left" aria-pressed="true">Left</button>
 *   <button type="button" value="right" aria-pressed="false">Right</button>
 * </mo-toggle-group>
 */

import { MoBase } from './base.js';

/**
 * Toggle group orchestrating button[aria-pressed] children.
 *
 * @tag mo-toggle-group
 * @attr {string} type - "single" (default, keeps one pressed) or "multiple" (independent).
 * @attr {boolean} collapsible - Single mode: allow unpressing the active button.
 * @method values - Currently pressed values.
 * @fires {CustomEvent<{ values: string[] }>} mo-toggle-change - Pressed set changed.
 */
class OtToggleGroup extends MoBase {
  #buttons = [];

  init() {
    this.#buttons = [...this.querySelectorAll(':scope > button[aria-pressed]')];
    if (this.#buttons.length === 0) return;

    if (!this.getAttribute('role')) this.setAttribute('role', 'group');
    // The base.js global two-state flip must not double-toggle grouped
    // buttons, so clicks are handled here and stopped from bubbling.
    this.addEventListener('click', this);
  }

  onclick(e) {
    const button = e.target.closest('button[aria-pressed]');
    if (!this.contains(button)) return;
    e.stopPropagation();
    if (button.matches(':disabled, [disabled], [aria-disabled="true"]')) return;

    const multiple = this.getAttribute('type') === 'multiple';
    const pressed = button.getAttribute('aria-pressed') !== 'true';

    // Single non-collapsible groups always keep one value pressed.
    if (!multiple && !pressed && !this.hasAttribute('collapsible')) return;

    if (multiple) {
      button.setAttribute('aria-pressed', String(pressed));
    } else {
      for (const b of this.#buttons) {
        b.setAttribute('aria-pressed', String(b === button));
      }
    }

    this.emit('mo-toggle-change', { values: this.values() });
  }

  values() {
    return this.#buttons
      .filter((b) => b.getAttribute('aria-pressed') === 'true')
      .map((b) => b.value);
  }
}

customElements.define('mo-toggle-group', OtToggleGroup);
