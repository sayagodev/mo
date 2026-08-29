import { test, expect } from '@playwright/test';
import { axe } from './axe';

// shadcn Badge: solid destructive (bg-destructive), outline hairline, tinted status extensions.
test('badge variants render distinct surfaces', async ({ page }) => {
  await page.goto('/tests/fixtures/badge.html');
  const bg = (id: string) =>
    page.getByTestId(id).evaluate((el) => getComputedStyle(el).backgroundColor);
  const def = await bg('default');
  expect(def).not.toBe('rgba(0, 0, 0, 0)');       // primary is solid
  expect(await bg('outline')).toBe('rgba(0, 0, 0, 0)');
  expect(await bg('danger')).not.toBe(def);

  // destructive badge uses white foreground like shadcn
  const fg = await page
    .getByTestId('danger')
    .evaluate((el) => getComputedStyle(el).color);
  expect(fg).toMatch(/rgb\(255, 255, 255\)|oklch/);
});

test('badge fixture passes axe', async ({ page }) => {
  await page.goto('/tests/fixtures/badge.html');
  expect(await axe(page)).toEqual([]);
});

// shadcn Alert: grid layout; icon opens two columns; description muted; danger colored text.
test('alert is a grid with title/description in column 2', async ({ page }) => {
  await page.goto('/tests/fixtures/alert.html');
  const a = page.getByTestId('default');
  const s = await a.evaluate((el) => {
    const c = getComputedStyle(el);
    return { display: c.display, cols: c.gridTemplateColumns };
  });
  expect(s.display).toBe('grid');

  const col = await a.locator('p').evaluate((p) => getComputedStyle(p).gridColumnStart);
  expect(col).toBe('2');

  const descColor = await a.locator('p').evaluate((p) => getComputedStyle(p).color);
  const textColor = await a.locator('h4').evaluate((h) => getComputedStyle(h).color);
  expect(descColor).not.toBe(textColor); // description muted
});

test('icon switches alert to two columns', async ({ page }) => {
  await page.goto('/tests/fixtures/alert.html');
  const cols = await page
    .getByTestId('icon')
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(cols).toBe(2);
});

test('alert fixture passes axe', async ({ page }) => {
  await page.goto('/tests/fixtures/alert.html');
  expect(await axe(page)).toEqual([]);
});
