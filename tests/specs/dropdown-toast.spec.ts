import { test, expect } from '@playwright/test';
import { axe } from './axe';

// Popover-based menu: opens via popovertarget, closes on Escape (native light dismiss).
test('dropdown opens, focuses first item, closes on Escape', async ({ page }) => {
  await page.goto('/tests/fixtures/dropdown.html');
  await page.getByTestId('trigger').click();
  await expect(page.locator('#menu1')).toBeVisible();

  // first item receives focus for keyboard nav (mo-dropdown behavior)
  await expect(page.getByTestId('item-a')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.locator('#menu1')).toBeHidden();
});

test('arrow keys navigate menu items', async ({ page }) => {
  await page.goto('/tests/fixtures/dropdown.html');
  await page.getByTestId('trigger').click();
  await expect(page.getByTestId('item-a')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByTestId('item-danger')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByTestId('item-a')).toBeFocused();
});

test('dropdown fixture passes axe when open', async ({ page }) => {
  await page.goto('/tests/fixtures/dropdown.html');
  await page.getByTestId('trigger').click();

  // Axe samples contrast during the popover open fade otherwise (transient
  // ~4.0:1 mid-transition; settled state is ~4.9:1). Wait for opacity to
  // settle at 1 before analyzing.
  await expect
    .poll(() => page.locator('#menu1').evaluate((el) => getComputedStyle(el).opacity))
    .toBe('1');

  expect(await axe(page)).toEqual([]);
});

// Forced side placement (sidebar pickers). On a phone-width panel the menu
// fits on neither side of the trigger: it must hug the viewport edge the
// author asked for, never be clamped back over the panel's own rows.
test('side dropdown hugs the requested edge when neither side fits', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/tests/fixtures/dropdown-side.html');
  await page.getByTestId('side-trigger').click();

  const menu = page.locator('#side-menu');
  await expect(menu).toBeVisible();
  const trigger = await page.getByTestId('side-trigger').boundingBox();
  const box = await menu.boundingBox();
  expect(box).not.toBeNull();
  // inside the viewport…
  expect(box!.x).toBeGreaterThanOrEqual(4);
  expect(box!.x + box!.width).toBeLessThanOrEqual(356);
  // …and on the side it was asked for: past the trigger, not pinned over the
  // panel at the viewport's left edge
  expect(box!.x).toBeGreaterThan(trigger!.x + 1);
  expect(box!.x + box!.width).toBeGreaterThan(340);
});

test('side dropdown flips to the left of a trigger at the right edge', async ({ page }) => {
  await page.goto('/tests/fixtures/dropdown-side.html');
  await page.getByTestId('flip-trigger').click();

  const menu = page.locator('#flip-menu');
  await expect(menu).toBeVisible();
  const trigger = await page.getByTestId('flip-trigger').boundingBox();
  const box = await menu.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(trigger!.x + 1);
});

// Sonner-style toast API.
test('toast appears and auto-dismisses', async ({ page }) => {
  test.setTimeout(8000);
  await page.goto('/tests/fixtures/toast.html');
  await page.getByTestId('fire').click();

  const toast = page.locator('.toast');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('Saved');

  // duration: 600 → element removed after exit transition
  await expect(toast).toHaveCount(0, { timeout: 5000 });
});

test('toast.promise shows loading then success in the same element', async ({ page }) => {
  test.setTimeout(8000);
  await page.goto('/tests/fixtures/toast.html');

  const result = await page.evaluate(async () => {
    const t = window.mo.toast.promise(
      new Promise((resolve) => setTimeout(() => resolve({ where: 'workspace' }), 300)),
      {
        loading: 'Uploading…',
        success: (d) => `Saved to ${d.where}`,
        error: 'Upload failed',
      },
      { duration: 5000 },
    );

    const phases = [{ text: t.querySelector('.toast-message')?.textContent, variant: t.getAttribute('data-variant') }];
    const observer = new MutationObserver(() => {
      phases.push({ text: t.querySelector('.toast-message')?.textContent, variant: t.getAttribute('data-variant') });
      if (phases.length === 2) {
        observer.disconnect();
      }
    });
    observer.observe(t, { subtree: true, childList: true, characterData: true });

    // Resolve happens after 300ms; give it room, then report observations.
    await new Promise((r) => setTimeout(r, 1000));

    return {
      sameElement: document.querySelectorAll('.toast').length === 1,
      stillConnected: t.isConnected,
      phases,
    };
  });

  expect(result.sameElement).toBe(true); // one toast for the whole lifecycle
  expect(result.stillConnected).toBe(true);
  expect(result.phases[0]).toEqual({ text: 'Uploading…', variant: 'info' });
  expect(result.phases.at(-1)).toEqual({ text: 'Saved to workspace', variant: 'success' });
});
