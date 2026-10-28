import { expect, test, type Page } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(120000);

async function start(page: Page, locale: 'en' | 'ar') {
  await page.goto(`/${locale}`);
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
}

async function end(page: Page) {
  await page.locator('video').evaluate(v => { const video = v as HTMLVideoElement; video.currentTime = video.duration - .3; });
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
  await expect(page.locator('.film-ended')).toBeVisible();
}

async function exerciseEndedMenu(page: Page, locale: 'en' | 'ar') {
  const dialog = page.locator('#product-film'), gear = page.locator('#film-settings-toggle');
  const menu = page.locator('#film-options-menu'), card = page.locator('.film-ended');
  await gear.click();
  await expect(menu).toBeVisible();
  await expect(card).toBeHidden();
  await expect(menu).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
  await page.locator('.film-menu-quality').click();
  const quality = page.locator('#film-quality-options');
  await expect(quality).toBeVisible();
  await quality.locator('media-chrome-menu-item[value="720"]').click();
  await expect(menu).toBeHidden();
  await expect(card).toBeVisible();
  await expect(page.locator('video')).toHaveAttribute('data-quality-mode', '720');
  await gear.click();
  await page.locator('.film-menu-quality').click();
  await quality.locator('media-chrome-menu-item[value="360"]').click();
  await expect(menu).toBeHidden();
  await expect(card).toBeVisible();
  await expect(page.locator('video')).toHaveAttribute('data-quality-mode', '360');
  await gear.click();
  await page.locator('.film-menu-speed').click();
  const speed = page.locator('#film-speed-options');
  await expect(speed).toBeVisible();
  await speed.locator('media-chrome-menu-item[value="1.5"]').click();
  await expect(menu).toBeHidden();
  await expect(card).toBeVisible();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.5);
  await gear.click();
  await page.locator('.film-menu-quality').click();
  await quality.locator('.film-menu-back').click();
  await expect(menu).toBeVisible();
  await expect(quality).toBeHidden();
  await gear.click();
  await expect(menu).toBeHidden();
  await expect(card).toBeVisible();
  await expect(dialog).toHaveAttribute('data-view', 'ended');
}

test('ended card yields to settings and returns after quality, speed and Back', async ({ page }) => {
  await start(page, 'en');
  await end(page);
  await exerciseEndedMenu(page, 'en');
  await page.locator('video').evaluate(v => { (v as HTMLVideoElement).currentTime = 20; });
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'playing');
  await expect.poll(() => page.locator('video').evaluate(v => !(v as HTMLVideoElement).seeking), { timeout: 30000 }).toBe(true);
  await page.locator('.film-play-toggle').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(20.2);
  await page.locator('.film-player__top button').last().click();
  await expect(page.locator('#product-film')).not.toBeVisible();
  await page.locator('#film-play').click();
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'gallery');
  await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.locator('.film-player__top button').last().click();
});

test('a user seek supersedes source restoration when seeked is suppressed', async ({ page }, info) => {
  test.skip(!info.project.name.includes('webkit'), 'Native HLS source switches are owned by WebKit');
  await start(page, 'en');
  await end(page);
  await page.evaluate(() => {
    document.addEventListener('seeked', event => event.stopImmediatePropagation(), { capture: true });
  });
  await page.locator('#film-settings-toggle').click();
  await page.locator('.film-menu-quality').click();
  await page.locator('#film-quality-options media-chrome-menu-item[value="720"]').click();
  await expect(page.locator('video')).toHaveAttribute('data-film-source-switch', 'true');
  await page.locator('#film-player').evaluate(host => host.dispatchEvent(new CustomEvent('mediaseekrequest', { bubbles: true, composed: true, detail: 20 })));
  await expect(page.locator('video')).not.toHaveAttribute('data-film-source-switch');
  await expect.poll(() => page.locator('video').evaluate(v => Math.abs((v as HTMLVideoElement).currentTime - 20)), { timeout: 30000 }).toBeLessThan(1);
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'playing');
  await page.locator('.film-play-toggle').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(20.2);
  await page.locator('.film-player__top button').last().click();
});

test('a direct seek after native restoration supersedes a suppressed seeked event', async ({ page }, info) => {
  test.skip(!info.project.name.includes('webkit'), 'Native HLS source switches are owned by WebKit');
  await start(page, 'en');
  await end(page);
  await page.evaluate(() => {
    document.addEventListener('seeked', event => event.stopImmediatePropagation(), { capture: true });
  });
  const video = page.locator('video');
  await page.locator('#film-settings-toggle').click();
  await page.locator('.film-menu-quality').click();
  await page.locator('#film-quality-options media-chrome-menu-item[value="720"]').click();
  await expect(video).toHaveAttribute('data-film-source-switch', 'true');
  await expect(video).toHaveAttribute('data-film-source-switch-target', /.+/, { timeout: 30000 });
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).seeking), { timeout: 30000 }).toBe(true);
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'ended');
  await video.evaluate(v => { (v as HTMLVideoElement).currentTime = 20; });
  await expect(video).not.toHaveAttribute('data-film-source-switch');
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'playing');
  await expect.poll(() => video.evaluate(v => Math.abs((v as HTMLVideoElement).currentTime - 20)), { timeout: 30000 }).toBeLessThan(1);
  await page.locator('.film-play-toggle').click();
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(20.2);
  await page.locator('.film-player__top button').last().click();
});

test('short landscape keeps playing and ended settings usable in LTR and RTL', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One WebKit owner for the short landscape matrix');
  await page.setViewportSize({ width: 568, height: 320 });
  for (const locale of ['en', 'ar'] as const) {
    await start(page, locale);
    const dialog = page.locator('#product-film');
    await expect(dialog).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(dialog).toHaveAttribute('data-view', 'playing');
    await expect(page.locator('#film-settings-toggle')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.film-fullscreen').click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id === 'film-player' || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
    await end(page);
    await exerciseEndedMenu(page, locale);
    await page.locator('.film-player__top button').last().click();
    await expect(dialog).not.toBeVisible();
  }
});

test('320px portrait and short landscape keep transport targets inside the player', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One WebKit owner for the narrow viewport matrix');
  for (const viewport of [{ width: 320, height: 568 }, { width: 320, height: 240 }]) {
    await page.setViewportSize(viewport);
    await start(page, 'en');
    const player = page.locator('#film-player');
    const targets = player.locator('.film-previous, .film-play-toggle, .film-next, .film-mute-toggle, #film-settings-toggle, .film-fullscreen');
    await expect(targets).toHaveCount(6);
    const playerBox = (await player.boundingBox())!;
    expect(playerBox.x).toBeGreaterThanOrEqual(-1);
    expect(playerBox.x + playerBox.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(playerBox.y).toBeGreaterThanOrEqual(-1);
    expect(playerBox.y + playerBox.height).toBeLessThanOrEqual(viewport.height + 1);
    for (const target of await targets.all()) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(Math.max(0, playerBox.x) - 1);
      expect(box.y).toBeGreaterThanOrEqual(Math.max(0, playerBox.y) - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(Math.min(viewport.width, playerBox.x + playerBox.width) + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(Math.min(viewport.height, playerBox.y + playerBox.height) + 1);
    }
    await page.locator('#film-settings-toggle').click();
    await expect(page.locator('#film-options-menu')).toBeVisible();
    await page.locator('.film-menu-quality').click();
    const quality = page.locator('#film-quality-options');
    await expect(quality).toBeVisible();
    await quality.locator('.film-menu-back').click();
    await expect(quality).toBeHidden();
    await page.locator('.film-menu-quality').click();
    await quality.locator('media-chrome-menu-item[value="720"]').click();
    await expect(page.locator('video')).toHaveAttribute('data-quality-mode', '720');
    await expect(page.locator('#film-options-menu')).toBeHidden();
    await page.locator('#film-settings-toggle').click();
    await page.locator('#film-settings-toggle').click();
    await expect(page.locator('#film-options-menu')).toBeHidden();
    const close = page.locator('.film-player__top button').last();
    await expect(close).toBeInViewport();
    await close.click();
    await expect(page.locator('#product-film')).not.toBeVisible();
  }
});
