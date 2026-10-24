import { waitForVisibleMedia } from './helpers/media';
import { expect, test } from '@playwright/test';

const localeCodes = ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko'] as const;

test('expression waves frame centered localized copy and keep comparison usable', async ({ page }) => {
  test.setTimeout(90_000);
  for (const locale of localeCodes) {
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    await waitForVisibleMedia(page);
    const wave = page.locator('.expression-waves-art');
    await wave.scrollIntoViewIfNeeded();
    await expect(wave).toHaveAttribute('data-original', '/art/expression-waves.webp');
    await expect(wave).toHaveAttribute('data-media-ready', '', { timeout: 15000 });
    await expect(wave).toHaveAttribute('aria-hidden', 'true');
    expect(await wave.evaluate(async element => {
      const image = element as HTMLImageElement;
      await image.decode();
      return image.naturalWidth === 701 && image.naturalHeight === 401;
    })).toBe(true);
    const { canvasBox, waveBox } = await page.evaluate(() => ({ canvasBox: document.querySelector('.canvas')!.getBoundingClientRect().toJSON(), waveBox: document.querySelector('.expression-waves-art')!.getBoundingClientRect().toJSON() }));
    expect(Math.abs((waveBox.x - canvasBox.x) / canvasBox.width * 941 - 120)).toBeLessThan(0.1);
    expect(Math.abs((waveBox.y - canvasBox.y) / canvasBox.width * 941 - 14665)).toBeLessThan(0.1);

    for (const selector of ['#expressions', '.overlay.key-choose', '#expressions-compare']) {
      const element = page.locator(selector);
      const box = await element.boundingBox();
      if (!box) throw new Error(`Missing expression element: ${locale}/${selector}`);
      const centerError = Math.abs(box.x + box.width / 2 - canvasBox.x - canvasBox.width / 2) / canvasBox.width * 941;
      // The reference pill is intentionally 5 source px left of the text axis.
      expect(centerError, `${locale}/${selector} center`).toBeLessThan(selector === '#expressions-compare' ? 5.6 : 0.6);
      expect(box.x, `${locale}/${selector} left`).toBeGreaterThanOrEqual(canvasBox.x);
      expect(box.x + box.width, `${locale}/${selector} right`).toBeLessThanOrEqual(canvasBox.x + canvasBox.width + 0.5);
      expect(await element.evaluate(node => node.scrollWidth <= node.clientWidth + 1), `${locale}/${selector} overflow`).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${locale} page overflow`).toBe(true);
  }

  await page.goto('/ar');
  await page.locator('#expressions-compare').scrollIntoViewIfNeeded();
  await waitForVisibleMedia(page);
  await page.locator('#expressions-compare').click();
  await expect(page).toHaveURL(/\/ar\/compare$/);
  await expect(page.locator('.up-comparison')).toHaveCount(2);
  await expect(page.locator('.up-beta')).toHaveAttribute('dir', 'rtl');
});
