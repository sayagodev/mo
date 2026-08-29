/**
 * mo - Carousel Component
 *
 * Scroll-snap carousel over an authored <section data-carousel> — shadcn/ui
 * Carousel behavior on the platform's scroll snapping instead of Embla:
 * - Prev/next step exactly one slide, whatever the slide widths and gap.
 * - Dots are generated per slide; clicking one scrolls to it, and scrolling
 *   moves aria-current to the dot nearest the track position.
 * - Buttons disable at either end; Arrow keys page while the track is
 *   focused and Home/End jump to the first/last slide (shadcn's key model).
 * - data-orientation="vertical" flips the track to y-axis paging.
 * - Emits a debounced "mo-carousel-change" { index, count } after each
 *   scroll settles.
 *
 * The section stays functional without this element (native touch/wheel
 * scrolling + CSS snap); the wrapper only wires controls. It is styled as
 * display:contents in carousel.css so layout comes from the section.
 *
 * Usage:
 * <mo-carousel>
 *   <section data-carousel aria-roledescription="carousel" aria-label="Highlights">
 *     <div data-carousel-track>
 *       <article data-carousel-slide>…</article>
 *       <article data-carousel-slide>…</article>
 *     </div>
 *     <div data-carousel-controls>
 *       <button type="button" data-carousel-previous class="icon outline">
 *         <svg><!-- lucide arrow-left --></svg>
 *         <span hidden>Previous slide</span>
 *       </button>
 *       <div data-carousel-dots></div>
 *       <button type="button" data-carousel-next class="icon outline">
 *         <svg><!-- lucide arrow-right --></svg>
 *         <span hidden>Next slide</span>
 *       </button>
 *     </div>
 *   </section>
 * </mo-carousel>
 */

import { MoBase } from './base.js';

/**
 * Carousel over a scroll-snapping section with dots, paging buttons and keys.
 *
 * @tag mo-carousel
 * @fires {CustomEvent<{ index: number, count: number }>} mo-carousel-change - Active slide changed (debounced).
 */
class OtCarousel extends MoBase {
  #track;
  #prevBtn;
  #nextBtn;
  #dotsHost;
  #slides = [];
  #dots = [];
  #vertical = false;
  #index = -1;
  #canPrev;
  #canNext;
  #settleTimer;

  #drag = null;

  init() {
    const root = this.querySelector('[data-carousel]');
    this.#track = root?.querySelector('[data-carousel-track]');
    if (!this.#track) return;

    this.#slides = [...this.querySelectorAll('[data-carousel-slide]')];
    if (this.#slides.length === 0) return;

    this.#vertical = root.dataset.orientation === 'vertical';
    this.#prevBtn = this.querySelector('[data-carousel-previous]');
    this.#nextBtn = this.querySelector('[data-carousel-next]');
    this.#dotsHost = this.querySelector('[data-carousel-dots]');

    // Keyboard paging needs a focusable scroller; also satisfies axe's
    // keyboard-focusable-scrollable-region check.
    this.#track.tabIndex = 0;

    this.addEventListener('click', this);
    this.addEventListener('keydown', this);
    this.#track.addEventListener('scroll', this, { passive: true });
    // Drag-to-scroll (mouse/touch): pointer events on track.
    this.#track.addEventListener('pointerdown', this);
    this.#track.addEventListener('pointermove', this);
    this.#track.addEventListener('pointerup', this);
    this.#track.addEventListener('pointercancel', this);
    this.#track.addEventListener('dragstart', (e) => e.preventDefault());
    window.addEventListener('resize', this.#refresh);

    this.#buildDots();
    this.#paint(true);
  }

  cleanup() {
    clearTimeout(this.#settleTimer);
    window.removeEventListener('resize', this.#refresh);
  }

  onpointerdown(e) {
    if (e.button !== 0) return;
    // Don't interfere with button/dots clicks
    if (e.target.closest('button, a')) return;
    this.#drag = {
      id: e.pointerId,
      start: this.#vertical ? e.clientY : e.clientX,
      scroll: this.#vertical ? this.#track.scrollTop : this.#track.scrollLeft,
      moved: false,
    };
    this.#track.setPointerCapture(e.pointerId);
    this.#track.style.cursor = 'grabbing';
    this.#track.style.scrollSnapType = 'none';
    this.#track.style.userSelect = 'none';
  }

  onpointermove(e) {
    const d = this.#drag;
    if (!d || e.pointerId !== d.id) return;
    const pos = this.#vertical ? e.clientY : e.clientX;
    const delta = pos - d.start;
    if (Math.abs(delta) > 2) d.moved = true;
    if (this.#vertical) this.#track.scrollTop = d.scroll - delta;
    else this.#track.scrollLeft = d.scroll - delta * this.#sign();
  }

  onpointerup(e) {
    const d = this.#drag;
    if (!d || e.pointerId !== d.id) return;
    this.#drag = null;
    try { this.#track.releasePointerCapture(e.pointerId); } catch {}
    this.#track.style.cursor = '';
    this.#track.style.scrollSnapType = '';
    this.#track.style.userSelect = '';
    // Snap back to nearest slide after drag
    if (d.moved) {
      e.preventDefault();
      // Brief defer to let scroll settle
      requestAnimationFrame(() => this.#paint(true));
    }
  }

  onpointercancel(e) { this.onpointerup(e); }

  onclick(e) {
    if (e.target.closest('[data-carousel-previous]')) return this.#page(-1);
    if (e.target.closest('[data-carousel-next]')) return this.#page(1);
    const dot = e.target.closest('[data-carousel-dot]');
    if (dot) this.#goTo(this.#dots.indexOf(dot));
  }

  onkeydown(e) {
    if ([this.#backKey(), this.#nextKey()].includes(e.key)) {
      e.preventDefault();
      this.#page(e.key === this.#backKey() ? -1 : 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.#goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.#goTo(this.#slides.length - 1);
    }
  }

  // Fires continuously while the user scrolls or a smooth scroll runs;
  // paint cheaply every frame, emit once the motion has settled.
  onscroll() {
    this.#paint();
    clearTimeout(this.#settleTimer);
    this.#settleTimer = setTimeout(() => {
      this.emit('mo-carousel-change', { index: this.#indexAt(), count: this.#slides.length });
    }, 120);
  }

  #refresh = () => this.#paint(true);

  #backKey() {
    return this.#vertical ? 'ArrowUp' : 'ArrowLeft';
  }

  #nextKey() {
    return this.#vertical ? 'ArrowDown' : 'ArrowRight';
  }

  // Geometry ---------------------------------------------------------------

  // Slide start offsets along the scroll axis, normalized so RTL documents
  // behave like LTR (scrollLeft runs negative there).
  #offsets() {
    const sign = this.#sign();
    const first = this.#axisPos(this.#slides[0]);
    return this.#slides.map((slide) => (this.#axisPos(slide) - first) * sign);
  }

  #axisPos(el) {
    return this.#vertical ? el.offsetTop : el.offsetLeft;
  }

  #sign() {
    if (this.#vertical) return 1;
    return getComputedStyle(this.#track).direction === 'rtl' ? -1 : 1;
  }

  #position() {
    const scroll = this.#vertical ? this.#track.scrollTop : this.#track.scrollLeft;
    return scroll * this.#sign();
  }

  #maxScroll() {
    return this.#vertical
      ? this.#track.scrollHeight - this.#track.clientHeight
      : this.#track.scrollWidth - this.#track.clientWidth;
  }

  // Nearest snap index for a scroll position (mixed slide widths included).
  #indexAt(pos = this.#position()) {
    const offsets = this.#offsets();
    let best = 0;
    for (let i = 1; i < offsets.length; i++) {
      if (Math.abs(offsets[i] - pos) < Math.abs(offsets[best] - pos)) best = i;
    }
    return best;
  }

  // Controls -----------------------------------------------------------------

  #page(dir) {
    this.#goTo(this.#indexAt() + dir);
  }

  #goTo(index) {
    const offsets = this.#offsets();
    const target = offsets[Math.max(0, Math.min(index, offsets.length - 1))];
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (this.#vertical) this.#track.scrollTo({ top: target, behavior });
    else this.#track.scrollTo({ left: target * this.#sign(), behavior });
  }

  #buildDots() {
    if (!this.#dotsHost) return;
    const count = this.#slides.length;
    this.#dots = this.#slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('data-carousel-dot', '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1} of ${count}`);
      return dot;
    });
    this.#dotsHost.replaceChildren(...this.#dots);
  }

  // Sync dots + end-disabled buttons. Writes only when values change, so it
  // is safe to call on every scroll frame.
  #paint(force = false) {
    const pos = this.#position();
    const max = this.#maxScroll();
    const index = this.#indexAt(pos);

    if (force || index !== this.#index) {
      this.#index = index;
      this.#dots.forEach((dot, i) => {
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    // 1px tolerance absorbs fractional scroll positions from zoom/DPR rounding.
    const canPrev = max > 0 && pos > 1;
    const canNext = max > 0 && pos < max - 1;
    if (this.#prevBtn && (force || canPrev !== this.#canPrev)) {
      this.#prevBtn.disabled = !canPrev;
      this.#canPrev = canPrev;
    }
    if (this.#nextBtn && (force || canNext !== this.#canNext)) {
      this.#nextBtn.disabled = !canNext;
      this.#canNext = canNext;
    }
  }
}

customElements.define('mo-carousel', OtCarousel);
