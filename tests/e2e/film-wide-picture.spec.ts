import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';
import { emulateCustomFullscreenLayout } from './fullscreen-layout-adapter';

test.use({ serviceWorkers: 'block' });
test.setTimeout(180000);
const root = 'screenshots/video/wide-picture/after';
const apertures = [
  { id: 'our-style', top: 292 / 2160, height: 1576 / 2160 },
  { id: 'diy-madness', top: 304 / 2160, height: 1552 / 2160 },
  { id: 'copycats', top: 0, height: 1 },
];
async function open(page: Page, locale: string) {
  await silenceTestMedia(page);
  await page.goto(`/${locale}`);
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__item').nth(3).click();
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready', { timeout: 30000 });
  await settledFrame(page, 2);
  await page.evaluate(() => document.fonts.ready);
}
async function settledFrame(page: Page, time: number) {
  const video = page.locator('video');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).readyState), { timeout: 30000 }).toBeGreaterThanOrEqual(2);
  await video.evaluate(async (el, time) => {
    const v = el as HTMLVideoElement;
    await v.play();
    if (Math.abs(v.currentTime - time) > .05) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('Seek did not finish')), 15000);
        v.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true }); v.currentTime = time;
      });
    }
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('No presented frame after seek')), 10000);
      v.requestVideoFrameCallback(() => { clearTimeout(timer); resolve(); });
    });
    v.pause();
  }, time);
}
async function picture(page: Page, aperture: typeof apertures[number], expanded: boolean) {
  const result = await page.locator('video').evaluate((el, a) => {
    const v = el as HTMLVideoElement, r = v.getBoundingClientRect(), h = v.closest('#film-player')!.getBoundingClientRect();
    const fit = getComputedStyle(v).objectFit;
    const scale = (fit === 'cover' ? Math.max : Math.min)(r.width / v.videoWidth, r.height / v.videoHeight);
    return {
      fit, muted: v.muted, volume: v.volume,
      headerBottom: v.closest('#film-player')!.querySelector('.film-player__top')!.getBoundingClientRect().bottom,
      transportTop: v.closest('#film-player')!.querySelector('.film-transport')!.getBoundingClientRect().top,
      host: { x: h.x, y: h.y, width: h.width, height: h.height },
      box: { x: r.x, y: r.y, width: r.width, height: r.height },
      active: { left: r.x + (r.width - v.videoWidth * scale) / 2, right: r.x + (r.width + v.videoWidth * scale) / 2,
        top: r.y + (r.height - v.videoHeight * scale) / 2 + v.videoHeight * scale * a.top,
        bottom: r.y + (r.height - v.videoHeight * scale) / 2 + v.videoHeight * scale * (a.top + a.height) },
      width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
    };
  }, aperture);
  expect(result.muted).toBe(true); expect(result.volume).toBe(0);
  if (expanded) {
    expect(result.fit).toBe('cover');
    expect(Math.abs(result.host.width - result.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(result.host.height - result.height)).toBeLessThanOrEqual(1);
    expect(result.active.left).toBeLessThanOrEqual(result.host.x + 1);
    expect(result.active.right).toBeGreaterThanOrEqual(result.host.x + result.host.width - 1);
    expect(result.active.top).toBeLessThanOrEqual(result.host.y + 1);
    expect(result.active.bottom).toBeGreaterThanOrEqual(result.host.y + result.host.height - 1);
  } else {
    expect(result.fit).toBe('contain');
    expect(result.box.y).toBeGreaterThanOrEqual(result.headerBottom - 1);
    expect(result.box.y + result.box.height).toBeLessThanOrEqual(result.transportTop + 1);
  }
  if (expanded && aperture.id === 'copycats') expect(Math.abs(result.box.height - result.host.height)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(await page.locator('#film-player').evaluate(el => el.scrollTop)).toBe(0);
  return result;
}
async function chrome(page: Page, screenshot: string) {
  await page.locator('.film-play-toggle').hover();
  await expect.poll(() => page.locator('.film-transport').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  await expect.poll(() => page.locator('.film-player__top').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  for (const selector of ['.film-player__close', '.film-player__list-toggle', '.film-play-toggle', '.film-options__trigger', '.film-fullscreen']) {
    const target = page.locator(selector);
    expect(await target.evaluate(el => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return hit === el || el.contains(hit); }), selector).toBe(true);
  }
  await mkdir(root, { recursive: true }); await page.screenshot({ path: `${root}/${screenshot}.png` });
}
for (const locale of ['en', 'ar']) test(`${locale}: active pictures fill rotated Pro and Max without changing portrait or film 6`, async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Required mobile WebKit profiles; fullscreen is labelled layout adapter');
  await emulateCustomFullscreenLayout(page); await open(page, locale);
  test.skip(locale === 'ar' && new URL(page.url()).pathname === '/en', 'Arabic runtime disabled by English-only presentation; preserved for multilingual mode');
  const max = info.project.name.includes('max');
  const portrait = max ? { width: 440, height: 956 } : { width: 402, height: 874 };
  const landscape = { width: portrait.height, height: portrait.width };
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  for (const aperture of apertures) {
    await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', aperture.id);
    await settledFrame(page, 8); await picture(page, aperture, false);
    await chrome(page, `${info.project.name}-${locale}-${aperture.id}-portrait`);
    for (const height of [landscape.height, landscape.height - 64]) {
      await page.setViewportSize({ width: landscape.width, height });
      await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
      expect(await page.evaluate(() => [innerWidth, devicePixelRatio])).toEqual([landscape.width, 3]);
      await picture(page, aperture, true);
      await chrome(page, `${info.project.name}-${locale}-${aperture.id}-landscape-${height}`);
    }
    await page.setViewportSize(landscape); await settledFrame(page, 15);
    await page.locator('.film-fullscreen').click();
    await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
    await page.locator('.film-fullscreen').click();
    await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
    await expect(page.locator('#film-player')).toHaveAttribute('data-element-fullscreen', 'true');
    await picture(page, aperture, true); await chrome(page, `${info.project.name}-${locale}-${aperture.id}-fullscreen-adapter`);
    await page.locator('.film-player__list-toggle').click();
    await expect(page.locator('#film-playlist')).toBeVisible();
    await chrome(page, `${info.project.name}-${locale}-${aperture.id}-list`);
    await page.keyboard.press('Escape');
    await page.locator('.film-fullscreen').click();
    await page.touchscreen.tap(4, landscape.height / 2);
    await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).paused)).toBe(false);
    await page.touchscreen.tap(4, landscape.height / 2);
    await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
    if (aperture.id === 'our-style') {
      await settledFrame(page, 36); await picture(page, aperture, true);
      await chrome(page, `${info.project.name}-${locale}-our-style-end-shot`);
    }
    await page.setViewportSize(portrait); await picture(page, aperture, false);
    if (aperture.id !== 'copycats') { await page.locator('.film-next').click(); await settledFrame(page, 8); }
  }
  await page.locator('.film-player__close').click();
  await expect(page.locator('#product-film')).not.toHaveAttribute('open');
  expect(errors).toEqual([]);
});

test('real element fullscreen and MP4 fallback use the same proportional aperture', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Real Chromium fullscreen and progressive fallback owner');
  await page.route('**/*.m3u8', route => route.abort());
  await open(page, 'en');
  for (const aperture of apertures) {
    await expect(page.locator('video')).toHaveAttribute('data-playback', 'mp4-fallback');
    await settledFrame(page, 8);
    for (const viewport of [{ width: 874, height: 402 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport); await page.locator('.film-fullscreen').click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
      await picture(page, aperture, true); await chrome(page, `chromium-${aperture.id}-${viewport.width}-fullscreen-fallback`);
      await page.locator('.film-fullscreen').click();
    }
    if (aperture.id !== 'copycats') { await page.locator('.film-next').click(); await settledFrame(page, 8); }
  }
});


test('native HLS and MSE quality changes keep the active picture filled', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'desktop-chromium'].includes(info.project.name), 'Native HLS and MSE owners');
  if (info.project.name.includes('iphone')) await emulateCustomFullscreenLayout(page);
  await open(page, 'en'); await page.setViewportSize({ width: 874, height: 402 });
  await page.locator('.film-fullscreen').click();
  for (const aperture of apertures.slice(0, 2)) {
    for (const value of ['144', '720']) {
      await page.locator('.film-options__trigger').click();
      await expect(page.locator('#film-options-menu')).not.toHaveAttribute('hidden');
      await page.locator('.film-menu-quality').click();
      const option = page.locator(`#film-quality-options media-chrome-menu-item[value="${value}"]`);
      await option.scrollIntoViewIfNeeded(); await option.click();
      await page.locator('video').evaluate(v => (v as HTMLVideoElement).play());
      await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoHeight), { timeout: 30000 }).toBe(Number(value));
      await settledFrame(page, 8); await picture(page, aperture, true);
      await chrome(page, `${info.project.name}-${aperture.id}-quality-${value}`);
    }
    if (aperture.id === 'our-style') { await page.locator('.film-next').click(); await settledFrame(page, 8); }
  }
});


test('iPhone 13 geometry: original films 4/5/6 fill rotated web viewport', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One WebKit owner, explicit iPhone13 viewport; not physical native OS');
  await page.setViewportSize({ width: 390, height: 844 }); await open(page, 'en');
  for (const aperture of apertures) {
    await settledFrame(page, 8); const portrait = await picture(page, aperture, false);
    expect(portrait.box.width).toBeGreaterThanOrEqual(389);
    for (const height of [390, 326]) {
      await page.setViewportSize({ width: 844, height }); await picture(page, aperture, true);
      await chrome(page, `iphone13-${aperture.id}-landscape-${height}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    if (aperture.id !== 'copycats') { await page.locator('.film-next').click(); await settledFrame(page, 8); }
  }
  await page.locator('.film-player__close').click();
});
