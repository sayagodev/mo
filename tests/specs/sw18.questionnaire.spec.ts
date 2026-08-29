import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { axe } from './axe';

// Questionnaire wizard: step visibility, native validation gate, progress,
// back navigation and the completion event. Fixture mirrors docs examples.

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/fixtures/questionnaire.html');
});

test('shows only the active step', async ({ page }) => {
  await expect(page.locator('#q-step1')).toBeVisible();
  await expect(page.locator('#q-step2')).toBeHidden();
});

test('empty required field does not advance (native validation)', async ({ page }) => {
  await page.click('#q-step1 button[type="submit"]');
  await expect(page.locator('#q-step1')).toBeVisible();
  await expect(page.locator('#q-step2')).toBeHidden();
  // The browser flagged the field: focus moved to it, aria-invalid state set.
  await expect(page.locator('#q-name')).toBeFocused();
});

test('valid step advances to the next one', async ({ page }) => {
  await page.fill('#q-name', 'Ada Lovelace');
  await page.fill('#q-email', 'ada@example.com');
  await page.click('#q-step1 button[type="submit"]');

  await expect(page.locator('#q-step1')).toBeHidden();
  await expect(page.locator('#q-step2')).toBeVisible();

  // Progress slot reflects the new position.
  const count = page.locator('#q [data-questionnaire-count]');
  await expect(count).toHaveText('Step 2 of 2');
  expect(await page.$eval('#q [data-questionnaire-progress] progress', (b) => b.value)).toBe(2);
});

test('Back returns to the previous step with values kept', async ({ page }) => {
  await page.fill('#q-name', 'Ada Lovelace');
  await page.fill('#q-email', 'ada@example.com');
  await page.click('#q-step1 button[type="submit"]');
  await page.click('#q-step2 [data-questionnaire-back]');

  await expect(page.locator('#q-step1')).toBeVisible();
  await expect(page.locator('#q-step2')).toBeHidden();
  await expect(page.locator('#q-name')).toHaveValue('Ada Lovelace');
  await expect(page.locator('#q [data-questionnaire-count]')).toHaveText('Step 1 of 2');
});

test('completion emits mo-questionnaire-complete with all steps merged', async ({ page }) => {
  await page.evaluate(() => {
    window.__completed = [];
    document.getElementById('q').addEventListener('mo-questionnaire-complete', (e) => {
      window.__completed.push(Object.fromEntries(e.detail.values));
    });
  });

  await page.fill('#q-name', 'Ada Lovelace');
  await page.fill('#q-email', 'ada@example.com');
  await page.click('#q-step1 button[type="submit"]');
  await page.click('#q-step2 input[value="team"]');
  await page.click('#q-step2 button[type="submit"]');

  const completed = await page.evaluate(() => window.__completed);
  expect(completed).toHaveLength(1);
  expect(completed[0]).toEqual({
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    visibility: 'team',
  });
});

test('data-reset clears fields and returns to step 1', async ({ page }) => {
  await page.evaluate(() => document.getElementById('q').setAttribute('data-reset', ''));

  await page.fill('#q-name', 'Ada Lovelace');
  await page.fill('#q-email', 'ada@example.com');
  await page.click('#q-step1 button[type="submit"]');
  await page.click('#q-step2 button[type="submit"]');

  await expect(page.locator('#q-step1')).toBeVisible();
  await expect(page.locator('#q-name')).toHaveValue('');
  await expect(page.locator('#q [data-questionnaire-count]')).toHaveText('Step 1 of 2');
});

test('data-start opens on the given step', async ({ page }) => {
  await expect(page.locator('#l-step1')).toBeHidden();
  await expect(page.locator('#l-step2')).toBeVisible();
  await expect(page.locator('#q-late [data-questionnaire-count]')).toHaveText('Step 2 of 2');
});

test('card variant renders inside .card', async ({ page }) => {
  const card = page.locator('#card-variant.card');
  await expect(card).toBeVisible();
  const q = card.locator('mo-questionnaire');
  await expect(q).toBeVisible();
  await expect(q.locator('[data-questionnaire-step]').first()).toBeVisible();
  await expect(q.locator('[data-questionnaire-count]')).toHaveText('Step 1 of 2');
});

test('questionnaire fixture passes axe', async ({ page }) => {
  await page.goto('/tests/fixtures/questionnaire.html');
  // A <footer> directly under a bare <form> becomes a contentinfo landmark;
  // stacking three wizards on one shell page trips landmark uniqueness,
  // which is a fixture concern, not a component one.
  const results = await new AxeBuilder({ page })
    .disableRules(['region', 'landmark-one-main', 'page-has-heading-one',
      'landmark-no-duplicate-contentinfo', 'landmark-unique'])
    .analyze();
  expect(results.violations.map((v) => `${v.id}:${v.nodes.length}`)).toEqual([]);
});
