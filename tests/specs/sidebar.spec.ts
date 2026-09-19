import { test, expect } from '@playwright/test';

const details = (page: import('@playwright/test').Page) =>
  page.locator('details:has([data-test="sub-trigger"])');

// The collapsed icon rail hides the submenus, so freezing their triggers is
// right — but only there. On a phone the panel is a visible overlay, and the
// guard (which had no breakpoint) left every trigger dead: the click ran
// preventDefault() on a details the reader could actually see.
test('sub trigger opens on the mobile overlay panel', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/tests/fixtures/sidebar.html');

  await page.getByTestId('toggle').click();
  await expect(page.locator('[data-test="layout"]')).toHaveAttribute('data-sidebar-open', '');

  await page.getByTestId('sub-trigger').click();
  await expect(details(page)).toHaveAttribute('open', '');
});

test('collapsed icon rail still freezes sub triggers', async ({ page }) => {
  await page.goto('/tests/fixtures/sidebar.html');

  await page.getByTestId('toggle').click();
  await expect(page.locator('[data-test="layout"]')).toHaveAttribute('data-sidebar-open', '');

  await page.getByTestId('sub-trigger').click();
  await expect(details(page)).not.toHaveAttribute('open', '');
});
