/**
 * mo - Scroll Area fade tracking (optional)
 * Upgrades [data-scroll-area][data-fades] from static edge fades to
 * scroll-aware ones: data-at-top/bottom/left/right are toggled as the
 * container scrolls and the CSS swaps each reached edge's mask layer for a
 * fully opaque one, sharpening it. Without this file the fades simply never
 * disappear.
 */

const THRESHOLD = 1; // Subpixel slack for zoomed/fractional offsets.

function update(el) {
  const { scrollTop, scrollLeft, scrollWidth, scrollHeight, clientWidth, clientHeight } = el;
  el.toggleAttribute('data-at-top', scrollTop <= THRESHOLD);
  el.toggleAttribute('data-at-bottom', scrollTop >= scrollHeight - clientHeight - THRESHOLD);
  el.toggleAttribute('data-at-left', scrollLeft <= THRESHOLD);
  el.toggleAttribute('data-at-right', scrollLeft >= scrollWidth - clientWidth - THRESHOLD);
}

function watch(el) {
  update(el);
  el.addEventListener('scroll', () => update(el), { passive: true });
  // Content or box size changes move the edges too.
  new ResizeObserver(() => update(el)).observe(el);
}

// Safe to bundle in <head>: wait for the DOM before scanning.
function scan() {
  for (const el of document.querySelectorAll(
    '[data-scroll-area][data-fades], [data-slot="scroll-area"][data-fades]',
  )) {
    watch(el);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scan);
} else {
  scan();
}
