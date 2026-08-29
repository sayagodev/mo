/**
 * mo - Resizable Component
 *
 * Split panes with draggable dividers — react-resizable-panels behavior on
 * plain flex + Pointer Events, no dependencies:
 * - Panels are the host's direct [data-resizable-panel] children; their
 *   flex-basis percentages always sum to 100 (handles cost zero layout).
 * - <hr data-resizable-handle> dividers are inserted automatically between
 *   panels; authored handles are kept as-is and may carry content like a
 *   grip icon (wrap in a div — hr cannot hold children).
 * - Dragging adjusts only the two panels beside the handle; each panel is
 *   clamped to its data-min percentage (default 10%).
 * - Keyboard: handles are focusable separators; Arrow keys resize by 2%
 *   (Shift = 10%) along the group axis.
 * - Sizes persist to data-sizes on the host ("33.3,66.7") and are restored
 *   from it on init. 'mo-resize' { sizes } fires on pointerup / keyup, not
 *   every move.
 *
 * Usage:
 * <mo-resizable style="height: 200px">
 *   <div data-resizable-panel>One</div>
 *   <!-- auto-inserted: <hr data-resizable-handle> -->
 *   <div data-resizable-panel>Two</div>
 * </mo-resizable>
 *
 * <mo-resizable data-orientation="vertical" data-sizes="25,75">
 *   <div data-resizable-panel data-min="20">Header</div>
 *   <div data-resizable-handle><span data-resizable-grip>…</span></div>
 *   <div data-resizable-panel>Content</div>
 * </mo-resizable>
 */

import { MoBase } from './base.js';

const DEFAULT_MIN = 10;

/**
 * Resizable split panes with draggable, keyboard-accessible dividers.
 *
 * @tag mo-resizable
 * @attr {string} data-orientation - "horizontal" (default) or "vertical".
 * @attr {string} data-sizes - Panel percentages, e.g. "25,75"; read on init, rewritten live.
 * @method sizes - Current panel percentages.
 * @fires {CustomEvent<{ sizes: number[] }>} mo-resize - Drag or arrow-key resize finished.
 */
class OtResizable extends MoBase {
  #panels = [];
  #pairs = []; // [{ el, i }] — i = index of the panel BEFORE this handle
  #sizes = [];
  #vertical = false;
  #drag = null;

  #ensureInner(panel) {
    if (panel.querySelector(':scope > [data-resizable-panel-inner]')) return;
    const inner = document.createElement('div');
    inner.setAttribute('data-resizable-panel-inner', '');
    inner.style.cssText = 'height:100%;width:100%;max-height:100%;max-width:100%;flex:1 1 auto;min-width:0;min-height:0;overflow:hidden;display:flex;flex-direction:column;';
    // Transfer visual styles that would prevent collapsing to 0 (padding/background/border) from outer to inner
    const outerStyle = panel.getAttribute('style') || '';
    const transferProps = ['padding', 'padding-inline', 'padding-block', 'background', 'background-color', 'border', 'border-radius'];
    let innerExtra = '';
    let outerRemaining = outerStyle;
    for (const prop of transferProps) {
      const re = new RegExp(`\\b${prop}\\s*:[^;]+;?`, 'gi');
      const matches = outerStyle.match(re);
      if (matches) {
        innerExtra += matches.join(' ') + ' ';
        outerRemaining = outerRemaining.replace(re, '');
      }
    }
    if (innerExtra) {
      inner.style.cssText += innerExtra;
      panel.setAttribute('style', outerRemaining.trim());
      panel.style.background = 'transparent';
      panel.style.padding = '0';
      panel.style.border = '0';
    }
    while (panel.firstChild) inner.appendChild(panel.firstChild);
    panel.appendChild(inner);
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.overflow = 'hidden';
  }

  init() {
    this.#vertical = this.getAttribute('data-orientation') === 'vertical';
    this.#insertMissingHandles();

    this.#panels = [...this.children].filter((el) => el.hasAttribute('data-resizable-panel'));
    if (this.#panels.length < 2) return;

    for (const p of this.#panels) this.#ensureInner(p);

    const handles = [...this.children].filter((el) => el.hasAttribute('data-resizable-handle'));
    this.#pairs = handles.map((el) => ({ el, i: this.#pairIndexOf(el) }));
    for (const { el } of this.#pairs) this.#setupHandle(el);

    if (!this.#restore()) {
      this.#sizes = this.#panels.map(() => 100 / this.#panels.length);
    }

    this.addEventListener('pointerdown', this);
    this.addEventListener('pointermove', this);
    this.addEventListener('pointerup', this);
    this.addEventListener('pointercancel', this);
    this.addEventListener('keydown', this);
    this.addEventListener('keyup', this);
    this.addEventListener('dblclick', this);

    this.#apply();
    this.#sync();
  }

  // Current panel sizes as percentages rounded to 2 decimals.
  sizes() {
    return this.#sizes.map((s) => Math.round(s * 100) / 100);
  }

  // Dividers -----------------------------------------------------------------

  #insertMissingHandles() {
    let prev = null;
    for (const el of [...this.children]) {
      if (!el.hasAttribute('data-resizable-panel')) continue;
      if (prev && !this.#hasHandleBetween(prev, el)) {
        const handle = document.createElement('div');
        handle.setAttribute('data-resizable-handle', '');
        // No grip por defecto — es la variante elegante solo línea.
        // Si el grupo pide `data-with-grip` o el handle lo pide, se añadirá en #setupHandle
        el.before(handle);
      }
      prev = el;
    }
  }

  #hasHandleBetween(a, b) {
    for (let node = a.nextElementSibling; node && node !== b; node = node.nextElementSibling) {
      if (node.hasAttribute('data-resizable-handle')) return true;
    }
    return false;
  }

  // Index of the panel that ends at this handle (panels before it minus one).
  #pairIndexOf(handle) {
    let before = 0;
    for (const p of this.#panels) {
      if (handle.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_PRECEDING) before++;
    }
    return before - 1;
  }

  #setupHandle(handle) {
    if (!handle.getAttribute('role')) handle.setAttribute('role', 'separator');
    if (!handle.hasAttribute('tabindex')) handle.setAttribute('tabindex', '0');
    if (!handle.getAttribute('aria-label')) handle.setAttribute('aria-label', 'Resize');
    handle.setAttribute('aria-orientation', this.#vertical ? 'horizontal' : 'vertical');
    // API para el chip: `withHandle` de shadcn → `data-with-grip` / `data-with-handle` / `withHandle`
    // Puede venir en el handle o en el grupo (`mo-resizable`). Si se pide, inyecta el grip si aún no existe.
    const wantsGrip = handle.hasAttribute('data-with-grip') || handle.hasAttribute('data-with-handle') || handle.hasAttribute('withHandle') || this.hasAttribute('data-with-grip') || this.hasAttribute('data-with-handle');
    if (wantsGrip && !handle.querySelector('[data-resizable-grip]')) {
      const grip = document.createElement('span');
      grip.setAttribute('data-resizable-grip', '');
      grip.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>';
      handle.appendChild(grip);
    }
  }

  // Sizing -------------------------------------------------------------------

  // Restore from the persisted data-sizes attribute when valid.
  #restore() {
    const parts = (this.getAttribute('data-sizes') || '').split(',').map(Number);
    if (parts.length !== this.#panels.length || parts.some((n) => !(n > 0))) return false;
    const sum = parts.reduce((a, b) => a + b, 0);
    this.#sizes = parts.map((n) => (n / sum) * 100);
    return true;
  }

  #min(i) {
    // Expanded min (when not collapsed). For collapsible, this is the min when expanded.
    const raw = this.#panels[i]?.getAttribute('data-min');
    if (raw == null || raw === '') return DEFAULT_MIN;
    const v = Number(raw);
    return Number.isFinite(v) ? v : DEFAULT_MIN;
  }

  #collapsedSize(i) {
    if (!this.#isCollapsible(i)) return null;
    const raw = this.#panels[i]?.getAttribute('data-collapsed-size');
    if (raw == null || raw === '') return 0;
    // Support percent or px (simple percent parsing; px would need group size, treat as 0 for now)
    if (String(raw).trim().endsWith('%')) {
      const v = parseFloat(raw);
      return Number.isFinite(v) ? v : 0;
    }
    const v = Number(raw);
    return Number.isFinite(v) ? v : 0;
  }

  #isCollapsible(i) {
    return this.#panels[i]?.hasAttribute('data-collapsible');
  }

  #expandedSizes = new Map(); // index -> size before collapse

  // Keep `a` inside [min, total-min]; collapsible panels snap via midpoint between collapsed and min (react-resizable-panels Y logic)
  #applyPair(i, a) {
    if (i < 0 || i + 1 >= this.#sizes.length) return;
    const total = this.#sizes[i] + this.#sizes[i + 1];
    const leftColl = this.#isCollapsible(i);
    const rightColl = this.#isCollapsible(i + 1);
    const leftMin = this.#min(i);
    const rightMin = this.#min(i + 1);
    const leftCollSize = leftColl ? this.#collapsedSize(i) : null;
    const rightCollSize = rightColl ? this.#collapsedSize(i + 1) : null;

    // Midpoint snapping before hard clamp (mirrors library Y)
    let target = a;
    if (leftColl && leftCollSize !== null) {
      const thresh = (leftCollSize + leftMin) / 2;
      if (target < thresh) target = leftCollSize;
      else if (target < leftMin) target = leftMin;
    } else {
      target = Math.max(target, leftMin);
    }
    if (rightColl && rightCollSize !== null) {
      const rThresh = total - (rightCollSize + rightMin) / 2;
      if (target > rThresh) target = total - rightCollSize;
      else if (target > total - rightMin) target = total - rightMin;
    } else {
      target = Math.min(target, total - rightMin);
    }

    // Remember expanded size when collapsing
    if (leftColl && target === leftCollSize) {
      if (this.#sizes[i] !== leftCollSize) this.#expandedSizes.set(i, this.#sizes[i]);
    } else if (rightColl && target === total - rightCollSize) {
      if (this.#sizes[i + 1] !== rightCollSize) this.#expandedSizes.set(i + 1, this.#sizes[i + 1]);
    }

    // Final clamp to valid collapsed range
    const leftLower = leftColl ? leftCollSize : leftMin;
    const rightLower = rightColl ? rightCollSize : rightMin;
    target = Math.min(Math.max(target, leftLower), total - rightLower);

    this.#sizes[i + 1] = total - target;
    this.#sizes[i] = target;
    this.#apply();
    this.#sync();
  }

  #toggleCollapse(i) {
    const total = this.#sizes[i] + this.#sizes[i + 1];
    const leftColl = this.#isCollapsible(i);
    const rightColl = this.#isCollapsible(i + 1);
    const leftCollSize = leftColl ? this.#collapsedSize(i) : null;
    const rightCollSize = rightColl ? this.#collapsedSize(i + 1) : null;
    const leftIsCollapsed = leftColl && this.#sizes[i] === leftCollSize;
    const rightIsCollapsed = rightColl && this.#sizes[i + 1] === rightCollSize;

    if (leftIsCollapsed || rightIsCollapsed) {
      // Expand to previously saved size or half
      const idx = leftIsCollapsed ? i : i + 1;
      const saved = this.#expandedSizes.get(idx);
      const fallback = this.#min(idx);
      const expandTo = saved ?? (fallback > 0 ? fallback : total * 0.5);
      if (leftIsCollapsed) this.#applyPair(i, expandTo);
      else this.#applyPair(i, total - expandTo);
    } else if (leftColl) {
      this.#applyPair(i, leftCollSize);
    } else if (rightColl) {
      this.#applyPair(i, total - rightCollSize);
    }
    this.emit('mo-resize', { sizes: this.sizes() });
  }

  #apply() {
    this.#sizes.forEach((pct, i) => {
      // shadcn uses flex: <grow> 1 0px (grow = percentage, basis 0)
      this.#panels[i].style.flex = `${pct} 1 0px`;
      this.#panels[i].style.flexBasis = '0px';
      this.#panels[i].style.flexGrow = String(pct);
      this.#panels[i].style.flexShrink = '1';
      this.#panels[i].style.overflow = 'hidden';
      this.#panels[i].style.minWidth = '0';
      this.#panels[i].style.minHeight = '0';
      // Mark collapsed for a11y, but visual clipping is done by flex 0 (no opacity hack needed)
      if (pct === 0) {
        this.#panels[i].setAttribute('data-collapsed', '');
        try { this.#panels[i].inert = true; } catch {}
      } else {
        this.#panels[i].removeAttribute('data-collapsed');
        try { this.#panels[i].inert = false; } catch {}
      }
    });
  }

  // Persist sizes + expose ARIA value semantics on every handle.
  #sync() {
    const sizes = this.sizes();
    this.setAttribute('data-sizes', sizes.join(','));
    for (const { el, i } of this.#pairs) {
      el.setAttribute('aria-valuemin', String(this.#min(i)));
      el.setAttribute('aria-valuemax', String(Math.round((100 - this.#min(i + 1)) * 100) / 100));
      el.setAttribute('aria-valuenow', String(sizes[i]));
    }
  }

  // Pointer resizing -----------------------------------------------------------

  onpointerdown(e) {
    if (this.#drag) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const handle = e.target.closest?.('[data-resizable-handle]');
    if (!handle) return;
    const pair = this.#pairs.find((p) => p.el === handle);
    if (!pair || pair.i < 0) return;

    e.preventDefault(); // no text selection while dragging
    try { handle.setPointerCapture(e.pointerId); } catch { /* detached */ }
    handle.focus();

    this.#drag = {
      id: e.pointerId,
      handle,
      i: pair.i,
      origin: this.#vertical ? e.clientY : e.clientX,
      base: [...this.#sizes],
      span: (this.#vertical ? this.clientHeight : this.clientWidth) || 1,
    };
    handle.setAttribute('data-dragging', '');
  }

  onpointermove(e) {
    const d = this.#drag;
    if (!d || e.pointerId !== d.id) return;
    const pos = this.#vertical ? e.clientY : e.clientX;
    const deltaPct = ((pos - d.origin) / d.span) * 100;
    this.#applyPair(d.i, d.base[d.i] + deltaPct);
  }

  onpointerup(e) { this.#endDrag(e); }
  onpointercancel(e) { this.#endDrag(e); }

  ondblclick(e) {
    const handle = e.target.closest?.('[data-resizable-handle]');
    if (!handle) return;
    const pair = this.#pairs.find((p) => p.el === handle);
    if (!pair || pair.i < 0) return;
    if (!this.#isCollapsible(pair.i) && !this.#isCollapsible(pair.i + 1)) return;
    e.preventDefault();
    this.#toggleCollapse(pair.i);
  }

  #endDrag(e) {
    const d = this.#drag;
    if (!d || e.pointerId !== d.id) return;
    this.#drag = null;
    d.handle.removeAttribute('data-dragging');
    try { d.handle.releasePointerCapture(e.pointerId); } catch { /* already gone */ }
    this.emit('mo-resize', { sizes: this.sizes() });
  }

  // Keyboard resizing ----------------------------------------------------------

  onkeydown(e) {
    const handle = e.target.closest?.('[data-resizable-handle]');
    if (!handle) return;
    const pair = this.#pairs.find((p) => p.el === handle);
    if (!pair || pair.i < 0) return;

    if (e.key === 'Enter') {
      if (!this.#isCollapsible(pair.i) && !this.#isCollapsible(pair.i + 1)) return;
      e.preventDefault();
      this.#toggleCollapse(pair.i);
      return;
    }
    if (e.key === 'Home') {
      e.preventDefault();
      // Minimize left panel (or collapse if collapsible)
      const target = this.#isCollapsible(pair.i) ? this.#collapsedSize(pair.i) : this.#min(pair.i);
      this.#applyPair(pair.i, target);
      return;
    }
    if (e.key === 'End') {
      e.preventDefault();
      const total = this.#sizes[pair.i] + this.#sizes[pair.i + 1];
      const rightColl = this.#isCollapsible(pair.i + 1);
      const target = rightColl ? total - this.#collapsedSize(pair.i + 1) : total - this.#min(pair.i + 1);
      this.#applyPair(pair.i, target);
      return;
    }
    if (e.key === 'F6') {
      e.preventDefault();
      // Cycle focus to next/prev handle (like library)
      const idx = this.#pairs.findIndex((p) => p.el === handle);
      const nextIdx = e.shiftKey ? (idx - 1 + this.#pairs.length) % this.#pairs.length : (idx + 1) % this.#pairs.length;
      this.#pairs[nextIdx]?.el.focus();
      return;
    }

    const dir = this.#vertical
      ? { ArrowUp: -1, ArrowDown: 1 }[e.key]
      : { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!dir) return;

    e.preventDefault();
    const step = e.shiftKey ? 10 : 2;
    this.#applyPair(pair.i, this.#sizes[pair.i] + dir * step);
  }

  onkeyup(e) {
    if (!e.target.closest?.('[data-resizable-handle]')) return;
    this.emit('mo-resize', { sizes: this.sizes() });
  }
}

customElements.define('mo-resizable', OtResizable);
