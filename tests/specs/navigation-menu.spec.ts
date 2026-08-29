import { test, expect } from '@playwright/test';

// Navigation Menu — <mo-navigation-menu>: hover opens panels (200ms),
// data-open="click" requires clicks, no underline indicator, aria-expanded
// syncs, panels placed centered below their trigger.

test('hover opens the panel without a click and syncs aria-expanded', async ({ page }) => {
  await page.goto('/tests/fixtures/navigation-menu.html');
  const trigger = page.getByTestId('hover-menu').locator('li > button[popovertarget]');
  const box = await trigger.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('#nm-hover')).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
});

test('hover mode closes the panel when the pointer leaves the menu', async ({ page }) => {
  await page.goto('/tests/fixtures/navigation-menu.html');
  const trigger = page.getByTestId('hover-menu').locator('li > button[popovertarget]');
  const box = await trigger.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('#nm-hover')).toBeVisible();
  await page.mouse.move(5, 500);
  await expect(page.locator('#nm-hover')).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('panel opens centered below its trigger', async ({ page }) => {
  await page.goto('/tests/fixtures/navigation-menu.html');
  const trigger = page.getByTestId('hover-menu').locator('li > button[popovertarget]');
  const box = await trigger.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('#nm-hover')).toBeVisible();
  const p = await page.locator('#nm-hover').boundingBox();
  expect(Math.abs(p.x + p.width / 2 - (box.x + box.width / 2))).toBeLessThan(2);
  expect(p.y).toBeGreaterThan(box.y + box.height);
});

test('data-open=click does not open on hover, only on click', async ({ page }) => {
  await page.goto('/tests/fixtures/navigation-menu.html');
  const trigger = page.getByTestId('click-menu').locator('li > button[popovertarget]');
  const box = await trigger.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  await expect(page.locator('#nm-click')).toBeHidden();
  await trigger.click();
  await expect(page.locator('#nm-click')).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
});

test('triggers have no underline indicator (no ::after bar)', async ({ page }) => {
  await page.goto('/tests/fixtures/navigation-menu.html');
  const trigger = page.getByTestId('hover-menu').locator('li > button[popovertarget]');
  const after = await trigger.evaluate((el) => getComputedStyle(el, '::after').content);
  expect(after).toBe('none');
});

test('esc closes the panel and aria-expanded follows', async ({ page }) => {
  await page.goto('/tests/fixtures/navigation-menu.html');
  const trigger = page.getByTestId('hover-menu').locator('li > button[popovertarget]');
  const box = await trigger.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('#nm-hover')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#nm-hover')).toBeHidden();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});