import { expect, test } from '@playwright/test';

const featureIds = ['I09', 'I10', 'I11', 'I12'];
const featureKeys = ['control', 'draw', 'intensity', 'consistent'];

test('designer feature icons render once above their localized labels', async ({ page }) => {
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`);
    const icons = page.locator('img.designer-icon-feature');
    await expect(icons).toHaveCount(4);
    for (let index = 0; index < featureIds.length; index++) {
      const icon = page.locator(`#icon-${featureIds[index].toLowerCase()}`);
      const label = page.locator(`.overlay.key-${featureKeys[index]}`);
      await expect(icon).toHaveAttribute('src', `/art/icon-kit/${String(index + 9).padStart(2, '0')}.png`);
      await expect(icon).toHaveAttribute('alt', '');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(label).not.toBeEmpty();
      const decoded = await icon.evaluate(async element => {
        const image = element as HTMLImageElement;
        await image.decode();
        return image.naturalWidth > 0;
      });
      expect(decoded).toBe(true);
      const iconBox = await icon.boundingBox();
      const labelBox = await label.boundingBox();
      if (!iconBox || !labelBox) throw new Error(`Missing feature geometry: ${featureIds[index]}`);
      expect(labelBox.y - (iconBox.y + iconBox.height)).toBeGreaterThanOrEqual(7);
    }
    await expect(page.locator('img.feature-source-art')).toHaveCount(0);
    await expect(page.locator('img.feature-divider-art')).toHaveCount(3);
  }
});
