import { expect, test } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(180000);

test('All Films restores visible focus on the last selected thumbnail', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'iphone-17-pro-max-webkit'].includes(info.project.name), 'Two mobile WebKit profile owners');
  const max = info.project.name === 'iphone-17-pro-max-webkit';
  const portrait = max ? { width: 440, height: 956 } : { width: 402, height: 874 };
  const landscape = max ? { width: 956, height: 440 } : { width: 874, height: 402 };
  for (const viewport of [portrait, landscape]) {
    await page.setViewportSize(viewport);
    for (const locale of ['en', 'ar']) {
      await page.goto(`/${locale}`);
      await page.locator('#film-play').scrollIntoViewIfNeeded();
      await page.locator('#film-play').click();
      const dialog = page.locator('#product-film');
      await expect(dialog).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await page.locator('.film-gallery__hero').click();
      await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
      const video = page.locator('video');
      for (const id of ['pure-gold', 'evolution', 'our-style', 'diy-madness', 'copycats', 'inside-ramsider']) {
        await page.locator('.film-next').click();
        await expect(video).toHaveAttribute('data-src', new RegExp(id));
      }
      const scrollY = await page.evaluate(() => window.scrollY);
      await page.locator('.film-player__top button').first().focus();
      await page.keyboard.press('Enter');
      await expect(dialog).toHaveAttribute('data-view', 'gallery');
      const selected = dialog.locator('.film-gallery__item[aria-pressed=true]');
      await expect(selected).toBeFocused();
      await expect(selected).toHaveAttribute('aria-label', /Inside Ramsider/);
      const bounds = await selected.evaluate(element => {
        const strip = element.closest('.film-gallery__list')!.getBoundingClientRect();
        const item = element.getBoundingClientRect();
        return { strip: { left: strip.left, right: strip.right, top: strip.top, bottom: strip.bottom }, item: { left: item.left, right: item.right, top: item.top, bottom: item.bottom }, scrollY: window.scrollY };
      });
      expect(bounds.item.left).toBeGreaterThanOrEqual(bounds.strip.left - 1);
      expect(bounds.item.right).toBeLessThanOrEqual(bounds.strip.right + 1);
      expect(bounds.item.top).toBeGreaterThanOrEqual(bounds.strip.top - 1);
      expect(bounds.item.bottom).toBeLessThanOrEqual(bounds.strip.bottom + 1);
      expect(Math.abs(bounds.scrollY - scrollY)).toBeLessThan(2);
      await page.screenshot({ path: `screenshots/video/gallery/focus-${info.project.name}-${viewport.width}-${locale}.png` });
      await dialog.locator('.product-film__close').click();
    }
  }
});
