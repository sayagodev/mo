import { test, expect } from '@playwright/test';

// sw13 — mo-resizable: shadcn/ui Resizable (react-resizable-panels) contract.
const URL = 'file:///tmp/opencode/mo-resizable-harness.html';

const basis = (page, id) =>
  page.$$eval(`#${id} > [data-resizable-panel]`, (els) =>
    els.map((el) => getComputedStyle(el).flexGrow),
  );

const parseSizes = (raw: string) => raw.split(',').map(Number);

test('auto-inserts handles and starts 50/50 on flex-basis', async ({ page }) => {
  await page.goto(URL);
  const host = page.locator('#basic');
  await expect(host.locator('> [data-resizable-handle]')).toHaveCount(1);
  await expect(host.locator('> hr[data-resizable-handle]')).toHaveCount(1);

  const [a, b] = await basis(page, 'basic');
  expect(parseFloat(a)).toBeCloseTo(50, 1);
  expect(parseFloat(b)).toBeCloseTo(50, 1);
  expect(await host.getAttribute('data-sizes')).toBe('50,50');
});

test('handle is a focusable separator with ARIA value semantics', async ({ page }) => {
  await page.goto(URL);
  const handle = page.locator('#basic > [data-resizable-handle]');
  await expect(handle).toHaveAttribute('role', 'separator');
  await expect(handle).toHaveAttribute('tabindex', '0');
  await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
  await expect(handle).toHaveAttribute('aria-valuenow', '50');
  await handle.focus();
  await expect(handle).toBeFocused();
});

test('dragging the handle resizes panels; sizes sum to 100 and event fires', async ({ page }) => {
  await page.goto(URL);
  const host = page.locator('#basic');
  const events = [];
  await page.exposeFunction('__onResize', (detail) => events.push(detail));
  await host.evaluate((el) =>
    el.addEventListener('mo-resize', (e) => window.__onResize(e.detail)),
  );

  const handle = host.locator('> [data-resizable-handle]');
  const box = (await host.boundingBox())!;
  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  const sizes = parseSizes(await host.getAttribute('data-sizes')!);
  expect(sizes[0]).toBeGreaterThan(60);
  expect(sizes.reduce((s, n) => s + n, 0)).toBeCloseTo(100, 6);
  const widths = await page.$$eval('#basic > [data-resizable-panel]', (els) =>
    els.map((el) => el.getBoundingClientRect().width),
  );
  expect(widths[0] - widths[1]).toBeCloseTo(200, 0); // ~100px rightward drag on a ~384px host

  expect(events).toHaveLength(1);
  expect(events[0].sizes[0]).toBeCloseTo(sizes[0], 2);
});

test('keyboard arrows adjust by 2%, Shift by 10%', async ({ page }) => {
  await page.goto(URL);
  const handle = page.locator('#basic > [data-resizable-handle]');
  await handle.focus();

  await page.keyboard.press('ArrowRight');
  expect(await handle.getAttribute('aria-valuenow')).toBe('52');
  await page.keyboard.press('Shift+ArrowLeft');
  expect(await handle.getAttribute('aria-valuenow')).toBe('42');

  // Vertical group answers Up/Down instead (default 50/50).
  const vhandle = page.locator('#vertical > [data-resizable-handle]');
  await vhandle.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  expect(await vhandle.getAttribute('aria-valuenow')).toBe('48');
});

test('keyup emits mo-resize with current sizes', async ({ page }) => {
  await page.goto(URL);
  const events = await page.evaluate(
    () =>
      new Promise<any>((resolve) => {
        const host = document.getElementById('basic')!;
        host.addEventListener(
          'mo-resize',
          (e) => resolve((e as CustomEvent).detail.sizes),
          { once: true },
        );
        const handle = host.querySelector('[data-resizable-handle]') as HTMLElement;
        handle.focus();
        handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        handle.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
      }),
  );
  expect(events[0]).toBeCloseTo(52, 2);
});

test('data-min clamps dragging', async ({ page }) => {
  await page.goto(URL);
  const host = page.locator('#clamped');
  const handle = host.locator('> [data-resizable-handle]');
  const box = (await host.boundingBox())!;

  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(box.x - 300, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  const sizes = parseSizes(await host.getAttribute('data-sizes')!);
  expect(sizes[0]).toBeGreaterThanOrEqual(40);
  expect(sizes[1]).toBeLessThanOrEqual(60);
});

test('explicit handles are respected, not duplicated', async ({ page }) => {
  await page.goto(URL);
  const host = page.locator('#clamped');
  await expect(host.locator('> [data-resizable-handle]')).toHaveCount(1);
  await expect(host.locator('> hr[data-resizable-handle]')).toHaveCount(0); // author's kept
  await expect(host.locator('[data-resizable-grip]')).toHaveCount(1);
});

test('restores data-sizes from markup', async ({ page }) => {
  await page.goto(URL);
  const [a, b] = await basis(page, 'clamped');
  expect(parseFloat(a)).toBeCloseTo(50, 1);
  expect(parseFloat(b)).toBeCloseTo(50, 1);
});

test('vertical orientation stacks panels and flips handle axis', async ({ page }) => {
  await page.goto(URL);
  const host = page.locator('#vertical');
  await expect(host).toHaveCSS('flex-direction', 'column');
  const handle = host.locator('> [data-resizable-handle]');
  await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');

  const rects = await page.$$eval('#vertical > [data-resizable-panel]', (els) =>
    els.map((el) => el.getBoundingClientRect()),
  );
  expect(rects[0].bottom).toBeLessThanOrEqual(rects[1].top + 1);

  const heights = await page.$$eval('#vertical > [data-resizable-panel]', (els) =>
    els.map((el) => el.getBoundingClientRect().height),
  );
  expect(heights[0]).toBeCloseTo(heights[1], 0); // default 50/50

  // Drag up: the seam rises, so the first (top) panel shrinks.
  const box = (await host.boundingBox())!;
  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.25, { steps: 5 });
  await page.mouse.up();
  const sizes = parseSizes(await host.getAttribute('data-sizes')!);
  expect(sizes[0]).toBeLessThan(30);
  expect(sizes.reduce((s, n) => s + n, 0)).toBeCloseTo(100, 6);
});
