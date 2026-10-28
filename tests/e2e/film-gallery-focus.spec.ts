import { expect, test } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(180000);

test('List exposes the current film and restores focus on close', async ({ page }, info) => {
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
      const list = page.locator('.film-player__list-toggle');
      await list.focus();
      await page.keyboard.press('Enter');
      await expect(dialog).toHaveAttribute('data-view', 'playing');
      await expect(page.locator('#film-playlist')).toBeVisible();
      await expect(page.locator('.film-playlist__item[aria-current=true]')).toBeFocused();
      const current = page.locator('.film-playlist__item[aria-current=true]');
      await expect(current).toContainText('Inside Ramsider');
      expect(Math.abs(await page.evaluate(() => window.scrollY) - scrollY)).toBeLessThan(2);
      await page.screenshot({ path: `screenshots/video/gallery/focus-${info.project.name}-${viewport.width}-${locale}.png` });
      await page.keyboard.press('Escape');
      await expect(list).toBeFocused();
      await dialog.locator('.film-player__close').click();
    }
  }
});
