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
      expect(labelBox.y - (iconBox.y + iconBox.height)).toBeGreaterThanOrEqual(7);
    }
  }
});
