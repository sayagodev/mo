/**
 * mo - Slider Component
 * Supports single, dual-range, multiple thumbs, vertical, controlled and disabled.
 *
 * Usage:
 * <mo-slider min="0" max="100" step="1" value="50"></mo-slider>
 * <mo-slider min="0" max="100" step="1" value="25,75"></mo-slider> // range
 * <mo-slider min="0" max="100" step="1" value="20,50,80"></mo-slider> // 3 thumbs
 * <mo-slider orientation="vertical" min="0" max="100" value="50"></mo-slider>
 * <mo-slider disabled value="30"></mo-slider>
 *
 * Attributes:
 *  value       - comma-separated numbers (e.g., "25,75")
 *  min/max/step - numeric bounds (defaults 0/100/1)
 *  orientation - "horizontal" (default) or "vertical"
 *  disabled    - boolean
 *
 * Properties:
 *  .value - array of numbers (e.g., [25,75])
 *
 * Events:
 *  input  - fires continuously while dragging (detail = values array)
 *  change - fires on commit (pointerup / blur / Enter)
 */

import { MoBase } from './base.js';

class MoSlider extends MoBase {
  #track = null;
  #range = null;
  #thumbs = [];
  #values = [];
  #min = 0;
  #max = 100;
  #step = 1;
  #orientation = 'horizontal';
  #dragging = null; // index of thumb being dragged
  #rect = null;

  init() {
    this.#min = parseFloat(this.getAttribute('min') ?? '0');
    this.#max = parseFloat(this.getAttribute('max') ?? '100');
    this.#step = parseFloat(this.getAttribute('step') ?? '1');
    this.#orientation = this.getAttribute('orientation') || this.dataset.orientation || 'horizontal';
    if (this.#orientation === 'vertical') this.setAttribute('data-orientation', 'vertical');

    const raw = this.getAttribute('value');
    if (raw) {
      this.#values = raw.split(',').map(v => this.#clamp(parseFloat(v.trim())));
    } else if (this.hasAttribute('default-value')) {
      this.#values = this.getAttribute('default-value').split(',').map(v => this.#clamp(parseFloat(v.trim())));
    } else {
      this.#values = [(this.#min + this.#max) / 2];
    }
    // sanitize NaN
    this.#values = this.#values.filter(v => !Number.isNaN(v));
    if (this.#values.length === 0) this.#values = [this.#min];
    this.#values.sort((a, b) => a - b);

    // Build DOM
    this.#track = document.createElement('div');
    this.#track.setAttribute('data-slider-track', '');
    this.#range = document.createElement('div');
    this.#range.setAttribute('data-slider-range', '');
    this.#track.appendChild(this.#range);
    this.appendChild(this.#track);

    this.#thumbs = this.#values.map((v, i) => {
      const thumb = document.createElement('div');
      thumb.setAttribute('role', 'slider');
      thumb.setAttribute('data-slider-thumb', '');
      thumb.setAttribute('tabindex', this.hasAttribute('disabled') ? '-1' : '0');
      thumb.setAttribute('aria-valuemin', String(this.#min));
      thumb.setAttribute('aria-valuemax', String(this.#max));
      thumb.setAttribute('aria-valuenow', String(v));
      thumb.setAttribute('aria-label', `Value ${i + 1}`);
      // Keyboard
      thumb.addEventListener('keydown', (e) => this.#onKey(e, i));
      thumb.addEventListener('focus', () => this.#updateAria());
      // Pointer
      thumb.addEventListener('pointerdown', (e) => this.#startDrag(e, i));
      return thumb;
    });
    this.#thumbs.forEach(t => this.appendChild(t));

    // Track click to jump nearest thumb
    this.#track.addEventListener('pointerdown', (e) => this.#onTrackPointer(e));

    this.#render();
    // Initialize nearby display for docs examples
    const initDisplay = this.closest('.vstack')?.querySelector('[data-value], [data-slider-value]');
    if (initDisplay) initDisplay.textContent = this.#values.join(' · ');

    // Observe attribute changes for controlled usage
    new MutationObserver(() => this.#syncFromAttr()).observe(this, { attributes: true, attributeFilter: ['value', 'min', 'max', 'step', 'disabled'] });
  }

  cleanup() {
    // nothing to clean
  }

  #clamp(v) {
    let c = Math.min(this.#max, Math.max(this.#min, v));
    // snap to step
    const steps = Math.round((c - this.#min) / this.#step);
    c = this.#min + steps * this.#step;
    // fix floating point
    return parseFloat(c.toFixed(5));
  }

  #percent(v) {
    return ((v - this.#min) / (this.#max - this.#min)) * 100;
  }

  #valueAt(percent) {
    const v = this.#min + (percent / 100) * (this.#max - this.#min);
    return this.#clamp(v);
  }

  #render() {
    const vertical = this.#orientation === 'vertical';
    // Update range fill
    if (this.#values.length === 1) {
      const p = this.#percent(this.#values[0]);
      if (vertical) {
        this.#range.style.bottom = '0';
        this.#range.style.height = `${p}%`;
        this.#range.style.top = 'auto';
      } else {
        this.#range.style.left = '0';
        this.#range.style.width = `${p}%`;
      }
    } else {
      const minP = this.#percent(Math.min(...this.#values));
      const maxP = this.#percent(Math.max(...this.#values));
      if (vertical) {
        this.#range.style.bottom = `${minP}%`;
        this.#range.style.height = `${maxP - minP}%`;
        this.#range.style.top = 'auto';
      } else {
        this.#range.style.left = `${minP}%`;
        this.#range.style.width = `${maxP - minP}%`;
      }
    }

    // Position thumbs
    this.#thumbs.forEach((thumb, i) => {
      const p = this.#percent(this.#values[i]);
      if (vertical) {
        thumb.style.bottom = `${p}%`;
        thumb.style.left = '50%';
        thumb.style.top = 'auto';
      } else {
        thumb.style.left = `${p}%`;
        thumb.style.top = '50%';
      }
      thumb.setAttribute('aria-valuenow', String(this.#values[i]));
    });

    // Update host value attribute without triggering observer loop
    const newVal = this.#values.join(',');
    if (this.getAttribute('value') !== newVal) {
      // Use a flag to avoid infinite loop? We'll just set; observer will sync but values same
      this.setAttribute('value', newVal);
    }
  }

  #syncFromAttr() {
    const raw = this.getAttribute('value');
    if (raw == null) return;
    const parsed = raw.split(',').map(v => this.#clamp(parseFloat(v.trim()))).filter(v => !Number.isNaN(v)).sort((a,b)=>a-b);
    if (parsed.length === 0) return;
    // Only update if different
    if (parsed.join(',') !== this.#values.join(',')) {
      this.#values = parsed;
      // If thumb count changed, rebuild thumbs
      if (parsed.length !== this.#thumbs.length) {
        this.#thumbs.forEach(t => t.remove());
        this.#thumbs = parsed.map((v,i)=>{
          const thumb = document.createElement('div');
          thumb.setAttribute('role','slider');
          thumb.setAttribute('data-slider-thumb','');
          thumb.setAttribute('tabindex', this.hasAttribute('disabled') ? '-1' : '0');
          thumb.setAttribute('aria-valuemin', String(this.#min));
          thumb.setAttribute('aria-valuemax', String(this.#max));
          thumb.setAttribute('aria-valuenow', String(v));
          thumb.setAttribute('aria-label', `Value ${i+1}`);
          thumb.addEventListener('keydown', (e)=>this.#onKey(e,i));
          thumb.addEventListener('pointerdown', (e)=>this.#startDrag(e,i));
          return thumb;
        });
        this.#thumbs.forEach(t=>this.appendChild(t));
      }
      this.#render();
    }
    // disabled
    const disabled = this.hasAttribute('disabled');
    this.#thumbs.forEach(t=> t.setAttribute('tabindex', disabled ? '-1':'0'));
    if (disabled) this.setAttribute('aria-disabled','true'); else this.removeAttribute('aria-disabled');
  }

  #onKey(e, idx) {
    if (this.hasAttribute('disabled')) return;
    let delta = 0;
    const vertical = this.#orientation === 'vertical';
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -this.#step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = this.#step;
    else if (e.key === 'Home') {
      e.preventDefault();
      this.#values[idx] = this.#min;
      this.#values.sort((a,b)=>a-b);
      this.#render();
      this.#emitInput();
      this.#emitChange();
      return;
    } else if (e.key === 'End') {
      e.preventDefault();
      this.#values[idx] = this.#max;
      this.#values.sort((a,b)=>a-b);
      this.#render();
      this.#emitInput();
      this.#emitChange();
      return;
    } else if (e.key === 'PageDown') delta = -this.#step * 10;
    else if (e.key === 'PageUp') delta = this.#step * 10;
    else return;

    e.preventDefault();
    const newVal = this.#clamp(this.#values[idx] + delta);
    // Prevent crossing neighbors? Allow but keep sorted.
    this.#values[idx] = newVal;
    this.#values.sort((a,b)=>a-b);
    // Find new index of this thumb after sort (if values equal, keep)
    // For simplicity, re-find by closest
    this.#render();
    // Focus should stay on the thumb that moved; but after sort, the thumb at idx may have moved.
    // We'll keep focus on the same DOM thumb, but its value now is newVal, and its position updated.
    // To handle crossing, we should not sort until pointer up? But for keyboard, sorting is okay if we move focus to the thumb that now holds newVal.
    const newIdx = this.#values.indexOf(newVal);
    if (newIdx >=0 && newIdx !== idx) {
      this.#thumbs[newIdx].focus();
    }
    this.#emitInput();
    this.#emitChange();
  }

  #startDrag(e, idx) {
    if (this.hasAttribute('disabled')) return;
    e.preventDefault();
    this.#dragging = idx;
    this.#rect = this.#track.getBoundingClientRect();
    this.#thumbs[idx].setPointerCapture(e.pointerId);
    const move = (ev) => this.#onDrag(ev);
    const up = (ev) => {
      this.#dragging = null;
      this.#thumbs[idx].releasePointerCapture(ev.pointerId);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      this.#emitChange();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  #onTrackPointer(e) {
    if (this.hasAttribute('disabled')) return;
    // If the target is a thumb, its own handler will run; ignore here to avoid double
    if (e.target.closest('[data-slider-thumb]')) return;
    this.#rect = this.#track.getBoundingClientRect();
    const pos = this.#orientation === 'vertical'
      ? (this.#rect.bottom - e.clientY) / this.#rect.height
      : (e.clientX - this.#rect.left) / this.#rect.width;
    const val = this.#valueAt(pos * 100);
    // Find nearest thumb
    let nearest = 0;
    let minDist = Infinity;
    this.#values.forEach((v,i)=>{
      const d = Math.abs(v - val);
      if (d < minDist) { minDist = d; nearest = i; }
    });
    this.#values[nearest] = val;
    this.#values.sort((a,b)=>a-b);
    this.#render();
    this.#emitInput();
    // Start dragging the nearest thumb
    this.#startDrag(e, nearest);
  }

  #onDrag(e) {
    if (this.#dragging == null || this.#rect == null) return;
    const pos = this.#orientation === 'vertical'
      ? (this.#rect.bottom - e.clientY) / this.#rect.height
      : (e.clientX - this.#rect.left) / this.#rect.width;
    const clampedPos = Math.min(1, Math.max(0, pos));
    const val = this.#valueAt(clampedPos * 100);
    this.#values[this.#dragging] = val;
    // Keep sorted but allow crossing? For range sliders, thumbs shouldn't cross beyond each other if we want to prevent overlap.
    // We'll sort and update dragging index to follow the thumb.
    const oldVal = val;
    this.#values.sort((a,b)=>a-b);
    const newIdx = this.#values.indexOf(oldVal);
    if (newIdx !== this.#dragging) {
      this.#dragging = newIdx;
    }
    this.#render();
    this.#emitInput();
  }

  #emitInput() {
    this.emit('input', { value: [...this.#values] });
    // Also dispatch native input event for form integration
    this.dispatchEvent(new Event('input', { bubbles: true }));
    // Auto-update nearby display for docs examples (e.g., <span data-value> in same .vstack)
    const display = this.closest('.vstack')?.querySelector('[data-value], [data-slider-value]');
    if (display) display.textContent = this.#values.join(' · ');
  }

  #emitChange() {
    this.emit('change', { value: [...this.#values] });
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #updateAria() {
    // no-op
  }

  get value() {
    return [...this.#values];
  }

  set value(v) {
    const arr = Array.isArray(v) ? v : String(v).split(',').map(s=>parseFloat(s.trim()));
    this.#values = arr.map(x=>this.#clamp(x)).filter(x=>!Number.isNaN(x)).sort((a,b)=>a-b);
    if (this.#values.length===0) this.#values=[this.#min];
    this.#render();
  }

  get min() { return this.#min; }
  set min(v) { this.#min = Number(v); this.#render(); }
  get max() { return this.#max; }
  set max(v) { this.#max = Number(v); this.#render(); }
  get step() { return this.#step; }
  set step(v) { this.#step = Number(v); }
}

customElements.define('mo-slider', MoSlider);
