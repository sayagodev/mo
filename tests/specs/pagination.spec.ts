import { test, expect } from '@playwright/test';

// Pagination — shadcn prev/next geometry: 16px chevron + label hidden
// below 640px; rows-per-page select listbox matches the trigger width.

test('prev/next chevron renders at 16px with the label beside it', async ({ page }) => {
  await page.goto('/tests/fixtures/pagination.html');
  const prev = page.locator('a[aria-label="Go to previous page"]');
  const svg = await prev.locator('svg').boundingBox();
  expect(svg.width).toBeCloseTo(16, 0);
  expect(svg.height).toBeCloseTo(16, 0);
  await expect(prev.locator('.pagination-label')).toBeVisible();
  const gap = await prev.evaluate((el) => getComputedStyle(el).gap);
  expect(parseFloat(gap)).toBeCloseTo(4, 0);
});

test('pagination label hides below 640px leaving an icon-only button', async ({ page }) => {
  await page.goto('/tests/fixtures/pagination.html');
  const prev = page.locator('a[aria-label="Go to previous page"]');
  await expect(prev.locator('.pagination-label')).toBeVisible();
  await page.setViewportSize({ width: 500, height: 800 });
  await expect(prev.locator('.pagination-label')).toBeHidden();
  const box = await prev.boundingBox();
  expect(box.width).toBeLessThanOrEqual(40); // icon-only square
});

test('rows-per-page select listbox matches the trigger width', async ({ page }) => {
  await page.goto('/tests/fixtures/pagination.html');
  const select = page.locator('mo-select');
  await select.locator('[data-select-trigger]').click();
  const t = await select.locator('[data-select-trigger]').boundingBox();
  const list = await select.locator('ul[popover]:popover-open').boundingBox();
  expect(Math.abs(list.width - t.width)).toBeLessThan(2);
});

test('picking a row size updates the trigger label', async ({ page }) => {
  await page.goto('/tests/fixtures/pagination.html');
  const select = page.locator('mo-select');
  await select.locator('[data-select-trigger]').click();
  await page.locator('ul[popover]:popover-open li button[role=option]').filter({ hasText: '50' }).click();
  await expect(select.locator('[data-select-value]')).toHaveText('50');
});