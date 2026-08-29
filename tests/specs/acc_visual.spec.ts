import { test, expect } from '@playwright/test';

test('accordion visual + behavior', async ({ page }) => {
  await page.goto('/tests/fixtures/acc_visual.html');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/acc-visual.png', fullPage: true });
  console.log('screenshot saved');

  // Single collapsible: opening second closes first
  {
    const sec = page.locator('mo-accordion').first();
    const first = sec.locator('details').nth(0);
    const second = sec.locator('details').nth(1);
    await expect(first).toHaveAttribute('open', '');
    await second.locator('summary').click();
    await expect(first).not.toHaveAttribute('open');
    await expect(second).toHaveAttribute('open');
    // collapsible allows closing
    await second.locator('summary').click();
    await expect(second).not.toHaveAttribute('open');
  }

  // Single non-collapsible: cannot close sole open
  {
    const sec = page.locator('#single-nc');
    const first = sec.locator('details').nth(0);
    await first.locator('summary').click();
    // should stay open
    await expect(first).toHaveAttribute('open');
    const second = sec.locator('details').nth(1);
    await second.locator('summary').click();
    await expect(first).not.toHaveAttribute('open');
    await expect(second).toHaveAttribute('open');
  }

  // Multiple: independent
  {
    const sec = page.locator('#multiple');
    const first = sec.locator('details').nth(0);
    const second = sec.locator('details').nth(1);
    await expect(first).toHaveAttribute('open');
    await second.locator('summary').click();
    await expect(first).toHaveAttribute('open');
    await expect(second).toHaveAttribute('open');
  }

  // Disabled: opacity and blocked
  {
    const dis = page.locator('#disabled details[disabled]');
    const op = await dis.evaluate(el => getComputedStyle(el).opacity);
    expect(op).toBe('0.5');
    await dis.locator('summary').click({ force: true });
    await expect(dis).not.toHaveAttribute('open');
    const afterDisplay = await page.evaluate(() => {
      const s = document.querySelector('#disabled details[disabled] summary')!;
      return getComputedStyle(s, '::after').display;
    });
    expect(afterDisplay).toBe('none');
  }

  // Chevron rotates
  {
    await page.goto('/tests/fixtures/acc_visual.html');
    await page.waitForTimeout(200);
    const tClosed = await page.$eval('#bare2 summary', s => getComputedStyle(s, '::after').transform);
    expect(tClosed).toBe('none');
    await page.locator('#bare2 summary').click();
    const tOpen = await page.$eval('#bare2 summary', s => getComputedStyle(s, '::after').transform);
    expect(tOpen).toContain('matrix');
  }

  // Arrow nav skips disabled
  {
    await page.goto('/tests/fixtures/acc_visual.html');
    await page.waitForTimeout(200);
    const summaries = page.locator('#disabled summary');
    await summaries.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    await expect(summaries.nth(2)).toBeFocused(); // skips disabled (index1)
    await page.keyboard.press('ArrowUp');
    await expect(summaries.nth(0)).toBeFocused();
    await page.keyboard.press('End');
    await expect(summaries.nth(2)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(summaries.nth(0)).toBeFocused();
  }

  // Global border leak: bare details should have same styling as accordion details?
  // We check both have border-bottom unless last-child
  {
    const bareBorder = await page.evaluate(() => {
      const el = document.querySelector('#bare1') as HTMLElement;
      return getComputedStyle(el).borderBottomWidth;
    });
    const accBorder = await page.evaluate(() => {
      const el = document.querySelector('mo-accordion details') as HTMLElement;
      return getComputedStyle(el).borderBottomWidth;
    });
    console.log('bareBorder', bareBorder, 'accBorder', accBorder);
    // They currently both have border because global details selector. We will note.
  }

  // Check interpolate-size present
  {
    const val = await page.evaluate(() => {
      const el = document.querySelector('details') as HTMLElement;
      return (getComputedStyle(el) as any).interpolateSize || getComputedStyle(el).getPropertyValue('interpolate-size');
    });
    console.log('interpolate-size', val);
  }

  // Check link styling duplication – does shared.css handle accordion links? currently not
  {
    const linkColor = await page.evaluate(() => {
      const p = document.createElement('p');
      p.innerHTML = '<a href="#">test</a>';
      const sec = document.querySelector('#single-nc details')!;
      sec.appendChild(p);
      const a = p.querySelector('a')!;
      const cs = getComputedStyle(a).textDecorationLine;
      p.remove();
      return cs;
    });
    console.log('accordion link decoration', linkColor);
  }
});
