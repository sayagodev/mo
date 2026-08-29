import { test, expect } from '@playwright/test';

// sw15 — mo-data-table: shadcn/ui data-table contract (sort/select/paginate/filter)
// over a plain semantic table. Harness loads dist/mo.min.css + mo.min.js.
const URL = '/tests/fixtures/data-table.html';

const rows = (page, id: string) =>
  page.$$eval(`#${id} tbody tr:not([hidden])`, (els) =>
    els.map((el) => el.querySelector('td')!.textContent!.trim()));

test('click cycles sort asc → desc → none with aria-sort and row order flips', async ({ page }) => {
  await page.goto(URL);
  const th = page.locator('#basic th[data-sortable]').first();
  const btn = page.getByTestId('sort-name');

  await expect(th).not.toHaveAttribute('aria-sort');

  await btn.click(); // ascending (case-insensitive string compare)
  await expect(th).toHaveAttribute('aria-sort', 'ascending');
  expect(await rows(page, 'basic')).toEqual(['alice', 'Boris', 'Dana']);

  await btn.click(); // descending
  await expect(th).toHaveAttribute('aria-sort', 'descending');
  expect(await rows(page, 'basic')).toEqual(['Dana', 'Boris', 'alice']);

  await btn.click(); // none → original order restored
  await expect(th).not.toHaveAttribute('aria-sort');
  expect(await rows(page, 'basic')).toEqual(['Dana', 'alice', 'Boris']);
});

test('all-numeric columns sort numerically, not lexically', async ({ page }) => {
  await page.goto(URL);
  const btn = page.getByTestId('sort-amount');
  await btn.click();
  expect(await rows(page, 'basic')).toEqual(['Dana', 'Boris', 'alice']); // $9 < $250 < $1200.50
  await btn.click();
  expect(await rows(page, 'basic')).toEqual(['alice', 'Boris', 'Dana']);
});

test('sorting one column clears the other; single sort only', async ({ page }) => {
  await page.goto(URL);
  await page.getByTestId('sort-name').click();
  await page.getByTestId('sort-amount').click();
  await expect(page.locator('#basic th').first()).not.toHaveAttribute('aria-sort');
  await expect(page.locator('#basic th').nth(1)).toHaveAttribute('aria-sort', 'ascending');
});

test('bare sortable header sorts via keyboard (Enter)', async ({ page }) => {
  await page.goto(URL);
  const th = page.getByTestId('bare-header');
  await expect(th).toHaveAttribute('tabindex', '0');
  await th.focus();
  await page.keyboard.press('Enter');
  await expect(th).toHaveAttribute('aria-sort', 'ascending');
  expect(await rows(page, 'bare')).toEqual(['a@example.com', 'z@example.com']);
});

test('header checkbox reflects checked and indeterminate states', async ({ page }) => {
  await page.goto(URL);
  const all = page.getByTestId('select-all');
  const rowBoxes = page.locator('#select td[data-select] input');

  // Markup starts with one of three rows pre-checked.
  await expect(all).toHaveJSProperty('indeterminate', true);
  await expect(all).not.toBeChecked();

  await rowBoxes.nth(0).check();
  await rowBoxes.nth(1).check();
  // All visible rows selected → fully checked, no longer indeterminate.
  await expect(all).toBeChecked();
  await expect(all).toHaveJSProperty('indeterminate', false);

  // Uncheck one → back to indeterminate.
  await rowBoxes.nth(1).uncheck();
  await expect(all).toHaveJSProperty('indeterminate', true);
});

test('select-all toggles every row; rows tint via tr[data-selected]', async ({ page }) => {
  await page.goto(URL);

  const bgOf = (nth: number) =>
    page.$$eval('#select tbody tr', (els, n) => getComputedStyle(els[n]!).backgroundColor, nth);

  const unselected = await bgOf(1);
  await page.locator('#select td[data-select] input').nth(1).check();

  // Row checkbox sets [data-selected], which tints the tr.
  expect(await page.locator('#select tbody tr').nth(1).getAttribute('data-selected')).toBe('');
  const tinted = await bgOf(1);
  expect(tinted).not.toBe(unselected);
  expect(tinted).not.toMatch(/\(0 [\d.]+ [\d.]+ [\d.]+ \/ 0\)/); // resolved color, not transparent

  // Info mirrors shadcn: "{selected} of {total} row(s) selected".
  await expect(page.locator('#select [data-test=select-info]')).toHaveText('2 of 3 row(s) selected');

  // Header click when not-all-selected → checks everything.
  await page.getByTestId('select-all').check();
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('#select td[data-select] input').nth(i)).toBeChecked();
    expect(await page.locator('#select tbody tr').nth(i).getAttribute('data-selected')).toBe('');
  }

  // Header click again (currently fully checked) → clears everything.
  await page.getByTestId('select-all').click();
  for (let i = 0; i < 3; i++) {
    await expect(page.locator('#select td[data-select] input').nth(i)).not.toBeChecked();
    expect(await page.locator('#select tbody tr').nth(i).getAttribute('data-selected')).toBeNull();
  }
});

test('pagination slices rows, updates info, disables at ends', async ({ page }) => {
  await page.goto(URL);
  const prev = page.locator('#paged [data-test=prev]');
  const next = page.locator('#paged [data-test=next]');
  const info = page.locator('#paged [data-test=info]');

  await expect(prev).toBeDisabled();
  await expect(next).toBeEnabled();
  expect(await rows(page, 'paged')).toEqual(['INV001', 'INV002', 'INV003', 'INV004', 'INV005']);
  await expect(info).toHaveText('12 row(s)');

  await next.click();
  expect(await rows(page, 'paged')).toEqual(['INV006', 'INV007', 'INV008', 'INV009', 'INV010']);
  await expect(prev).toBeEnabled();

  await next.click();
  expect(await rows(page, 'paged')).toEqual(['INV011', 'INV012']);
  await expect(next).toBeDisabled();

  await prev.click();
  expect((await rows(page, 'paged'))[0]).toBe('INV006');
});

test('filter narrows rows and resets to page 1', async ({ page }) => {
  await page.goto(URL);
  const filter = page.getByTestId('filter');
  const info = page.locator('#filtered [data-test=info]');

  // Page size 2: land on page 2 first (rows 3–4 of the unfiltered order).
  await page.locator('#filtered [data-test=next]').click();
  expect(await rows(page, 'filtered')).toEqual(['Paid', 'Unpaid']);

  // Typing resets to page 1; matching is case-insensitive substring
  // ("Unpaid" contains "paid"; "Pending" does not).
  await filter.fill('paid');
  expect(await rows(page, 'filtered')).toEqual(['Paid', 'Paid']);
  await expect(info).toHaveText('4 row(s)');

  await filter.fill('zzz');
  expect(await rows(page, 'filtered')).toEqual([]);

  await filter.fill('');
  expect(await rows(page, 'filtered')).toEqual(['Paid', 'Pending']);
  await expect(info).toHaveText('5 row(s)');
});

test('emits mo-table-change with {sort, page, selected}', async ({ page }) => {
  await page.goto(URL);

  const events = await page.evaluate(async () => {
    const captured = (window as any).events_basic as any[];
    const name = document.querySelector('[data-test=sort-name]') as HTMLButtonElement;
    name.click(); // asc
    name.click(); // desc
    return captured.map((d) => ({
      dir: d.sort?.dir ?? null,
      page: d.page,
      selected: d.selected.length,
    }));
  });

  expect(events[0]).toEqual({ dir: 'asc', page: 1, selected: 0 });
  expect(events.at(-1)).toEqual({ dir: 'desc', page: 1, selected: 0 });

  // Pagination events carry the new page number.
  const pagedEvents = await page.evaluate(() => {
    const captured = (window as any).events_paged as any[];
    (document.querySelector('#paged [data-test=next]') as HTMLButtonElement).click();
    return captured.map((d) => d.page);
  });
  expect(pagedEvents).toEqual([2]);
});
