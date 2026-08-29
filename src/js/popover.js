/**
 * mo - Popover positioning
 *
 * Generic placement for native [popover] surfaces (shadcn Popover): the
 * popover opens anchored to its invoker (button[popovertarget]) instead of
 * the UA fixed corner/center. Mirrors Radix Popover defaults:
 *
 *   side   = data-side   (bottom default) · top · right · left
 *   align  = data-align  (center default) · start · center · end
 *   offset = data-offset (4 default, like Radix sideOffset)
 *
 * Placement flips on viewport overflow and repositions on scroll/resize.
 * Components with their own placement recipe (dropdown, select, menubar,
 * combobox, context-menu, hover-card, navigation-menu) opt out — this
 * helper serves standalone popovers only.
 */

const SELF_PLACED = 'mo-dropdown, mo-select, mo-menubar, mo-combobox, mo-context-menu, mo-hover-card, mo-navigation-menu';

const openPopovers = new Set();

function invokerFor(popup) {
  if (popup.dataset.anchor) return document.getElementById(popup.dataset.anchor) ?? null;
  return document.querySelector(`[popovertarget="${CSS.escape(popup.id)}"]`);
}

function place(popup) {
  const ctrl = invokerFor(popup);
  if (!ctrl) return;

  const r = ctrl.getBoundingClientRect();
  const p = popup.getBoundingClientRect();
  const side = popup.dataset.side || 'bottom';
  const align = popup.dataset.align || 'center';
  const offset = parseFloat(popup.dataset.offset) || 4;
  const margin = 4;

  let top;
  let left;

  if (side === 'top' || side === 'bottom') {
    top = side === 'bottom' ? r.bottom + offset : r.top - p.height - offset;
    if (align === 'start') left = r.left;
    else if (align === 'end') left = r.right - p.width;
    else left = r.left + r.width / 2 - p.width / 2;

    // Flip on vertical overflow.
    if (side === 'bottom' && top + p.height > window.innerHeight - margin) {
      top = r.top - p.height - offset;
    } else if (side === 'top' && top < margin) {
      top = r.bottom + offset;
    }
  } else {
    left = side === 'right' ? r.right + offset : r.left - p.width - offset;
    if (align === 'start') top = r.top;
    else if (align === 'end') top = r.bottom - p.height;
    else top = r.top + r.height / 2 - p.height / 2;

    // Flip on horizontal overflow.
    if (side === 'right' && left + p.width > window.innerWidth - margin) {
      left = r.left - p.width - offset;
    } else if (side === 'left' && left < margin) {
      left = r.right + offset;
    }
  }

  top = Math.max(margin, Math.min(top, window.innerHeight - p.height - margin));
  left = Math.max(margin, Math.min(left, window.innerWidth - p.width - margin));
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
}

const reposition = () => {
  for (const popup of openPopovers) place(popup);
};

// 'toggle' fires once :popover-open has applied, so rects are real here.
document.addEventListener(
  'toggle',
  (e) => {
    const popup = e.target;
    if (!(popup instanceof HTMLElement) || popup.closest(SELF_PLACED)) return;
    if (e.newState !== 'open') {
      openPopovers.delete(popup);
      return;
    }
    if (!invokerFor(popup)) return;
    openPopovers.add(popup);
    place(popup);
  },
  true,
);

window.addEventListener('scroll', reposition, true);
window.addEventListener('resize', reposition);