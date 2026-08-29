/**
 * mo - Questionnaire Component
 *
 * Multi-step form wizard over plain sibling <form data-questionnaire-step>
 * children. Only the active step is shown; Continue validates through the
 * platform (form.reportValidity() — zero custom rules, browser-native error
 * UI); completion merges every step into one FormData and emits
 * 'mo-questionnaire-complete' with { values }.
 *
 * Extended to match shadcn/ui Questionnaire features:
 * - Single/multiple choice via [data-questionnaire-choices] cards (radio/checkbox)
 *   with keyboard and click handling.
 * - Skip support via [data-questionnaire-skip] (optional steps).
 * - Freeform [data-questionnaire-input] and validation error slots.
 * - data-questionnaire-error populated when required choices are empty.
 *
 * Usage:
 * <mo-questionnaire>
 *   <div data-questionnaire-progress><!-- "Step X of N" + <progress> injected --></div>
 *   <form data-questionnaire-step data-required>
 *     <h3>Step title</h3>
 *     <p>Step description.</p>
 *     <div data-questionnaire-choices>
 *       <label data-questionnaire-choice>
 *         <input type="radio" name="q1" value="a" required hidden />
 *         <span data-indicator data-type="radio"></span>
 *         <span data-questionnaire-label>Option A <small data-questionnaire-description>desc</small></span>
 *       </label>
 *     </div>
 *     <div data-questionnaire-error></div>
 *     <footer>
 *       <button type="button" class="ghost" data-questionnaire-back>Back</button>
 *       <button type="button" class="outline" data-questionnaire-skip>Skip</button>
 *       <button type="submit">Continue</button>
 *     </footer>
 *   </form>
 *   <form data-questionnaire-step hidden>…</form>
 * </mo-questionnaire>
 *
 * Attributes:
 *   data-start  1-based step to open on (default 1)
 *   data-reset  reset all fields and return to step 1 after completion
 * Events:
 *   mo-questionnaire-complete — detail.values is a FormData of every step
 */

import { MoBase } from './base.js';

/**
 * Multi-step form wizard validating each step before advancing.
 *
 * @tag mo-questionnaire
 * @attr {number} data-start - 1-based step to open on (default 1).
 * @attr {boolean} data-reset - Clear fields and return to step 1 after completion.
 * @method values - All steps merged into one FormData.
 * @fires {CustomEvent<{ values: FormData }>} mo-questionnaire-complete - The last step was submitted.
 */
class OtQuestionnaire extends MoBase {
  #steps = [];
  #current = 1;

  init() {
    this.#steps = [...this.querySelectorAll(':scope > form[data-questionnaire-step]')];
    if (this.#steps.length === 0) return;

    const start = parseInt(this.getAttribute('data-start'), 10) || 1;
    this.#current = Math.min(Math.max(start, 1), this.#steps.length);

    this.addEventListener('submit', this);
    this.addEventListener('click', this);
    this.addEventListener('keydown', this);
    this.addEventListener('change', this);
    this.#render();
  }

  onclick(e) {
    if (e.target.closest('[data-questionnaire-back]')) {
      e.preventDefault();
      this.#show(this.#current - 1);
      return;
    }
    if (e.target.closest('[data-questionnaire-skip]')) {
      e.preventDefault();
      if (this.#current === this.#steps.length) {
        this.emit('mo-questionnaire-complete', { values: this.values() });
        if (this.hasAttribute('data-reset')) {
          for (const f of this.#steps) f.reset();
          this.#show(1);
        }
        return;
      }
      this.#show(this.#current + 1);
      return;
    }
    // Clicking a choice card should toggle its input (if click not on input itself)
    const choice = e.target.closest('[data-questionnaire-choice]');
    if (choice && !e.target.closest('input')) {
      const inp = choice.querySelector('input');
      if (inp && !inp.disabled) {
        inp.click();
      }
    }
  }

  onkeydown(e) {
    // Space/Enter on a focused choice card activates it
    const choice = e.target.closest?.('[data-questionnaire-choice]');
    if (choice && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const inp = choice.querySelector('input');
      if (inp) inp.click();
    }
  }

  onchange(e) {
    // Clear validation error when a choice is selected
    const step = e.target.closest?.('[data-questionnaire-step]');
    if (!step) return;
    const err = step.querySelector('[data-questionnaire-error]');
    if (err) err.textContent = '';
  }

  onsubmit(e) {
    // Steps never navigate the page: a submission advances or completes.
    e.preventDefault();
    if (!e.target.matches('[data-questionnaire-step]')) return;

    const step = e.target;

    // Custom required validation for choice groups (shadcn Questionnaire validation):
    // data-required on step means at least one choice must be selected; and
    // native required inputs are checked via reportValidity.
    if (step.hasAttribute('data-required') || step.hasAttribute('required')) {
      const choices = step.querySelector('[data-questionnaire-choices]');
      if (choices) {
        const hasChecked = choices.querySelector('input:checked');
        if (!hasChecked) {
          const err = step.querySelector('[data-questionnaire-error]');
          if (err) err.textContent = step.getAttribute('data-error') || 'Please select an option.';
          // Also try native validation UI if an input is required
          const firstInput = choices.querySelector('input');
          if (firstInput) firstInput.focus();
          return;
        }
      }
    }

    // Native validation for inputs/selects etc
    if (!step.reportValidity()) {
      // Populate error slot if present
      const err = step.querySelector('[data-questionnaire-error]');
      if (err && !err.textContent) {
        const invalid = step.querySelector(':invalid');
        if (invalid?.validationMessage) err.textContent = invalid.validationMessage;
      }
      return;
    }

    // Clear any previous error
    const err = step.querySelector('[data-questionnaire-error]');
    if (err) err.textContent = '';

    if (this.#current === this.#steps.length) {
      this.emit('mo-questionnaire-complete', { values: this.values() });
      if (this.hasAttribute('data-reset')) {
        for (const f of this.#steps) f.reset();
        this.#show(1);
      }
      return;
    }
    this.#show(this.#current + 1);
  }

  // Every step's fields merged into one FormData.
  values() {
    const all = new FormData();
    for (const form of this.#steps) {
      for (const [name, value] of new FormData(form)) all.append(name, value);
    }
    return all;
  }

  #show(step) {
    this.#current = Math.min(Math.max(step, 1), this.#steps.length);
    this.#render();

    // Hand focus to the incoming heading only while navigating inside.
    const title = this.#steps[this.#current - 1].querySelector('h3');
    if (title && this.contains(document.activeElement)) {
      title.tabIndex = -1;
      title.focus();
    }
  }

  #render() {
    const total = this.#steps.length;
    this.#steps.forEach((f, i) => { f.hidden = i !== this.#current - 1; });
    for (const b of this.querySelectorAll('[data-questionnaire-back]')) {
      b.hidden = this.#current === 1;
    }

    // Progress slot: count label beside a native <progress>, both created
    // on demand so an author-supplied bar/count is reused as-is.
    const slot = this.querySelector('[data-questionnaire-progress]');
    if (!slot) return;

    let count = slot.querySelector('[data-questionnaire-count]');
    if (!count) {
      count = document.createElement('small');
      count.setAttribute('data-questionnaire-count', '');
      count.setAttribute('aria-live', 'polite');
      slot.prepend(count);
    }
    count.textContent = `Step ${this.#current} of ${total}`;

    let bar = slot.querySelector('progress');
    if (!bar) {
      bar = document.createElement('progress');
      slot.append(bar);
    }
    bar.max = total;
    bar.value = this.#current;
  }
}

customElements.define('mo-questionnaire', OtQuestionnaire);
