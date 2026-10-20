import { expect, test } from '@playwright/test';
import {certificates} from '../../lib/certificates';

for (const locale of ['ru', 'ar']) {
  test(`document cards open native PDF files independently in ${locale}`, async ({ page,context }) => {
    await page.goto(`/${locale}`);
    await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));
    await page.evaluate(() => document.fonts.ready);
    await context.route('**/certificates/*.pdf',route=>route.abort());
    for (const [id,source] of Object.entries(certificates)) {
      const link = page.locator(id==='all'?'#documents-all':`#document-${id}`);
      await link.scrollIntoViewIfNeeded();
      await expect(page.locator('.page-media-overlay')).toHaveCount(0);
      const navigation=context.waitForEvent('request',r=>r.url().endsWith(source.href));
      if(id==='all'){await link.focus();await page.keyboard.press('Enter');}else await link.click();
      expect((await navigation).isNavigationRequest()).toBe(true);
      await expect(page.locator('dialog[open]')).toHaveCount(0);
      for(const popup of context.pages())if(popup!==page)await popup.close();
    }
  });
}
