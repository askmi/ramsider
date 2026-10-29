import { test, expect, devices, chromium, type Page } from '@playwright/test';
import { silenceTestMedia } from './silent-media';
import { emulateCustomFullscreenLayout } from './fullscreen-layout-adapter';

const original = '/films/evolution/original-v1/original.mp4';
test.setTimeout(180000);
test.use({ serviceWorkers: 'block' });
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => { await silenceTestMedia(page); const list: string[] = []; errors.set(page, list); page.on('pageerror', error => list.push(error.message)); });
test.afterEach(async ({ page }) => { expect(errors.get(page) ?? []).toEqual([]); });
async function openEvolution(page: Page, locale = 'en') {
  await page.goto(`/${locale}`); await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click();
  await page.locator('.film-gallery__item').nth(2).click(); await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready', { timeout: 30000 });
  await expect(page.locator('video')).toHaveAttribute('data-src', original);
}
async function frame(page: Page, seconds: number) {
  await page.locator('video').evaluate(async (el, seconds) => {
    const v = el as HTMLVideoElement; await v.play();
    if (Math.abs(v.currentTime - seconds) > .05) await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Seek timeout')), 15000);
      v.addEventListener('seeked', () => { clearTimeout(timer); resolve(); }, { once: true }); v.currentTime = seconds;
    });
    await new Promise<void>((resolve, reject) => { const timer = setTimeout(() => reject(Error('Frame timeout')), 10000); v.requestVideoFrameCallback(() => { clearTimeout(timer); resolve(); }); }); v.pause();
  }, seconds);
}
async function geometry(page: Page, fullWidth: boolean) {
  const g = await page.locator('video').evaluate(el => {
    const v = el as HTMLVideoElement, r = v.getBoundingClientRect(), host = v.closest('#film-player')!.getBoundingClientRect();
    const scale = Math.min(r.width / v.videoWidth, r.height / v.videoHeight), left = r.x + (r.width - v.videoWidth * scale) / 2;
    return { left, right: left + v.videoWidth * scale, width: r.width, height: r.height, source: [v.videoWidth, v.videoHeight], viewport: innerWidth, dpr: devicePixelRatio, host: { left: host.left, right: host.right }, muted: v.muted, volume: v.volume, src: v.currentSrc, delivery: v.dataset.playback };
  });
  expect(g.source).toEqual([1920, 1080]); expect(g.delivery).toBe('original-mp4'); expect(g.src).toContain(original);
  expect(Math.abs(g.height - g.width * 1080 / 1920)).toBeLessThanOrEqual(1);
  if (fullWidth) { expect(Math.abs(g.left)).toBeLessThanOrEqual(1); expect(Math.abs(g.right - g.viewport)).toBeLessThanOrEqual(1); }
  expect(g.muted).toBe(true); expect(g.volume).toBe(0); return g;
}

test('Evolution original decoded picture reaches both fullscreen edges without distortion', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Mobile WebKit composition; official Chrome actual playback is tested separately');
  await emulateCustomFullscreenLayout(page); // Composition/lifecycle only, not physical Apple fullscreen.
  const requests: string[] = []; page.on('request', r => { if (r.url().includes('/films/evolution/')) requests.push(r.url()); });
  await openEvolution(page);
  const sizes = info.project.name.includes('max') ? [[440, 956], [956, 440], [956, 376]] : [[402, 874], [874, 402], [874, 338], [390, 844], [844, 390]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const fullscreen of [false, true]) {
      if (fullscreen) await page.locator('.film-fullscreen').click();
      for (const seconds of [10, 30, 59, 109]) {
        await frame(page, seconds); const g = await geometry(page, fullscreen || width > height); expect(g.dpr).toBe(3); expect(g.viewport).toBe(width);
        if (seconds === 10 || seconds === 109) await page.screenshot({ path: `screenshots/video/original-file/${info.project.name}-${width}x${height}-${fullscreen ? 'fullscreen-layout' : 'inline'}-${seconds}.png` });
      }
      if (fullscreen) { await page.locator('.film-fullscreen').click(); await expect(page.locator('#film-player')).not.toHaveAttribute('data-element-fullscreen'); }
    }
  }
  expect(requests.length).toBeGreaterThan(0); expect(requests.every(url => url.endsWith(original))).toBe(true);
  await page.locator('.film-player__close').click(); await expect(page.locator('video')).not.toHaveAttribute('src');
});

test('original playback supports RTL, settings, speed, end/replay, adjacent films and close/reopen', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'HEVC WebKit playback owners');
  await emulateCustomFullscreenLayout(page); await openEvolution(page, 'ar');
  await frame(page, 10); await expect(page.locator('#product-film')).toHaveAttribute('dir', 'rtl');
  await page.locator('.film-fullscreen').click(); await page.locator('.film-options__trigger').click();
  await expect(page.locator('.film-menu-quality')).toHaveAttribute('disabled', '');
  await page.locator('.film-menu-speed').click(); await page.locator('#film-speed-options media-chrome-menu-item[value="1.5"]').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.5);
  await frame(page, 109); await geometry(page, true);
  await page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; m.currentTime = m.duration; });
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'ended');
  await page.locator('.film-ended__replay').click(); await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime)).toBeLessThan(5);
  await page.locator('.film-skip').last().click(); await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', 'our-style');
  await expect(page.locator('video')).toHaveAttribute('data-delivery', 'hls');
  await page.locator('.film-skip').first().click(); await frame(page, 30); await geometry(page, true);
  await page.locator('.film-player__close').click(); await expect(page.locator('video')).not.toHaveAttribute('src');
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click(); await frame(page, 10);
  await page.locator('.film-player__close').click(); await expect(page.locator('#film-play')).toBeFocused();
});

test('negative path: actual missing HEVC decoder stops audio-only playback and retries the original', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Bundled Chromium has no HEVC decoder; this is not successful film acceptance');
  const requests: string[] = []; page.on('request', r => { if (r.url().includes('/films/evolution/')) requests.push(r.url()); });
  await openEvolution(page); await expect(page.locator('.film-recovery')).toBeVisible();
  await expect.poll(() => page.locator('video').evaluate(v => !v.hasAttribute('src') && (v as HTMLVideoElement).paused)).toBe(true);
  expect(requests.length).toBeGreaterThan(0);
  // Retry may reuse the original from the media cache without another HTTP
  // request. Observe a new real metadata attempt rather than network count.
  await page.locator('video').evaluate(v => { v.addEventListener('loadedmetadata', () => { v.dataset.qaRetriedOriginal = 'true'; }, { once: true }); });
  await expect(page.locator('.film-recovery button')).toBeVisible(); await page.locator('.film-recovery button').click();
  await expect(page.locator('video')).toHaveAttribute('data-qa-retried-original', 'true');
  await expect(page.locator('.film-recovery')).toBeVisible();
  await expect(page.locator('video')).not.toHaveAttribute('src');
  expect(requests.every(url => url.endsWith(original))).toBe(true);
  await page.locator('.film-player__close').click(); await expect(page.locator('#product-film')).not.toHaveAttribute('open');
});

test('official Chrome decodes the original despite an empty capability hint and fills real fullscreen', async ({ baseURL }, info) => {
  test.skip(info.project.name !== 'desktop-chromium' || process.env.HLS_SYSTEM_CHROME !== '1', 'Run HLS_SYSTEM_CHROME=1 on a machine with official Chrome and HEVC; required for this delivery');
  const browser = await chromium.launch({ channel: 'chrome', args: ['--mute-audio'] });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await silenceTestMedia(context);
  // Make this regression deterministic if a future Chrome fixes its capability
  // hint. The original bytes, decoder and fullscreen API remain real.
  await context.addInitScript(() => {
    const canPlayType = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function (type) {
      return type.includes('hvc1') ? '' : canPlayType.call(this, type);
    };
  });
  const page = await context.newPage(), failures: string[] = [], requests: string[] = [];
  page.on('pageerror', e => failures.push(e.message));
  page.on('request', r => { if (r.url().includes('/films/evolution/')) requests.push(r.url()); });
  try {
    await openEvolution(page);
    await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoWidth)).toBe(1920);
    const decoded = await page.locator('video').evaluate(async el => {
      const v = el as HTMLVideoElement, start = v.currentTime; let frames = 0;
      await v.play();
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('No advancing original frames')), 10000);
        const next = () => { if (++frames >= 5 && v.currentTime > start + .1) { clearTimeout(timer); resolve(); } else v.requestVideoFrameCallback(next); };
        v.requestVideoFrameCallback(next);
      });
      v.pause(); return { frames, start, end: v.currentTime };
    });
    expect(decoded.frames).toBeGreaterThanOrEqual(5); expect(decoded.end).toBeGreaterThan(decoded.start + .1);
    for (const [width, height] of [[1440, 900], [844, 390]]) {
      await page.setViewportSize({ width, height }); await page.locator('.film-fullscreen').click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
      for (const seconds of [10, 30, 59, 109]) {
        await frame(page, seconds); await geometry(page, true);
        await page.screenshot({ path: `screenshots/video/original-file/desktop-chrome-${width}x${height}-real-fullscreen-${seconds}.png` });
      }
      await page.locator('.film-fullscreen').click(); await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
    }
    await expect(page.locator('.film-recovery')).toBeHidden();
    expect(requests.length).toBeGreaterThan(0); expect(requests.every(url => url.endsWith(original))).toBe(true);
    await page.locator('.film-player__close').click(); await expect(page.locator('video')).not.toHaveAttribute('src'); expect(failures).toEqual([]);
  } finally { await context.close(); await browser.close(); }
});


test('original HEVC uses real desktop WebKit fullscreen and preserves screen width', async ({ browser, baseURL }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One desktop WebKit real fullscreen owner; no fullscreen adapter');
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1, userAgent: devices['Desktop Safari'].userAgent, serviceWorkers: 'block' });
  await silenceTestMedia(context); const page = await context.newPage(), failures: string[] = []; page.on('pageerror', e => failures.push(e.message));
  try {
    await openEvolution(page);
    for (const [width, height] of [[1440, 900], [844, 390]]) {
      await page.setViewportSize({ width, height }); await page.locator('.film-fullscreen').click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
      for (const seconds of [10, 30, 59, 109]) {
        await frame(page, seconds); await geometry(page, true);
        await page.screenshot({ path: `screenshots/video/original-file/desktop-webkit-${width}x${height}-real-fullscreen-${seconds}.png` });
      }
      await page.locator('.film-fullscreen').click(); await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
    }
    await page.locator('.film-player__close').click(); await expect(page.locator('video')).not.toHaveAttribute('src'); expect(failures).toEqual([]);
  } finally { await context.close(); }
});

test('original MP4 network failure retries the same original and keeps keyboard close usable', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'HEVC WebKit playback owners');
  await page.route(`**${original}`, route => route.abort()); await openEvolution(page);
  await expect(page.locator('.film-recovery')).toBeVisible();
  await page.unroute(`**${original}`); await page.locator('.film-recovery button').click(); await frame(page, 59);
  await geometry(page, false); await expect(page.locator('.film-recovery')).not.toBeVisible();
  await page.locator('.film-player__close').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#product-film')).not.toHaveAttribute('open'); await expect(page.locator('video')).not.toHaveAttribute('src');
});
