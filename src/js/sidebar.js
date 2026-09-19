/**
 * Sidebar toggle handler
 * Toggles data-sidebar-open on layout when toggle button is clicked,
 * or with Ctrl/Cmd + B (shadcn's shortcut).
 */
function toggleSidebar(layout) {
  if (!layout) return;
  layout.toggleAttribute('data-sidebar-open');
  layout.dispatchEvent(new CustomEvent('mo-sidebar-toggle', {
    bubbles: true,
    detail: { open: layout.hasAttribute('data-sidebar-open') },
  }));
}

document.addEventListener('click', (e) => {
  // Sync aria-expanded with the native <details> toggle that follows this
  // click (summary's default action runs after listeners). CSS keys off
  // details[open]; this keeps AT state in lockstep.
  const subTrigger = e.target.closest?.('summary[data-sidebar-sub-trigger]');
  if (subTrigger) {
    // Collapsed icon mode: sub menus are hidden so nothing can open.
    // Freeze the details state instead of letting it flip invisibly.
    // Desktop-only: the icon rail's CSS lives above 769px, and on mobile the
    // panel is a visible overlay whose submenus must open normally — without
    // the breakpoint this froze every trigger on a phone.
    if (
      window.matchMedia('(min-width: 769px)').matches &&
      subTrigger.closest('[data-sidebar-layout="always"][data-collapsible="icon"][data-sidebar-open]')
    ) {
      e.preventDefault();
      return;
    }
    const details = subTrigger.parentElement;
    requestAnimationFrame(() => subTrigger.setAttribute('aria-expanded', String(details.open)));
    return;
  }

  const toggle = e.target.closest('[data-sidebar-toggle]');
  if (toggle) {
    toggleSidebar(toggle.closest('[data-sidebar-layout]'));
    return;
  }

  // Dismiss sidebar when clicking outside (when sidebar is not an overlay).
  if (!e.target.closest('[data-sidebar]')) {
    const layout = document.querySelector('[data-sidebar-layout][data-sidebar-open]');
    // Hardcode breakpoint (for now) as there's no way to use a CSS variable in
    // the @media{} query which could've been picked up here.
    if (layout && window.matchMedia('(max-width: 768px)').matches) {
      layout.removeAttribute('data-sidebar-open');
    }
  }
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
    // Shortcut is configurable per layout: data-sidebar-shortcut="b" (default).
    const target = e.target;
    const layout = target.closest?.('[data-sidebar-layout]') ||
      document.querySelector('[data-sidebar-layout]');
    if (!layout) return;

    const key = (layout.getAttribute('data-sidebar-shortcut') || 'b').toLowerCase();
    if (e.key.toLowerCase() !== key) return;

    // Don't hijack the shortcut while typing (bold, etc.).
    if (target instanceof HTMLElement &&
        (target.matches('input, textarea, select') || target.isContentEditable)) {
      return;
    }

    e.preventDefault();
    toggleSidebar(layout);
  }
});

// Keep aria-expanded in sync with native <details> state so sub triggers
// expose their open state to AT (CSS keys off details[open]).
document.addEventListener('toggle', (e) => {
  const details = e.target;
  if (!(details instanceof HTMLDetailsElement)) return;
  const summary = details.querySelector(':scope > summary[data-sidebar-sub-trigger]');
  if (summary) summary.setAttribute('aria-expanded', String(details.open));
}, true);

function initSubTriggerAria() {
  for (const summary of document.querySelectorAll('summary[data-sidebar-sub-trigger]')) {
    summary.setAttribute('aria-expanded', String(summary.parentElement.open));
  }
}

// Examples may mount late (SPAs): sync at DOMContentLoaded, again after
// full load plus one frame, so every mount path lands after a pass.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSubTriggerAria, { once: true });
} else {
  initSubTriggerAria();
}
window.addEventListener('load', () => {
  requestAnimationFrame(initSubTriggerAria);
});
