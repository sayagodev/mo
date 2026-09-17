import { test, expect } from '@playwright/test';

// Tooltip auto placement: resolves to the side with the most viewport space.
test.use({ viewport: { width: 1280, height: 720 } });

test('auto flips away from the viewport edge', async ({ page }) => {
  await page.goto('/tests/fixtures/tooltip.html');

  const right = page.getByTestId('near-right');
  await right.hover();
  await expect
    .poll(() => right.getAttribute('data-tooltip-placement'))
    .toBe('left');
  // Bubble must stay inside the viewport (no right-edge clipping).
  const overflows = await right.evaluate((el) => {
    const cs = getComputedStyle(el, '::after');
    const r = el.getBoundingClientRect();
    return r.right + parseFloat(cs.width) + 22 > window.innerWidth;
  });
  expect(overflows).toBe(false);
});

test('auto picks the roomiest side, fixed placement never resolves', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/tooltip.html');

  const roomy = page.getByTestId('roomy');
  await roomy.hover();
  await expect
    .poll(() => roomy.getAttribute('data-tooltip-placement'))
    .toBe('right');

  const fixed = page.getByTestId('fixed');
  await fixed.hover();
  await page.waitForTimeout(100);
  expect(await fixed.getAttribute('data-tooltip-placement')).toBe('right');
  expect(await fixed.getAttribute('data-mo-tooltip-auto')).toBe(null);
});

test('auto restores after hide', async ({ page }) => {
  await page.goto('/tests/fixtures/tooltip.html');

  const right = page.getByTestId('near-right');
  await right.hover();
  await expect
    .poll(() => right.getAttribute('data-tooltip-placement'))
    .not.toBe('auto');
  await page.mouse.move(400, 500);
  await expect
    .poll(() => right.getAttribute('data-tooltip-placement'))
    .toBe('auto');
});
