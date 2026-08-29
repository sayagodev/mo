import {test} from '@playwright/test';
test('debug', async ({page})=>{
  await page.goto('file:///tmp/test-nested-grip.html');
  await page.waitForTimeout(300);
  const grip0 = page.locator('[data-resizable-grip]').first();
  const styles = await grip0.evaluate(el=>{
    const s=getComputedStyle(el);
    return {inlineSize:s.inlineSize, width:s.width, fontSize:getComputedStyle(document.documentElement).fontSize, gripInline:s.getPropertyValue('inline-size'), gripWidth:s.getPropertyValue('width')};
  });
  console.log(styles);
  const handle0 = page.locator('[data-resizable-handle]').first();
  const hs = await handle0.evaluate(el=>{const s=getComputedStyle(el); return {inlineSize:s.inlineSize, width:s.width, display:s.display}} );
  console.log('handle',hs);
});
