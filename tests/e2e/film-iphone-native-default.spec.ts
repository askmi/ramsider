import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';

const output = process.env.NATIVE_DEFAULT_CAPTURE_DIR ?? 'screenshots/video/iphone-native-default/local';
type NativeProbe = { active: boolean; enters: number; exits: number; reject: boolean; video: HTMLVideoElement; end: () => void };
declare global { interface Window { nativeDefaultProbe: NativeProbe } }

async function open(page: Page, query = '') {
  await page.goto(`/en${query}`);
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__item').nth(2).click();
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime > .2 && v.videoWidth > 0 && !v.error), { timeout: 30000 }).toBe(true);
  await page.locator('video').evaluate((video: HTMLVideoElement) => { video.pause(); video.currentTime = 10; });
  await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => !v.seeking && v.readyState >= 2)).toBe(true);
  // Explicit API adapter: Playwright WebKit does not expose Apple's AVKit UI.
  await page.evaluate(() => {
    const video = document.querySelector('video')!;
    const probe: NativeProbe = { active: false, enters: 0, exits: 0, reject: false, video, end: () => {} };
    probe.end = () => { probe.active = false; probe.exits++; video.dispatchEvent(new Event('webkitendfullscreen')); };
    Object.defineProperties(video, {
      webkitSupportsFullscreen: { configurable: true, value: true },
      webkitDisplayingFullscreen: { configurable: true, get: () => probe.active },
      webkitEnterFullscreen: { configurable: true, value: () => {
        probe.enters++;
        if (probe.reject) throw new Error('Native request denied');
        probe.active = true;
        video.dispatchEvent(new Event('webkitbeginfullscreen'));
      } },
      webkitExitFullscreen: { configurable: true, value: probe.end },
    });
    window.nativeDefaultProbe = probe;
  });
}
async function mediaState(page: Page) {
  return page.locator('video').evaluate((v: HTMLVideoElement) => ({ sameVideo: v === window.nativeDefaultProbe.video, src: v.currentSrc, time: v.currentTime, inline: v.playsInline, paused: v.paused }));
}
async function nativeState(page: Page) {
  return page.evaluate(() => ({ active: window.nativeDefaultProbe.active, enters: window.nativeDefaultProbe.enters, exits: window.nativeDefaultProbe.exits }));
}

test.beforeEach(async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Configured iPhone WebKit routing/lifecycle; not physical AVKit proof');
  await silenceTestMedia(page);
  await mkdir(output, { recursive: true });
});

test('original fullscreen button defaults to Apple API, retains media, exits and re-enters through keyboard and media request', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await open(page);
  expect(await page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio }))).toEqual({ width: info.project.use.viewport!.width, dpr: 3 });
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
  await page.evaluate(() => document.fonts.ready);
  const before = await mediaState(page); expect(before.inline).toBe(true);
  await page.screenshot({ path: `${output}/${info.project.name}-inline.png` });
  await page.locator('.film-fullscreen').tap();
  expect(await nativeState(page)).toEqual({ active: true, enters: 1, exits: 0 });
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'true');
  expect(await mediaState(page)).toEqual(before);
  // Changing browser orientation cannot replace an active native session with window mode.
  await page.setViewportSize({ width: info.project.use.viewport!.height, height: info.project.use.viewport!.width });
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
  expect((await nativeState(page)).enters).toBe(1);
  await page.evaluate(() => window.nativeDefaultProbe.end());
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#product-film')).toHaveAttribute('open');
  await expect(page.locator('video')).toBeFocused();
  await page.setViewportSize(info.project.use.viewport!);
  await page.locator('.film-fullscreen').focus(); await page.keyboard.press('Enter');
  expect((await nativeState(page)).enters).toBe(2);
  await page.evaluate(() => window.nativeDefaultProbe.end());
  await page.locator('#film-player').dispatchEvent('mediaenterfullscreenrequest');
  expect((await nativeState(page)).enters).toBe(3);
  expect(await mediaState(page)).toEqual(before);
  await page.evaluate(() => window.nativeDefaultProbe.end());
  await page.screenshot({ path: `${output}/${info.project.name}-returned.png` });
  await page.locator('#film-player').dispatchEvent('mediaenterfullscreenrequest');
  await page.locator('#product-film').evaluate((dialog: HTMLDialogElement) => dialog.close());
  expect((await nativeState(page)).active).toBe(false);
  await expect(page.locator('video')).not.toHaveAttribute('src');
  expect(errors).toEqual([]);
});

test('native default rejects truthfully, retries, and inline rotation does not invoke the window substitute', async ({ page }, info) => {
  await open(page);
  await page.setViewportSize({ width: info.project.use.viewport!.height, height: info.project.use.viewport!.width });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect((await nativeState(page)).enters).toBe(0);
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
  await page.evaluate(() => { window.nativeDefaultProbe.reject = true; });
  await page.locator('.film-fullscreen').tap();
  await expect(page.locator('.film-control-message')).toBeVisible();
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
  await page.evaluate(() => { window.nativeDefaultProbe.reject = false; });
  await page.locator('.film-fullscreen').tap();
  expect((await nativeState(page)).active).toBe(true);
});

for (const query of ['?iphonePlayer=native', '?iphonePlayer=invalid', '?iphonePlayer=window']) {
  test(`URL presentation ${query} preserves the requested path`, async ({ page }) => {
    await open(page, query);
    await page.locator('.film-fullscreen').tap();
    if (query.endsWith('=window')) {
      await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
      expect((await nativeState(page)).enters).toBe(0);
    } else {
      expect((await nativeState(page)).enters).toBe(1);
      await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
    }
  });
}
