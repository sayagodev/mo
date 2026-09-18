/**
 * mo - Toast Notifications (Shadcn-like styling, simple stacking)
 */

const toasts = {};

function _get(placement) {
  if (!toasts[placement]) {
    const el = document.createElement('div');
    el.className = 'toast-container';
    el.setAttribute('popover', 'manual');
    el.setAttribute('data-placement', placement);
    document.body.appendChild(el);
    toasts[placement] = el;
  }
  return toasts[placement];
}

function _iconFor(variant) {
  const wrap = document.createElement('span');
  wrap.setAttribute('data-toast-icon', '');
  wrap.setAttribute('aria-hidden', 'true');
  let svg = '';
  if (variant === 'success') {
    svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  } else if (variant === 'warning') {
    svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
  } else if (variant === 'danger' || variant === 'error') {
    svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';
  } else if (variant === 'info') {
    svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
  } else if (variant === 'loading') {
    wrap.innerHTML = '<span aria-busy="true"></span>';
    return wrap;
  } else {
    return null;
  }
  wrap.innerHTML = svg;
  return wrap;
}

function _show(el, options = {}) {
  const { placement = 'top-right', duration = 4000 } = options;
  const p = _get(placement);
  el.classList.add('toast');
  if (!el.querySelector('[data-close]')) {
    const close = document.createElement('button');
    close.type = 'button';
    close.setAttribute('data-close', '');
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
    close.addEventListener('click', () => _remove(el, p));
    el.appendChild(close);
  }
  el.setAttribute('data-entering', '');
  p.appendChild(el);
  if (p.showPopover) p.showPopover();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.removeAttribute('data-entering');
    });
  });
  _arm(el, p, duration);
  return el;
}

function _arm(el, container, duration) {
  let timeout;
  const start = () => {
    clearTimeout(timeout);
    if (duration > 0) {
      timeout = setTimeout(() => _remove(el, container), duration);
    }
  };
  el.onmouseenter = () => clearTimeout(timeout);
  el.onmouseleave = start;
  start();
}

function _remove(el, container) {
  if (el.hasAttribute('data-exiting')) return;
  el.setAttribute('data-exiting', '');
  const cleanup = () => {
    el.remove();
    if (!container.children.length) {
      container.hidePopover?.();
      container.style.display = '';
    }
  };
  el.addEventListener('transitionend', cleanup, { once: true });
  const t = getComputedStyle(el).getPropertyValue('--transition').trim();
  const val = parseFloat(t);
  const ms = t.endsWith('ms') ? val : val * 1000;
  setTimeout(cleanup, ms);
}

export function toast(message, title, options = {}) {
  const { variant = 'info', ...rest } = options;
  const el = document.createElement('output');
  el.setAttribute('data-variant', variant);
  const icon = _iconFor(variant);
  if (icon) el.appendChild(icon);
  const content = document.createElement('div');
  content.className = 'toast-content';
  if (title) {
    const titleEl = document.createElement('h6');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    content.appendChild(titleEl);
  }
  const msgEl = document.createElement('div');
  msgEl.className = 'toast-message';
  msgEl.textContent = message;
  content.appendChild(msgEl);
  el.appendChild(content);
  return _show(el, rest);
}

export function toastEl(el, options = {}) {
  let t;
  if (el instanceof HTMLTemplateElement) {
    t = el.content.firstElementChild?.cloneNode(true);
  } else if (el) {
    t = el.cloneNode(true);
  }
  if (!t) return;
  t.removeAttribute('id');
  return _show(t, options);
}

function _update(el, variant, message) {
  el.setAttribute('data-variant', variant);
  const oldIcon = el.querySelector('[data-toast-icon]');
  const newIcon = _iconFor(variant);
  if (oldIcon && newIcon) oldIcon.replaceWith(newIcon);
  else if (!oldIcon && newIcon) el.prepend(newIcon);
  else if (oldIcon && !newIcon) oldIcon.remove();
  const msgEl = el.querySelector('.toast-message');
  if (msgEl && message != null) msgEl.textContent = message;
}

export function toastPromise(promise, messages = {}, options = {}) {
  const { loading = 'Loading…', success = 'Success', error = 'Error' } = messages;
  const { duration = 4000 } = options;
  const el = toast(loading, '', { ...options, variant: 'info', duration: 0 });
  const icon = el.querySelector('[data-toast-icon]');
  if (icon) icon.innerHTML = '<span aria-busy="true"></span>';
  else {
    const wrap = document.createElement('span');
    wrap.setAttribute('data-toast-icon', '');
    wrap.innerHTML = '<span aria-busy="true"></span>';
    el.prepend(wrap);
  }
  const settle = (variant, content) => {
    _update(el, variant, content);
    _arm(el, el.parentElement, duration);
  };
  Promise.resolve(promise).then(
    d => settle('success', typeof success === 'function' ? success(d) : success),
    e => settle('danger', typeof error === 'function' ? error(e) : error),
  );
  return el;
}

export function toastClear(placement) {
  (placement ? [toasts[placement]] : Object.values(toasts)).forEach(c => {
    if (!c) return;
    c.innerHTML = '';
    c.hidePopover?.();
    c.style.display = '';
  });
}

// Convenience aliases mirroring the window.mo.toast API surface.
toast.el = toastEl;
toast.clear = toastClear;
toast.dismiss = toastClear;
toast.promise = toastPromise;

// Self-register on window.mo so CLI-installed copies (which import toast.js
// directly, without the src/js/index.js barrel) expose the same imperative
// API as the CDN bundle. The barrel in index.js reuses this object.
if (typeof window !== 'undefined') {
  const mo = window.mo || (window.mo = {});
  const ot = window.ot || (window.ot = mo);
  mo.toast = ot.toast = toast;
}

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (document.querySelector('dialog[open]')) return;
  const open = Object.values(toasts).filter(c => c.matches(':popover-open'));
  if (!open.length) return;
  open.forEach(c => [...c.children].forEach(el => _remove(el, c)));
});

document.addEventListener('click', e => {
  const trigger = e.target.closest('[data-toast]');
  if (!trigger) return;
  toast(trigger.dataset.toast, trigger.dataset.toastTitle, {
    variant: trigger.dataset.toastVariant || 'info',
    placement: trigger.dataset.toastPlacement || undefined,
    duration: trigger.dataset.toastDuration ? parseInt(trigger.dataset.toastDuration, 10) : undefined,
  });
});
