import { expect, test } from '@playwright/test';

const names = ['triple', 'core', 'touch', 'water', 'light', 'armor', 'flow'];

test('all seven technology annotations use decoded source artwork', async ({ page }) => {
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`);
    const art = page.locator('img.technology-source-art');
    await expect(art).toHaveCount(7);
    const images = await art.evaluateAll(async elements => {
      await Promise.all(elements.map(element => (element as HTMLImageElement).decode()));
      return elements.map(element => ({
        src: (element as HTMLImageElement).currentSrc,
        loaded: (element as HTMLImageElement).naturalWidth > 0,
        decorative: element.getAttribute('alt') === '' && element.getAttribute('aria-hidden') === 'true',
      }));
    });
    expect(images.map(image => image.src.split('/').at(-1))).toEqual(names.map(name => `technology-${name}.png`));
    expect(images.every(image => image.loaded && image.decorative)).toBe(true);
    for (const name of names) {
      const label = page.locator(`.overlay.key-${name}`);
      await expect(label).not.toBeEmpty();
      expect(await label.textContent()).toContain(' ');
      expect(await label.evaluate(element => getComputedStyle(element, '::before').content)).not.toMatch(/[♨▣◇♧✧⬡≈]/);
      expect(await label.evaluate(element => getComputedStyle(element, '::after').content)).toBe('none');
    }
  }
});
