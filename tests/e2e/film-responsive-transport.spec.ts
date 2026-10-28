import { emulateCustomFullscreenLayout } from './fullscreen-layout-adapter';
test.beforeEach(async ({ page }, info) => { if (info.project.name.includes('iphone')) await emulateCustomFullscreenLayout(page); });
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.setTimeout(120000);

for (const locale of ['en', 'ar'] as const) {
  test(`${locale}: transport follows player width in portrait and landscape fullscreen`, async ({ page }, info) => {
    test.skip(!['iphone-17-pro-webkit', 'iphone-17-pro-max-webkit'].includes(info.project.name), 'Mobile WebKit profiles');
    await silenceTestMedia(page);
    const max = info.project.name.includes('max');
    const portrait = max ? { width: 440, height: 956 } : { width: 402, height: 874 };
    const landscape = { width: portrait.height, height: portrait.width };
    await page.goto(`/${locale}`);
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500); // Let the lazily hydrated gallery attach its click handler.
    await page.locator('#film-play').click();
    await page.locator('.film-gallery__hero').click();
    const player = page.locator('#film-player');
    await expect(player).toHaveAttribute('data-controls', 'ready');
    await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
    await page.locator('video').evaluate(v => (v as HTMLVideoElement).pause());
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.film-fullscreen').click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id === 'film-player' || document.querySelector('#film-player')?.getAttribute('data-element-fullscreen') === 'true')).toBe(true);
    await mkdir('screenshots/video/responsive-transport', { recursive: true });
    for (const [mode, viewport] of [['portrait', portrait], ['landscape', landscape]] as const) {
      await page.setViewportSize(viewport);
      await expect.poll(() => page.evaluate(() => [innerWidth, devicePixelRatio])).toEqual([viewport.width, 3]);
      await expect.poll(() => player.evaluate(el => Math.round(el.getBoundingClientRect().height))).toBe(viewport.height);
      await expect(page.locator('video')).toHaveCSS('object-fit', 'cover');
      const seek = await page.locator('.film-seek').boundingBox();
      const time = await page.locator('.film-time').boundingBox();
      expect(seek).not.toBeNull(); expect(time).not.toBeNull();
      if (mode === 'portrait') {
        expect(time!.y).toBeGreaterThanOrEqual(seek!.y + seek!.height - 1);
        expect(Math.abs(time!.x + time!.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
        expect(seek!.width).toBeGreaterThanOrEqual(viewport.width - 6);
      } else expect(Math.abs(seek!.y + seek!.height / 2 - time!.y - time!.height / 2)).toBeLessThanOrEqual(2);
      for (const selector of ['.film-previous', '.film-play-toggle', '.film-next', '.film-mute-toggle', '.film-options__trigger', '.film-fullscreen']) {
        const bounds = await page.locator(selector).boundingBox();
        expect(bounds, selector).not.toBeNull();
        expect(bounds!.width, selector).toBeGreaterThanOrEqual(44);
        expect(bounds!.height, selector).toBeGreaterThanOrEqual(44);
        if (mode === 'portrait') expect(bounds!.y, selector).toBeGreaterThanOrEqual(seek!.y + seek!.height - 1);
        else expect(Math.abs(bounds!.y - seek!.y), selector).toBeLessThanOrEqual(2);
        expect(bounds!.x, selector).toBeGreaterThanOrEqual(-1);
        expect(bounds!.x + bounds!.width, selector).toBeLessThanOrEqual(viewport.width + 1);
      }
      expect(seek!.width).toBeGreaterThanOrEqual(44);
      await page.screenshot({ path: `screenshots/video/responsive-transport/${info.project.name}-${locale}-${mode}.png` });
      await page.locator('#film-settings-toggle').click();
      const menu = page.locator('#film-options-menu');
      await expect(menu).toBeVisible();
      await expect.poll(() => menu.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
      const pb = await player.boundingBox(), mb = await menu.boundingBox();
      expect(mb!.y).toBeGreaterThanOrEqual(pb!.y - 1);
      expect(mb!.y + mb!.height).toBeLessThanOrEqual(pb!.y + pb!.height + 1);
      await page.screenshot({ path: `screenshots/video/responsive-transport/${info.project.name}-${locale}-${mode}-settings.png` });
      await page.locator('#film-settings-toggle').click();
    }
  });
}


test('desktop transport follows actual frame width across compact, tablet and wide screens', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Actual standard fullscreen in Chromium');
  await silenceTestMedia(page);
  await page.goto('/en');
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-media-hydrated'));
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.locator('video').evaluate(v => (v as HTMLVideoElement).pause());
  for (const viewport of [{ width: 320, height: 240 }, { width: 510, height: 900 }, { width: 560, height: 320 }, { width: 561, height: 320 }, { width: 768, height: 600 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await page.locator('.film-fullscreen').click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
    await page.locator('#film-player').hover();
    const frame = await page.locator('#film-player').boundingBox(), seek = await page.locator('.film-seek').boundingBox();
    expect(frame!.width).toBe(viewport.width); expect(frame!.height).toBe(viewport.height);
    for (const selector of ['.film-play-toggle', '.film-mute-toggle', '.film-options__trigger', '.film-fullscreen']) {
      const box = await page.locator(selector).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      if (frame!.width <= 560) expect(box!.y).toBeGreaterThanOrEqual(seek!.y + seek!.height - 1);
      else expect(Math.abs(box!.y - seek!.y)).toBeLessThanOrEqual(2);
    }
    await mkdir('screenshots/video/responsive-transport', { recursive: true });
    await page.screenshot({ path: `screenshots/video/responsive-transport/desktop-${viewport.width}x${viewport.height}.png` });
    await page.locator('.film-fullscreen').click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
  }
});


test('reported Evolution frame fills the landscape player with a single transport row', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Original reported film on mobile WebKit, explicit fullscreen layout adapter');
  const viewport = info.project.name.includes('max') ? { width: 956, height: 440 } : { width: 874, height: 402 };
  await silenceTestMedia(page);
  await page.setViewportSize(viewport);
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__item').nth(2).click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video');
  await expect.poll(() => video.evaluate(v => Number.isFinite((v as HTMLVideoElement).duration)), { timeout: 30000 }).toBe(true);
  await video.evaluate(v => { const m = v as HTMLVideoElement; m.currentTime = 74; });
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).seeking && (v as HTMLVideoElement).readyState >= 2), { timeout: 30000 }).toBe(true);
  await video.evaluate(v => (v as HTMLVideoElement).pause());
  await page.locator('.film-fullscreen').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-element-fullscreen', 'true');
  await expect(video).toHaveCSS('object-fit', 'cover');
  const box = await video.boundingBox(); expect(box!.width).toBe(viewport.width); expect(box!.height).toBe(viewport.height);
  const seek = await page.locator('.film-seek').boundingBox(), play = await page.locator('.film-play-toggle').boundingBox();
  expect(Math.abs(seek!.y - play!.y)).toBeLessThanOrEqual(2);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `screenshots/video/responsive-transport/${info.project.name}-evolution-74.png` });
});
