import { test, expect } from '@playwright/test';

// Regression: select() focuses its element (Blink), and the focusin handler
// defers it to the next frame so the caret has landed first. A stale callback
// used to run after auto-advance had already moved on — selecting the cell
// that lost focus stole it back, its focusin queued another frame, and the two
// cells ping-ponged focus (~4 focus events per frame, forever) until the page
// hung. Counting focusin while idle is the cheapest detector.
const countFocus = () => {
  (window as unknown as { __focus: number }).__focus = 0;
  document.addEventListener('focusin', () => {
    (window as unknown as { __focus: number }).__focus++;
  }, true);
};

const focusCount = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __focus: number }).__focus);

test('fast typing does not start a focus ping-pong', async ({ page }) => {
  await page.addInitScript(countFocus);
  await page.goto('/tests/fixtures/input-otp.html');

  const cells = page.locator('mo-otp input:not([type="hidden"])');
  await expect(cells).toHaveCount(6);

  await cells.first().click();
  await page.keyboard.type('123456'); // no delay: keystrokes land inside the same frames

  await page.waitForTimeout(200); // let pending rAF callbacks run
  const before = await focusCount(page);
  await page.waitForTimeout(700);
  const after = await focusCount(page);

  expect(after - before).toBeLessThan(10); // idle page: no focus churn
  expect(after).toBeLessThan(40);
});

test('a cell that lost focus before the frame does not steal it back', async ({ page }) => {
  await page.addInitScript(countFocus);
  await page.goto('/tests/fixtures/input-otp.html');
  await expect(page.locator('mo-otp input')).toHaveCount(7); // 6 cells + hidden mirror

  // Both focus moves inside one task: the rAF queued by cell 0 runs while
  // cell 1 owns the focus.
  await page.evaluate(() => {
    const cells = [...document.querySelectorAll<HTMLInputElement>('mo-otp input:not([type="hidden"])')];
    cells[0].focus();
    cells[1].focus();
  });

  await page.waitForTimeout(300);
  const before = await focusCount(page);
  await page.waitForTimeout(500);
  const after = await focusCount(page);

  expect(after - before).toBeLessThan(10);
  const focused = await page.evaluate(() => {
    const cells = [...document.querySelectorAll<HTMLInputElement>('mo-otp input:not([type="hidden"])')];
    return cells.indexOf(document.activeElement as HTMLInputElement);
  });
  expect(focused).toBe(1); // focus stays where the user put it
});

test('typing over a filled cell replaces its digit', async ({ page }) => {
  await page.goto('/tests/fixtures/input-otp.html');

  const cells = page.locator('mo-otp input:not([type="hidden"])');
  await cells.first().click();
  await page.keyboard.type('1');
  await cells.first().click();
  await page.keyboard.type('9');

  await expect(cells.first()).toHaveValue('9');
  await expect(cells.nth(1)).toHaveValue('');
});
