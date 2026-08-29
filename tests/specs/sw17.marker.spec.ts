import { test, expect } from '@playwright/test';
import { axe } from './axe';

// sw17 — shadcn Marker port: [data-marker] row root with
// [data-marker-icon] + [data-marker-content], border/separator
// variants, role="status" + spinner, .shimmer, polymorphic links.

test('default marker is a muted flex row in text-sm', async ({ page }) => {
  await page.goto('/tests/fixtures/marker.html');
  const marker = page.getByTestId('default');
  const s = await marker.evaluate((el) => {
    const c = getComputedStyle(el);
    return {
      display: c.display,
      flexDirection: c.flexDirection,
      alignItems: c.alignItems,
      fontSize: c.fontSize,
      color: c.color,
    };
  });
  expect(s.display).toBe('flex');
  expect(s.flexDirection).toBe('row');
  expect(s.alignItems).toBe('center');
  expect(parseFloat(s.fontSize)).toBeCloseTo(14); // text-sm
  expect(s.color).not.toBe('rgb(0, 0, 0)');
});

test('icon slot is a fixed 1rem square and its svg fills it', async ({ page }) => {
  await page.goto('/tests/fixtures/marker.html');
  const icon = page.getByTestId('default').locator('[data-marker-icon]');
  const box = await icon.boundingBox();
  expect(box?.width).toBeCloseTo(16, 0);
  expect(box?.height).toBeCloseTo(16, 0);
  const svgBox = await icon.locator('svg').boundingBox();
  expect(svgBox?.width).toBeCloseTo(16, 0);
  const display = await icon.evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('flex');
});

test('separator variant draws hairline pseudo-elements around a centered label', async ({ page }) => {
  await page.goto('/tests/fixtures/marker.html');
  const marker = page.getByTestId('separator');
  const before = await marker.evaluate((el) => {
    const c = getComputedStyle(el, '::before');
    return { h: c.height, flex: c.flexGrow, bg: c.backgroundColor, mr: c.marginRight };
  });
  expect(before.h).toBe('1px');
  expect(before.flex).toBe('1');
  expect(before.bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(parseFloat(before.mr)).toBeCloseTo(4); // space-1

  const content = await marker
    .locator('[data-marker-content]')
    .evaluate((el) => ({ center: getComputedStyle(el).textAlign, flex: getComputedStyle(el).flexGrow }));
  expect(content.center).toBe('center');
  expect(content.flex).toBe('0');
});

test('border variant adds a bottom hairline with padding', async ({ page }) => {
  await page.goto('/tests/fixtures/marker.html');
  const marker = page.getByTestId('border');
  const s = await marker.evaluate((el) => {
    const c = getComputedStyle(el);
    return { bw: c.borderBottomWidth, bs: c.borderBottomStyle, pb: c.paddingBottom };
  });
  expect(s.bw).toBe('1px');
  expect(s.bs).toBe('solid');
  expect(s.pb).toBe('8px');
});

test('status marker renders a small spinning indicator in the icon slot', async ({ page }) => {
  await page.goto('/tests/fixtures/marker.html');
  const spin = page.getByTestId('status').locator('[aria-busy="true"]');
  const s = await spin.evaluate((el) => {
    const c = getComputedStyle(el, '::before');
    return { w: c.width, anim: c.animationName, display: c.display };
  });
  expect(parseFloat(s.w)).toBeCloseTo(16, 0); // small spinner = 1rem
  expect(s.anim).toBe('spin');
  expect(s.display).not.toBe('none');
});

test('shimmer animates and stops under prefers-reduced-motion', async ({ page }) => {
  await page.goto('/tests/fixtures/marker.html');
  const content = page.getByTestId('status').locator('[data-marker-content]');
  expect(await content.evaluate((el) => getComputedStyle(el).animationName)).toBe('mo-marker-shimmer');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await content.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

test('link and button roots strip UA chrome and stay muted', async ({ page }) => {
  await page.goto('/tests/fixtures/marker.html');

  const link = await page.getByTestId('link').evaluate((el) => {
    const c = getComputedStyle(el);
    return { deco: c.textDecorationLine, color: c.color };
  });
  expect(link.deco).not.toContain('underline');
  expect(link.color).not.toBe('rgb(0, 0, 0)');

  const button = await page.getByTestId('button').evaluate((el) => {
    const c = getComputedStyle(el);
    return { border: c.borderTopWidth, cursor: c.cursor, color: c.color };
  });
  expect(button.border).toBe('0px');
  expect(button.cursor).toBe('pointer');
  expect(button.color).not.toBe('rgb(0, 0, 0)');
});

test('links inside content stay underlined and inherit the marker color', async ({ page }) => {
  await page.goto('/tests/fixtures/marker.html');
  const a = await page.getByTestId('inner-a').evaluate((el) => {
    const c = getComputedStyle(el);
    return { deco: c.textDecorationLine, offset: c.textUnderlineOffset, color: c.color };
  });
  expect(a.deco).toContain('underline');
  expect(parseFloat(a.offset)).toBeCloseTo(3);
  const markerColor = await page.getByTestId('inner-link').evaluate((el) => getComputedStyle(el).color);
  expect(a.color).toBe(markerColor);
});

test('marker fixture passes axe', async ({ page }) => {
  await page.goto('/tests/fixtures/marker.html');
  expect(await axe(page)).toEqual([]);
});