import { expect, test } from '@playwright/test';

const mapped = [
  ['I01', 'triple', '01.png'],
  ['I02', 'core', '02.png'],
  ['I03', 'touch', '03.png'],
  ['I04', 'water', '04.png'],
  ['I05', 'light', '05.png'],
  ['I07', 'armor', '07.png'],
  ['I08', 'flow', '08.png'],
] as const;

test('technology kit icons decode, map one-to-one and clear their labels', async ({ page }) => {
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`);
    const canvasBox = await page.locator('.canvas').boundingBox();
    if (!canvasBox) throw new Error('Missing story canvas');
    await expect(page.locator('img.designer-icon-technology')).toHaveCount(7);
    await expect(page.locator('#icon-i06')).toHaveCount(0);
    await expect(page.locator('img.technology-source-art')).toHaveCount(0);
    await expect(page.locator('img.technology-connector-art')).toHaveCount(7);
    for (const [id, key, asset] of mapped) {
      const icon = page.locator(`#icon-${id.toLowerCase()}`);
      const label = page.locator(`.overlay.key-${key}`);
      await expect(icon).toHaveAttribute('src', `/art/icon-kit/${asset}`);
      await expect(icon).toHaveAttribute('alt', '');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(label).not.toBeEmpty();
      expect(await icon.evaluate(async element => {
        const image = element as HTMLImageElement;
        await image.decode();
        return image.naturalWidth > 0;
      })).toBe(true);
      const iconBox = await icon.boundingBox();
      const labelBox = await label.boundingBox();
      if (!iconBox || !labelBox) throw new Error(`Missing technology geometry: ${id}`);
      const gap = (labelBox.y - (iconBox.y + iconBox.height)) * 402 / canvasBox.width;
      expect(gap).toBeGreaterThanOrEqual(4);
      expect(gap).toBeLessThanOrEqual(11);
    }
  }
});

test('technology icons stay centered on translated labels without changing vertical gaps', async ({ page }) => {
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const canvasBox = await page.locator('.canvas').boundingBox();
    if (!canvasBox) throw new Error('Missing story canvas');
    for (const [id, key] of mapped) {
      const iconBox = await page.locator(`#icon-${id.toLowerCase()}`).boundingBox();
      const labelBox = await page.locator(`.overlay.key-${key}`).boundingBox();
      if (!iconBox || !labelBox) throw new Error(`Missing technology geometry: ${locale}/${id}`);
      const sourceScale = 402 / canvasBox.width;
      const centerError = Math.abs(iconBox.x + iconBox.width / 2 - labelBox.x - labelBox.width / 2) * sourceScale;
      const verticalGap = (labelBox.y - iconBox.y - iconBox.height) * sourceScale;
      expect(centerError, `${locale}/${id} center`).toBeLessThanOrEqual(locale === 'en' && id !== 'I05' ? 2.2 : 0.5);
      expect(verticalGap, `${locale}/${id} vertical gap`).toBeGreaterThanOrEqual(4);
      expect(verticalGap, `${locale}/${id} vertical gap`).toBeLessThanOrEqual(11);
    }
  }
});
