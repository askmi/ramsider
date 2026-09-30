import { expect, test } from '@playwright/test';

for (const locale of ['ru', 'ar']) {
  test(`document cards open independently in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const ids = ['electrical', 'emc', 'uae', 'rohs', 'telecom'];
    for (const id of ids) {
      const button = page.locator(`#document-${id}`);
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible();
      await button.click();
      await expect(page.locator(`#doc-detail-${id}:modal`)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator(`#doc-detail-${id}:modal`)).toHaveCount(0);
    }
    const all = page.locator('#documents-all');
    await all.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#unavailable-docs:modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#unavailable-docs:modal')).toHaveCount(0);
  });
}
