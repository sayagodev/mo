/**
 * mo - Sheet / Drawer Component
 *
 * Enhances <dialog class="sheet"> with shadcn drawer behaviors:
 * - Click on backdrop (dialog itself) closes, like closedby="any" but
 *   polyfilled for all browsers.
 * - Bottom sheets can be dragged closed via the .handle (Vaul/BaseUI style).
 *   Grab the handle and drag down; beyond 40% of sheet height or with velocity
 *   it closes, otherwise snaps back.
 */

function setupSheet(dialog) {
  if (dialog._moSheet) return;
  dialog._moSheet = true;

  // Backdrop click: clicking the dialog element itself (not its children)
  // means the backdrop was hit — close.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  if (dialog.dataset.side !== 'bottom') return;
  const handle = dialog.querySelector('.handle');
  if (!handle) return;

  let startY = 0;
  let currentY = 0;
  let dragging = false;
  let pointerId = null;

  handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    pointerId = e.pointerId;
    startY = e.clientY;
    currentY = 0;
    dialog.style.transition = 'none';
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  handle.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    currentY = Math.max(0, e.clientY - startY);
    dialog.style.transform = `translateY(${currentY}px)`;
    // Fade backdrop proportionally
    const progress = Math.min(currentY / (dialog.offsetHeight || 300), 1);
    dialog.style.opacity = String(1 - progress * 0.5);
  });

  const endDrag = (e) => {
    if (!dragging || (e && e.pointerId !== pointerId)) return;
    dragging = false;
    dialog.style.transition = '';
    dialog.style.transform = '';
    dialog.style.opacity = '';
    try { handle.releasePointerCapture(pointerId); } catch {}
    const threshold = (dialog.offsetHeight || 300) * 0.33;
    const shouldClose = currentY > threshold || currentY > 100;
    if (shouldClose && dialog.open) dialog.close();
    currentY = 0;
    pointerId = null;
  };

  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);
}

export function scan(root = document) {
  for (const dlg of root.querySelectorAll('dialog.sheet')) setupSheet(dlg);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => scan(), { once: true });
} else {
  scan();
}

new MutationObserver(() => scan()).observe(document.documentElement, { childList: true, subtree: true });
