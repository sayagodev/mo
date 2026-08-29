/**
 * mo - InputOtp Component
 *
 * One-time-password field: <mo-otp> renders N joined single-character inputs
 * (shadcn/ui InputOTP behavior, natively — no external lib):
 * - Auto-advance on entry; Backspace on an empty cell steps back;
 *   ArrowLeft/Right move between cells.
 * - Paste distributes the clipboard characters across cells from the caret,
 *   as does autofill that drops a full code into one cell.
 * - data-pattern="numeric" (default) accepts digits only; "alphanumeric"
 *   accepts letters too.
 * - A hidden input[name] mirrors the assembled value for plain form submits.
 *
 * Usage:
 * <mo-otp length="6" name="code"></mo-otp>
 *
 * Attributes:
 *   length             - number of cells (default 4)
 *   name               - when set, a hidden input mirrors the full value
 *   value              - initial value, distributed left to right
 *   data-pattern       - "numeric" (default) | "alphanumeric"
 *   disabled           - disables every cell
 *
 * Properties:
 *   .value             - read/write string of the entered characters
 *
 * Events:
 *   change             - dispatched (bubbles) whenever the value changes.
 *                        detail = { value }
 */

import { MoBase } from './base.js';

const h = t => document.createElement(t);

/**
 * One-time-password field rendering N joined single-character cells.
 *
 * @tag mo-otp
 * @attr {number} length - Number of single-char cells (default 4, clamped 1-12).
 * @attr {string} name - Adds a hidden input mirroring the full value for native forms.
 * @attr {string} value - Initial code, distributed left to right.
 * @attr {string} data-pattern - "numeric" (default) or "alphanumeric".
 * @prop {string} value - Get or set the assembled code.
 * @fires {CustomEvent<{ value: string }>} change - The assembled value changed.
 */
class OtOtp extends MoBase {
  #cells = [];
  #hidden;
  #numeric = true;
  #synced = '';

  init() {
    const length = Math.min(12, Math.max(1, parseInt(this.getAttribute('length'), 10) || 4));
    this.#numeric = this.getAttribute('data-pattern') !== 'alphanumeric';
    const disabled = this.hasAttribute('disabled');
    const sepAttr = this.getAttribute('data-separator');
    // data-separator="2" or "2,2" or "3" -> separator interval(s)
    let sepInterval = 0;
    if (sepAttr && /^\d+$/.test(sepAttr.trim())) sepInterval = parseInt(sepAttr.trim(), 10);

    for (let i = 0; i < length; i++) {
      const cell = h('input');
      cell.type = 'text';
      cell.maxLength = 1;
      cell.inputMode = this.#numeric ? 'numeric' : 'text';
      cell.autocomplete = i === 0 ? 'one-time-code' : 'off';
      cell.spellcheck = false;
      cell.disabled = disabled;
      cell.setAttribute('aria-label', `Digit ${i + 1} of ${length}`);
      this.appendChild(cell);
      this.#cells.push(cell);

      if (sepInterval && (i + 1) % sepInterval === 0 && i !== length - 1) {
        const sep = h('span');
        sep.setAttribute('data-otp-separator', '');
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '—';
        sep.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;padding:0 var(--space-2);color:var(--muted-foreground);user-select:none;';
        this.appendChild(sep);
      }
    }

    // Form mirror: appended last so it can never win the initial focus.
    if (this.hasAttribute('name')) {
      this.#hidden = h('input');
      this.#hidden.type = 'hidden';
      this.#hidden.name = this.getAttribute('name');
      this.appendChild(this.#hidden);
    }

    const initial = this.getAttribute('value');
    if (initial) {
      const chars = this.#sanitize(initial);
      this.#cells.forEach((cell, i) => { cell.value = chars[i] ?? ''; });
      this.#synced = this.value;
      if (this.#hidden) this.#hidden.value = this.#synced;
    }

    this.addEventListener('input', this);
    this.addEventListener('keydown', this);
    this.addEventListener('paste', this);
    this.addEventListener('click', this);
    this.addEventListener('focusin', this);
  }

  get value() {
    return this.#cells.map(c => c.value).join('');
  }

  set value(v) {
    const chars = this.#sanitize(String(v ?? ''));
    this.#cells.forEach((cell, i) => { cell.value = chars[i] ?? ''; });
    this.#sync();
  }

  // Only the active pattern's characters survive; typing, paste, autofill
  // and programmatic writes all funnel through here.
  #sanitize(text) {
    return [...String(text)].filter(c => (this.#numeric ? /\d/ : /[a-z0-9]/i).test(c));
  }

  oninput(e) {
    const cell = e.target;
    if (!(cell instanceof HTMLInputElement) || !this.#cells.includes(cell)) return;

    const chars = this.#sanitize(cell.value);

    // Autofill/IME dropping a whole code into one cell: distribute it like
    // a paste instead of keeping only the last digit.
    if (chars.length > 1) {
      cell.value = '';
      return this.#distribute(cell, chars);
    }

    cell.value = chars[0] ?? '';
    if (cell.value) {
      const next = this.#cells[this.#cells.indexOf(cell) + 1];
      if (next) next.focus();
      else {
        // Last cell of this group filled: try to advance to next mo-otp in the same container (separator case with two components)
        const nextOtp = this.#findNextOtp();
        if (nextOtp) nextOtp.querySelector('input')?.focus();
      }
    }

    this.#sync();
  }

  onfocusin(e) {
    const cell = e.target;
    if (!(cell instanceof HTMLInputElement) || !this.#cells.includes(cell)) return;
    // Select existing digit so typing overwrites it (shadcn behavior).
    requestAnimationFrame(() => {
      try { cell.select(); } catch {}
    });
  }

  onkeydown(e) {
    const cell = e.target;
    if (!(cell instanceof HTMLInputElement) || !this.#cells.includes(cell)) return;
    const i = this.#cells.indexOf(cell);

    if (e.key === 'Backspace') {
      if (!cell.value) {
        e.preventDefault();
        const prev = this.#cells[i - 1];
        if (prev) { prev.value = ''; prev.focus(); this.#sync(); }
      } else {
        // Filled cell: allow browser to clear, but select ensures next type replaces.
        // If user holds backspace, clear and move left on next empty.
      }
      return;
    }

    if (e.key === 'Delete') {
      if (cell.value) {
        // Allow clear without moving
      } else {
        e.preventDefault();
        // Delete on empty could shift? mimic shadcn: do nothing
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.#cells[i - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.#cells[i + 1]?.focus();
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      this.#cells[0]?.focus();
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      this.#cells[this.#cells.length - 1]?.focus();
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (this.#sanitize(e.key).length === 0) {
        e.preventDefault(); // reject off-pattern keys up front
        return;
      }
      // Printable valid char on a filled cell without selection: clear first so input overwrites.
      if (cell.value && cell.selectionStart === cell.selectionEnd) {
        // If no selection (focusin select failed e.g. click not select), clear to allow overwrite.
        // Use timeout so input event sees the new char, not old+new.
        cell.value = '';
      }
    }
  }

  onpaste(e) {
    const cell = e.target;
    if (!(cell instanceof HTMLInputElement) || !this.#cells.includes(cell)) return;
    e.preventDefault();

    const chars = this.#sanitize(e.clipboardData?.getData('text') ?? '');
    if (chars.length > 0) this.#distribute(cell, chars);
  }

  onclick(e) {
    // Clicking the gaps between cells lands on the host: aim at the first
    // empty slot like the caret would.
    if (e.target instanceof HTMLInputElement) return;
    this.#cells.find(c => !c.value)?.focus();
  }

  #findNextOtp() {
    // Find the next <mo-otp> after this one within the same parent (used for the two-component separator demo)
    let el = this.nextElementSibling;
    while (el) {
      if (el.tagName?.toLowerCase() === 'mo-otp') return el;
      // Skip separator spans etc inside a wrapper
      const inner = el.querySelector?.('mo-otp');
      if (inner) return inner;
      el = el.nextElementSibling;
    }
    // Fallback: search in parent's children after this
    const parent = this.parentElement;
    if (!parent) return null;
    const otps = [...parent.querySelectorAll('mo-otp')];
    const idx = otps.indexOf(this);
    return otps[idx + 1] ?? null;
  }

  // Fill cells left to right starting at `start`, then focus the next slot.
  // If chars overflow this group's last cell, continue into the next mo-otp group.
  #distribute(startCell, chars) {
    const start = this.#cells.indexOf(startCell);
    const allOtps = this.#collectOtpChain();
    let charIdx = 0;

    // Find position in chain where startCell sits
    let otpIdx = allOtps.indexOf(this);
    let cellIdx = start;

    while (charIdx < chars.length && otpIdx < allOtps.length) {
      const otp = allOtps[otpIdx];
      const cells = otp.#cells;
      while (cellIdx < cells.length && charIdx < chars.length) {
        cells[cellIdx].value = chars[charIdx++];
        cellIdx++;
      }
      if (charIdx < chars.length) {
        otpIdx++;
        cellIdx = 0;
      }
    }

    // Focus the slot after the last distributed char
    if (otpIdx < allOtps.length) {
      const targetOtp = allOtps[otpIdx];
      if (cellIdx < targetOtp.#cells.length) targetOtp.#cells[cellIdx]?.focus();
      else targetOtp.#cells[targetOtp.#cells.length - 1]?.focus();
    } else {
      allOtps[allOtps.length - 1]?.#cells[allOtps[allOtps.length - 1].#cells.length - 1]?.focus();
    }

    // Sync all otps in the chain that were touched
    for (const otp of allOtps) otp.#sync();
  }

  #collectOtpChain() {
    // Collect this otp plus following sibling otps inside the same parent (for the 3+3 separator demo)
    const parent = this.parentElement;
    if (!parent) return [this];
    const otps = [...parent.querySelectorAll('mo-otp')];
    const idx = otps.indexOf(this);
    if (idx === -1) return [this];
    // Include this and subsequent otps that are visually part of the same group (no other inputs between)
    const chain = [this];
    for (let i = idx + 1; i < otps.length; i++) {
      const prev = otps[i - 1];
      const cur = otps[i];
      // Only include if they are close siblings (within same parent and separated by at most a separator element)
      let between = prev.nextElementSibling;
      let isAdjacent = false;
      while (between && between !== cur) {
        if (between.tagName?.toLowerCase() === 'mo-otp') break;
        if (between.hasAttribute?.('data-otp-separator') || between.textContent?.trim() === '—' || between.textContent?.trim() === '-') isAdjacent = true;
        between = between.nextElementSibling;
      }
      if (between === cur || isAdjacent) chain.push(cur);
      else break;
    }
    return chain;
  }

  #sync() {
    const v = this.value;
    if (v === this.#synced) return;
    this.#synced = v;
    if (this.#hidden) this.#hidden.value = v;
    this.emit('change', { value: v });
  }
}

customElements.define('mo-otp', OtOtp);
