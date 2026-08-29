import { test, expect } from '@playwright/test';

// Popover — native [popover] anchored to its invoker by popover.js:
// Radix defaults (bottom, center, offset 4) with data-side/data-align.

test('opens centered below the trigger with a 4px offset', async ({ page }) => {
  await page.goto('/tests/fixtures/popover.html');
  const btn = page.locator('button[popovertarget="p-center"]');
  const box = await btn.boundingBox();
  await btn.click();
  const pop = page.locator('#p-center');
  await expect(pop).toBeVisible();
  await page.waitForTimeout(300); // let the 150ms enter transition settle
  const p = await pop.boundingBox();
  expect(Math.abs(p.x + p.width / 2 - (box.x + box.width / 2))).toBeLessThan(2);
  expect(p.y - (box.y + box.height)).toBeCloseTo(4, 0);
});

test('data-align=start aligns the surface edge with the trigger edge', async ({ page }) => {
  await page.goto('/tests/fixtures/popover.html');
  const btn = page.locator('button[popovertarget="p-start"]');
  const box = await btn.boundingBox();
  await btn.click();
  await page.waitForTimeout(300);
  const p = await page.locator('#p-start').boundingBox();
  expect(p.x).toBeCloseTo(box.x, 0);
});

test('data-align=end aligns the far edges', async ({ page }) => {
  await page.goto('/tests/fixtures/popover.html');
  const btn = page.locator('button[popovertarget="p-end"]');
  const box = await btn.boundingBox();
  await btn.click();
  await page.waitForTimeout(300);
  const p = await page.locator('#p-end').boundingBox();
  expect(p.x + p.width).toBeCloseTo(box.x + box.width, 0);
});

test('data-side=top places the surface above the trigger', async ({ page }) => {
  await page.goto('/tests/fixtures/popover.html');
  const btn = page.locator('button[popovertarget="p-top"]');
  const box = await btn.boundingBox();
  await btn.click();
  await page.waitForTimeout(300);
  const p = await page.locator('#p-top').boundingBox();
  expect(p.y + p.height).toBeCloseTo(box.y - 4, 0);
});

test('repositions when the page scrolls while open', async ({ page }) => {
  await page.goto('/tests/fixtures/popover.html');
  const btn = page.locator('button[popovertarget="p-center"]');
  await btn.click();
  await expect(page.locator('#p-center')).toBeVisible();
  await page.waitForTimeout(300);
  const before = await page.locator('#p-center').boundingBox();
  await page.evaluate(() => window.scrollTo(0, 120));
  await page.waitForTimeout(300);
  const after = await page.locator('#p-center').boundingBox();
  expect(after.y).toBe(before.y - 120);
  expect(after.x).toBe(before.x);
});