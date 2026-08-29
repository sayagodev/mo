import { test, expect } from '@playwright/test';
import { axe } from './axe';

// WAI-ARIA APG Dialog pattern — what Radix Dialog guarantees for shadcn.
test('commandfor opens the modal', async ({ page }) => {
  await page.goto('/tests/fixtures/dialog.html');
  await page.click('#open-dlg');
  await expect(page.locator('#dlg')).toHaveJSProperty('open', true);
});

test('Escape closes the dialog', async ({ page }) => {
  await page.goto('/tests/fixtures/dialog.html');
  await page.click('#open-dlg');
  await page.keyboard.press('Escape');
  await expect(page.locator('#dlg')).toHaveJSProperty('open', false);
});

test('submitting the form closes with a return value', async ({ page }) => {
  await page.goto('/tests/fixtures/dialog.html');
  await page.click('#open-dlg');
  await page.click('#cancel-btn');
  await expect(page.locator('#dlg')).toHaveJSProperty('open', false);
});

test('dialog fixture passes axe when open', async ({ page }) => {
  await page.goto('/tests/fixtures/dialog.html');
  await page.click('#open-dlg');
  expect(await axe(page)).toEqual([]);
});
