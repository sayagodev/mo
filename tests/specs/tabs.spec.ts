import { test, expect } from '@playwright/test';
import { axe } from './axe';

// WAI-ARIA APG Tabs pattern — the contract Radix Tabs enforces for shadcn.
test('click activates tab and shows its panel', async ({ page }) => {
  await page.goto('/tests/fixtures/tabs.html');
  await page.click('#t2');
  await expect(page.locator('#t2')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#t1')).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('#p2')).toBeVisible();
  await expect(page.locator('#p1')).toBeHidden();
});

test('ArrowRight moves focus, Enter activates (manual activation)', async ({ page }) => {
  await page.goto('/tests/fixtures/tabs.html');
  await page.click('#t1'); // ensure start state
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#t2')).toBeFocused();
  await expect(page.locator('#t2')).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('Enter');
  await expect(page.locator('#t2')).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#t1')).toBeFocused();
  await expect(page.locator('#t1')).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press(' ');
  await expect(page.locator('#t1')).toHaveAttribute('aria-selected', 'true');

  // wraps around focus (without activation)
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#t3')).toBeFocused();
  await expect(page.locator('#t3')).toHaveAttribute('aria-selected', 'false');
});

test('only the active tab is in the page tab order', async ({ page }) => {
  await page.goto('/tests/fixtures/tabs.html');
  await page.click('#t3');
  const tabbables = await page.$$eval('[role="tab"]', (tabs) =>
    tabs.map((t) => (t as HTMLElement).tabIndex),
  );
  expect(tabbables).toEqual([-1, -1, 0]);
});

test('panels are labelled by their tabs', async ({ page }) => {
  await page.goto('/tests/fixtures/tabs.html');
  const controls = await page.$eval('#p1', (p) => p.getAttribute('aria-labelledby'));
  const id = await page.$eval('#t1', (t) => t.id);
  expect(controls).toBe(id);
});

test('tabs fixture passes axe', async ({ page }) => {
  await page.goto('/tests/fixtures/tabs.html');
  expect(await axe(page)).toEqual([]);
});
