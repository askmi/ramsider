import { expect, test } from '@playwright/test';
import { galleryCopy } from '../../lib/film-gallery-copy';
import { locales } from '../../lib/i18n';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(180000);

test('all seven films really end and replay from the beginning', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'desktop-chromium'].includes(info.project.name), 'One WebKit and one Chromium owner');
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video'), host = page.locator('#film-player');
  await expect(host).toHaveAttribute('data-controls', 'ready');
  const titles = ['Ramsider Uno (Product Introduction)', 'Pure Gold', 'Evolution', 'Our Style', 'DIY Madness', 'Copycats', 'Inside Ramsider'];
  for (let index = 0; index < titles.length; index++) {
    if (index) {
      await host.evaluate(el => el.removeAttribute('userinactive'));
      await page.locator('.film-player__list-toggle').click();
      const item = page.locator('.film-playlist__item').nth(index);
      await item.click(); await item.click();
    }
    await expect(page.locator('.film-player__identity')).toHaveText(titles[index]);
    await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused && Number.isFinite((v as HTMLVideoElement).duration) && (v as HTMLVideoElement).currentTime > .1), { timeout: 30000 }).toBe(true);
    await video.evaluate(v => { const m = v as HTMLVideoElement; m.currentTime = m.duration; });
    await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
    const replay = page.locator('.film-ended__replay');
    await expect(replay).toBeVisible();
    await expect(page.locator('.film-ended button')).toHaveCount(1);
    await replay.click();
    await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'playing');
    await expect.poll(() => video.evaluate(v => { const m = v as HTMLVideoElement; return !m.paused && m.currentTime < 10; }), { timeout: 30000 }).toBe(true);
    console.log(`replay PASS: ${titles[index]}`);
  }
});

test('List label and playlist are usable in all eleven locales', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One mobile WebKit owner for the locale matrix');
  page.setDefaultTimeout(10000);
  for (const locale of locales) {
    await page.goto(`/${locale}`);
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click();
    await page.locator('.film-gallery__hero').click();
    const host = page.locator('#film-player'), toggle = page.locator('.film-player__list-toggle');
    await expect(host).toHaveAttribute('data-controls', 'ready');
    await expect(toggle).toHaveText(galleryCopy[locale].list);
    await expect(page.locator('#product-film')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await host.evaluate(el => el.removeAttribute('userinactive'));
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const list = page.locator('#film-playlist');
    await expect(list).toBeVisible();
    await expect(list).toHaveAttribute('aria-label', galleryCopy[locale].list);
    await expect(list.locator('.film-playlist__item')).toHaveCount(7);
    await expect(list.locator('.film-playlist__item[aria-current=true]')).toHaveCount(1);
    await page.locator('.film-playlist__close').click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await page.locator('.film-player__close').click();
    console.log(`locale PASS: ${locale}`);
  }
});
