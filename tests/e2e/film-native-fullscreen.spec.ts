import { expect, test } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

declare global {
  interface Window { nativeFullscreenTest: { active: boolean; mode: string; enters: number; exits: number; begin: () => void; end: () => void } }
}

test.describe('native API adapter', () => {
test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Deterministic native API adapter; not physical iPhone proof');
  await silenceTestMedia(page);
  await page.goto('/en');
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-media-hydrated'));
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await page.evaluate(() => {
    const host = document.querySelector('#film-player')!, video = document.querySelector('video')!;
    const state = { active: false, mode: 'success', enters: 0, exits: 0, begin: () => {}, end: () => {} };
    state.begin = () => { state.active = true; video.dispatchEvent(new Event('webkitbeginfullscreen')); };
    state.end = () => { state.active = false; state.exits++; video.dispatchEvent(new Event('webkitendfullscreen')); };
    Object.assign(window, { nativeFullscreenTest: state });
    Object.defineProperty(host, 'requestFullscreen', { configurable: true, value: undefined });
    Object.defineProperty(host, 'webkitRequestFullscreen', { configurable: true, value: undefined });
    Object.defineProperty(video, 'webkitDisplayingFullscreen', { configurable: true, get: () => state.active });
    Object.defineProperty(video, 'webkitEnterFullscreen', { configurable: true, value: () => {
      state.enters++;
      if (state.mode === 'throw') throw new Error('denied');
      if (state.mode === 'success') state.begin();
    } });
    Object.defineProperty(video, 'webkitExitFullscreen', { configurable: true, value: state.end });
  });
});

test('native video fullscreen enters, exits, restores focus and releases on close', async ({ page }) => {
  const button = page.locator('.film-fullscreen');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-element-fullscreen');
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
  await page.evaluate(() => window.nativeFullscreenTest.end());
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('video')).toBeFocused();
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#product-film').evaluate((d: HTMLDialogElement) => d.close());
  await expect.poll(() => page.evaluate(() => window.nativeFullscreenTest.active)).toBe(false);
  await expect(page.locator('video')).not.toHaveAttribute('src');
});

test('browser native controls or pinch can enter without the custom fullscreen button', async ({ page }) => {
  await page.evaluate(() => window.nativeFullscreenTest.begin());
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.nativeFullscreenTest.exits)).toBe(0);
  await page.evaluate(() => window.nativeFullscreenTest.end());
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'false');
});

for (const mode of ['throw', 'pending', 'unsupported']) test(`native ${mode} reports error and never substitutes full-window`, async ({ page }) => {
  await page.evaluate(mode => {
    window.nativeFullscreenTest.mode = mode;
    if (mode === 'unsupported') Object.defineProperty(document.querySelector('video'), 'webkitEnterFullscreen', { value: undefined });
  }, mode);
  await page.locator('.film-fullscreen').click();
  await expect(page.locator('.film-control-message')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
  await expect(page.locator('#product-film')).not.toHaveAttribute('data-film-expanded');
});

test('late native entry after close is exited without reopening the dialog', async ({ page }) => {
  await page.evaluate(() => { window.nativeFullscreenTest.mode = 'pending'; });
  await page.locator('.film-fullscreen').click();
  await page.locator('#product-film').evaluate((d: HTMLDialogElement) => d.close());
  await expect(page.locator('#product-film')).not.toHaveAttribute('open');
  await page.evaluate(() => window.nativeFullscreenTest.begin());
  await expect.poll(() => page.evaluate(() => window.nativeFullscreenTest.active)).toBe(false);
  await expect(page.locator('#product-film')).not.toHaveAttribute('open');
});

test('late cancelled native entry cannot take over a reopened playing session', async ({ page }) => {
  await page.evaluate(() => { window.nativeFullscreenTest.mode = 'pending'; });
  await page.locator('.film-fullscreen').click();
  await page.locator('#product-film').evaluate((d: HTMLDialogElement) => d.close());
  await expect(page.locator('#product-film')).not.toHaveAttribute('open');
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'playing');
  await page.evaluate(() => window.nativeFullscreenTest.begin());
  await expect.poll(() => page.evaluate(() => window.nativeFullscreenTest.active)).toBe(false);
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'playing');
});

test('native entry after watchdog expiry stays rejected and retains error', async ({ page }) => {
  await page.evaluate(() => { window.nativeFullscreenTest.mode = 'pending'; });
  await page.locator('.film-fullscreen').click();
  await expect(page.locator('.film-control-message')).toBeVisible({ timeout: 6000 });
  await page.evaluate(() => window.nativeFullscreenTest.begin());
  await expect.poll(() => page.evaluate(() => window.nativeFullscreenTest.active)).toBe(false);
  await expect(page.locator('.film-control-message')).toBeVisible();
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'false');
});

test('retry can enter once and additional cancelled native completions cannot reopen it', async ({ page }) => {
  await page.evaluate(() => { window.nativeFullscreenTest.mode = 'pending'; });
  await page.locator('.film-fullscreen').click();
  await page.locator('#product-film').evaluate((d: HTMLDialogElement) => d.close());
  await expect(page.locator('#product-film')).not.toHaveAttribute('open');
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  await page.locator('.film-fullscreen').click();
  expect(await page.evaluate(() => window.nativeFullscreenTest.enters)).toBe(2);
  await page.evaluate(() => window.nativeFullscreenTest.begin());
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => window.nativeFullscreenTest.end());
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await page.evaluate(() => window.nativeFullscreenTest.begin());
  await expect.poll(() => page.evaluate(() => window.nativeFullscreenTest.active)).toBe(false);
  expect(await page.evaluate(() => window.nativeFullscreenTest.enters)).toBe(2);
});

test('a timed-out native request can be retried successfully without later reopening', async ({ page }) => {
  await page.evaluate(() => { window.nativeFullscreenTest.mode = 'pending'; });
  await page.locator('.film-fullscreen').click();
  await expect(page.locator('.film-control-message')).toBeVisible({ timeout: 6000 });
  await page.evaluate(() => { window.nativeFullscreenTest.mode = 'success'; });
  await page.locator('.film-fullscreen').click();
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.nativeFullscreenTest.enters)).toBe(2);
  await page.evaluate(() => window.nativeFullscreenTest.end());
  await page.evaluate(() => window.nativeFullscreenTest.begin());
  await expect.poll(() => page.evaluate(() => window.nativeFullscreenTest.active)).toBe(false);
});

test('synchronous native rejection does not suppress the next independent browser entry', async ({ page }) => {
  await page.evaluate(() => { window.nativeFullscreenTest.mode = 'throw'; });
  await page.locator('.film-fullscreen').click();
  await expect(page.locator('.film-control-message')).toBeVisible();
  await page.evaluate(() => window.nativeFullscreenTest.begin());
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.nativeFullscreenTest.exits)).toBe(0);
});

for (const input of ['pointer', 'keyboard'] as const) test(`failed requests cannot suppress a fresh native control ${input} after reopen`, async ({ page }) => {
  await page.evaluate(() => { window.nativeFullscreenTest.mode = 'pending'; });
  for (let i = 0; i < 2; i++) {
    await page.locator('.film-fullscreen').click();
    await expect(page.locator('.film-control-message')).toBeVisible({ timeout: 6000 });
  }
  await page.locator('#product-film').evaluate((d: HTMLDialogElement) => d.close());
  await expect(page.locator('#product-film')).not.toHaveAttribute('open');
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video');
  await video.evaluate(v => { const m = v as HTMLVideoElement; m.pause(); m.controls = true; });
  // Trusted pointer input represents interaction with the retained native UI.
  // A bare synthetic begin remains rejected in the stale-entry tests above.
  const box = (await video.boundingBox())!;
  if (input === 'pointer') await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  else { await video.focus(); await page.keyboard.press('Enter'); }
  await page.evaluate(() => window.nativeFullscreenTest.begin());
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.nativeFullscreenTest.active)).toBe(true);
});

test('element fullscreen rejection reports error without switching player modes', async ({ page }) => {
  await page.locator('#film-player').evaluate(host => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    Object.defineProperty(host, 'requestFullscreen', { configurable: true, value: () => Promise.reject(new Error('denied')) });
  });
  await page.locator('.film-fullscreen').click();
  await expect(page.locator('.film-control-message')).toBeVisible();
  expect(await page.evaluate(() => window.nativeFullscreenTest.enters)).toBe(0);
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
});

});

test('unadapted mobile WebKit never substitutes full-window when fullscreen is unavailable', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Real mobile WebKit capability path, no layout adapter');
  await silenceTestMedia(page);
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.locator('.film-fullscreen').click();
  await expect(page.locator('.film-control-message')).toBeVisible({ timeout: 6000 });
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
  await expect(page.locator('#product-film')).not.toHaveAttribute('data-film-expanded');
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'false');
});
