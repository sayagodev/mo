import { test, expect } from '@playwright/test';
import { axe } from './axe';

// Native details semantics — the accessible base shadcn Accordion builds on.
test('summary toggles the item', async ({ page }) => {
  await page.goto('/tests/fixtures/accordion.html');
  const second = page.locator('#acc-2');
  await expect(second).not.toHaveAttribute('open');
  await second.locator('summary').click();
  await expect(second).toHaveAttribute('open');

  // first stays open — shadcn accordion type="multiple" default in examples
  await expect(page.locator('#acc-1')).toHaveAttribute('open');
});

test('chevron rotates when open', async ({ page }) => {
  await page.goto('/tests/fixtures/accordion.html');
  const rot = () =>
    page.$eval('#acc-1 summary', (s) =>
      getComputedStyle(s, '::after').transform,
    );
  const closed = page.locator('#acc-2');
  await closed.locator('summary').click();
  const t = await page.$eval('#acc-2 summary', (s) =>
    getComputedStyle(s, '::after').transform,
  );
  expect(t).toContain('matrix'); // rotated via transform
});

test('accordion fixture passes axe', async ({ page }) => {
  await page.goto('/tests/fixtures/accordion.html');
  expect(await axe(page)).toEqual([]);
});
