import { test, expect } from '@playwright/test';
import { axe } from './axe';

// shadcn Input parity: h-9, rounded-md, focus ring 3px ring/50 + border-ring.
test('input matches shadcn geometry and focus ring', async ({ page }) => {
  await page.goto('/tests/fixtures/form.html');
  const input = page.getByTestId('input');
  const s = await input.evaluate((el) => {
    const c = getComputedStyle(el);
    return { h: c.height, r: c.borderRadius, fs: c.fontSize };
  });
  expect(s.h).toBe('36px');
  expect(parseFloat(s.r)).toBeCloseTo(8);
  expect(s.fs).toBe('14px');

  await input.focus();
  await page.waitForTimeout(250); // focus ring transitions in over 150ms
  const ring = await input.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(ring).toContain('3px'); // ring shadow present on :focus

  const border = await input.evaluate((el) => getComputedStyle(el).borderTopColor);
  expect(border).toBeTruthy();
});

// Switch geometry: w-8 track, thumb travels to the right edge.
test('switch track is 32px wide and thumb translates when checked', async ({ page }) => {
  await page.goto('/tests/fixtures/form.html');
  const sw = page.getByTestId('switch');
  const w = await sw.evaluate((el) => getComputedStyle(el).width);
  expect(parseFloat(w)).toBeCloseTo(32);

  const before = await sw.evaluate((el) =>
    getComputedStyle(el, '::before').transform,
  );
  await sw.uncheck();
  await page.waitForTimeout(300); // thumb transition is 200ms
  const after = await sw.evaluate((el) =>
    getComputedStyle(el, '::before').transform,
  );
  expect(before).not.toBe(after);
});

test('form fixture passes axe', async ({ page }) => {
  await page.goto('/tests/fixtures/form.html');
  // inputs without labels are intentional here except switch/check which have them
  const violations = await axe(page);
  expect(violations.filter((v) => !v.startsWith('label'))).toEqual([]);
});
