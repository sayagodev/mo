import { test, expect } from '@playwright/test';

// mo-slider — single/range/multiple thumbs, vertical, keyboard, pointer, display sync.
// Thumb is white in both themes (mo-slider-thumb-bg defaults to #fff).

test('renders one thumb per value with the filled range between extremes', async ({ page }) => {
  await page.goto('/tests/fixtures/slider.html');
  await expect(page.getByTestId('single').locator('[data-slider-thumb]')).toHaveCount(1);
  await expect(page.getByTestId('range').locator('[data-slider-thumb]')).toHaveCount(2);
  await expect(page.getByTestId('multi').locator('[data-slider-thumb]')).toHaveCount(3);

  const thumbs = await page.getByTestId('range').locator('[data-slider-thumb]').evaluateAll((els) =>
    els.map((el) => (el as HTMLElement).style.left),
  );
  expect(thumbs).toEqual(['25%', '75%']);
});

test('thumb is white in light and dark themes', async ({ page }) => {
  await page.goto('/tests/fixtures/slider.html');
  const thumb = page.getByTestId('single').locator('[data-slider-thumb]');
  await expect(thumb).toHaveCSS('background-color', 'rgb(255, 255, 255)');

  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await expect(thumb).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('pointer drag moves a single thumb and syncs the value display', async ({ page }) => {
  await page.goto('/tests/fixtures/slider.html');
  const slider = page.getByTestId('single');
  const thumb = slider.locator('[data-slider-thumb]');
  const box = await thumb.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByTestId('single-value')).not.toHaveText('50');
  const value = await slider.getAttribute('value');
  expect(parseFloat(value)).toBeGreaterThan(50);
});

test('range drag keeps thumbs sorted and updates the display', async ({ page }) => {
  await page.goto('/tests/fixtures/slider.html');
  const slider = page.getByTestId('range');
  const thumb = slider.locator('[data-slider-thumb]').first();
  const box = await thumb.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();

  const value = await slider.getAttribute('value');
  const [a, b] = value.split(',').map(Number);
  expect(a).toBeGreaterThan(25);
  expect(b).toBe(75);
  await expect(page.getByTestId('range-value')).toHaveText(`${a} · ${b}`);
});

test('keyboard arrows step the focused thumb', async ({ page }) => {
  await page.goto('/tests/fixtures/slider.html');
  const slider = page.getByTestId('single');
  await slider.locator('[data-slider-thumb]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('value', '52');
});

test('vertical slider drags along the block axis', async ({ page }) => {
  await page.goto('/tests/fixtures/slider.html');
  const slider = page.getByTestId('vertical');
  const thumb = slider.locator('[data-slider-thumb]');
  const box = await thumb.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 60, { steps: 8 });
  await page.mouse.up();

  const value = await slider.getAttribute('value');
  expect(parseFloat(value)).toBeGreaterThan(50);
  const bottom = await thumb.evaluate((el) => (el as HTMLElement).style.bottom);
  expect(bottom).not.toBe('50%');
});

test('disabled mo-slider ignores pointer input', async ({ page }) => {
  await page.goto('/tests/fixtures/slider.html');
  await page.getByTestId('single').evaluate((el) => el.setAttribute('disabled', ''));
  const slider = page.getByTestId('single');
  const box = await slider.locator('[data-slider-track]').boundingBox();
  await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
  await expect(slider).toHaveAttribute('value', '50');
});