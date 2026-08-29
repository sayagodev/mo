import { test, expect } from '@playwright/test';

// shadcn Button parity (base, toned down radius): h-9 (36px), rounded (10px), text-sm (14px), font-medium (500)
test('button matches shadcn computed styles', async ({ page }) => {
  await page.goto('/tests/fixtures/button.html');
  const btn = page.getByTestId('default');
  const s = await btn.evaluate((el) => {
    const c = getComputedStyle(el);
    return { h: c.height, r: c.borderRadius, fs: c.fontSize, fw: c.fontWeight };
  });
  expect(s.h).toBe('36px');           // h-9
  expect(parseFloat(s.r)).toBeCloseTo(10); // --radius-large (moderate, not 24px)
  expect(s.fs).toBe('14px');          // text-sm
  expect(s.fw).toBe('500');           // font-medium
});

test('variants expose distinct surfaces', async ({ page }) => {
  await page.goto('/tests/fixtures/button.html');
  const bg = (id: string) =>
    page.getByTestId(id).evaluate((el) => getComputedStyle(el).backgroundColor);
  const def = await bg('default');
  const outline = await bg('outline');
  const ghost = await bg('ghost');
  const secondary = await bg('secondary');
  expect(def).not.toBe(outline);
  expect(ghost).not.toBe(outline); // ghost transparent, outline has bg-background per shadcn
  expect(secondary).not.toBe(def);
  expect(ghost).toBe('rgba(0, 0, 0, 0)');

  // outline carries the hairline border
  const bw = await page
    .getByTestId('outline')
    .evaluate((el) => getComputedStyle(el).borderTopWidth);
  expect(bw).toBe('1px');
});

test('disabled buttons are inert and dimmed', async ({ page }) => {
  await page.goto('/tests/fixtures/button.html');
  const d = page.getByTestId('disabled');
  await expect(d).toBeDisabled();
  const s = await d.evaluate((el) => {
    const c = getComputedStyle(el);
    return { opacity: +c.opacity, pe: c.pointerEvents };
  });
  expect(s.opacity).toBe(0.5);
  expect(s.pe).toBe('none');
});

test('small size is 32px like sm', async ({ page }) => {
  await page.goto('/tests/fixtures/button.html');
  const h = await page
    .getByTestId('small')
    .evaluate((el) => getComputedStyle(el).height);
  expect(h).toBe('32px'); // h-8
});

// shadcn Spinner = Loader2 size-4 inheriting text color: 16px, currentColor
// arc over a 20% currentColor track (same recipe as badge.css).
test('spinner inside button is icon-sized and inherits currentColor', async ({ page }) => {
  await page.goto('/tests/fixtures/button.html');
  const spin = (id: string) =>
    page
      .getByTestId(id)
      .evaluate((el) => {
        const span = el.querySelector('[aria-busy="true"]')!;
        const s = getComputedStyle(span, '::before');
        const c = getComputedStyle(el).color;
        return { w: s.width, top: s.borderTopColor, track: s.borderBottomColor, btnColor: c };
      });
  const solid = await spin('loading');
  expect(solid.w).toBe('16px'); // size-4, not spinner.css default 24px
  expect(solid.top).toBe(solid.btnColor); // arc follows button text color
  expect(solid.track).toContain('0.2'); // color-mix(currentColor 20%, transparent)

  // outline variant: same geometry, foreground-colored like its label
  const outline = await spin('loading-outline');
  expect(outline.w).toBe('16px');
  expect(outline.top).not.toBe(solid.top);
});
