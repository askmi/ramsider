import { emulateCustomFullscreenLayout } from './fullscreen-layout-adapter';
test.beforeEach(async ({ page }, info) => { if (info.project.name.includes('iphone')) await emulateCustomFullscreenLayout(page); });
import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(120000);

test('landscape playing and ended compositions in normal and fullscreen', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'iphone-17-pro-max-webkit'].includes(info.project.name), 'Two mobile WebKit landscape owners');
  const max = info.project.name === 'iphone-17-pro-max-webkit';
  const label = max ? 'max' : 'pro';
  await page.setViewportSize(max ? { width: 956, height: 440 } : { width: 874, height: 402 });
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video'), dialog = page.locator('#product-film');
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => video.evaluate(v => { const media = v as HTMLVideoElement; return !media.paused && media.currentTime > .2 && media.videoHeight > 0; }), { timeout: 30000 }).toBe(true);
  expect(await video.evaluate(v => new Promise<boolean>(resolve => {
    const media = v as HTMLVideoElement;
    const timeout = setTimeout(() => resolve(false), 10000);
    media.requestVideoFrameCallback((_now, frame) => { clearTimeout(timeout); resolve(frame.width > 0 && frame.height > 0); });
  }))).toBe(true);
  await mkdir('screenshots/video/gallery', { recursive: true });
  const capture = async (state: string) => {
    await page.locator('.film-play-toggle').hover();
    await expect(page.locator('.film-transport')).toBeVisible();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `screenshots/video/gallery/landscape-${state}-${label}.png` });
  };
  const end = async () => {
    await video.evaluate(v => { const media = v as HTMLVideoElement; media.currentTime = media.duration - .3; });
    await expect(dialog).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
    await expect(page.locator('.film-ended')).toBeVisible();
  };
  await capture('playing');
  await end();
  await capture('ended');
  await page.locator('.film-ended__replay').click();
  await expect(dialog).toHaveAttribute('data-view', 'playing');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.locator('.film-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id === 'film-player' || document.querySelector('#film-player')?.getAttribute('data-element-fullscreen') === 'true')).toBe(true);
  await capture('fullscreen-playing');
  await end();
  await capture('fullscreen-ended');
  await page.locator('.film-player__close').click();
  await expect(dialog).not.toBeVisible();
});
