import { expect, test } from '@playwright/test';

test('source feature pictograms load without substituting text glyphs', async ({ page }) => {
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`);
    const icons = page.locator('img.feature-source-art');
    await expect(icons).toHaveCount(4);
    const state = await icons.evaluateAll(async images => {
      await Promise.all(images.map(image => (image as HTMLImageElement).decode()));
      return images.map(image => ({
        loaded: (image as HTMLImageElement).naturalWidth > 0,
        decorative: image.getAttribute('alt') === '' && image.getAttribute('aria-hidden') === 'true',
      }));
    });
    expect(state).toEqual(Array(4).fill({ loaded: true, decorative: true }));
    for (const key of ['control', 'draw', 'intensity', 'consistent']) {
      const label = page.locator(`.overlay.key-${key}`);
      await expect(label).not.toBeEmpty();
      expect(await label.evaluate(element => getComputedStyle(element, '::before').content)).not.toMatch(/[☷≋▥○]/);
    }
  }
});
