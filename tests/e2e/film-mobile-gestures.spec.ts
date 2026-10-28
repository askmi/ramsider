import { expect, test, type Locator, type Page } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(120000);

async function tapPicture(page: Page, video: Locator) {
  const bounds = await video.boundingBox();
  expect(bounds).not.toBeNull();
  await page.touchscreen.tap(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
}

// Synthetic TouchEvents exercise movement handling; Playwright exposes real taps,
// but does not expose a cross-browser continuous touch-drag API.
async function swipe(video: Locator, dx: number, dy = 0, cancel = false) {
  await video.evaluate((element, args) => {
    const rect = element.getBoundingClientRect(), x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
    const finger = (cx: number, cy: number) => ({ identifier: 1, target: element, clientX: cx, clientY: cy });
    const send = (name: string, fingerAt: ReturnType<typeof finger>, active: boolean) => {
      const event = new Event(name, { bubbles: true, cancelable: true });
      Object.defineProperties(event, { touches: { value: active ? [fingerAt] : [] }, changedTouches: { value: [fingerAt] } });
      element.dispatchEvent(event);
    };
    send('touchstart', finger(x, y), true);
    send('touchmove', finger(x + args.dx, y + args.dy), true);
    send(args.cancel ? 'touchcancel' : 'touchend', finger(x + args.dx, y + args.dy), false);
  }, { dx, dy, cancel });
}

test('picture touch toggles once and horizontal swipe seeks without affecting controls', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Mobile WebKit profiles exercise touchscreen');
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video'), player = page.locator('#film-player');
  await expect(player).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await page.waitForTimeout(600);
  expect(await video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused)).toBe(true);
  await page.waitForTimeout(600);
  expect(await video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(false);
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  const width = (await video.boundingBox())!.width;
  const original = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
  await swipe(video, width / 4);
  const forward = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
  expect(forward).toBeGreaterThan(original + 1);
  await swipe(video, -width / 8);
  const backward = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
  expect(backward).toBeLessThan(forward - 1);
  await swipe(video, 0, 40);
  await swipe(video, width / 4, 0, true);
  expect(await video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeCloseTo(backward, 1);
  expect(await video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await page.locator('.film-play-toggle').click();
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused)).toBe(true);
  await page.locator('.film-fullscreen').click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement) || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused)).toBe(true);
});

test('aborted and stale touch play rejections do not mask a genuine playback error', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Mobile WebKit touch owners');
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video');
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  const deferPlay = async () => video.evaluate(v => {
    const media = v as HTMLVideoElement;
    const nativePlay = media.play.bind(media);
    media.play = () => { void nativePlay().catch(() => {}); return new Promise<void>((_resolve, reject) => { (window as unknown as { rejectTouchPlay: (error: DOMException) => void }).rejectTouchPlay = reject; }); };
  });
  const rejectPlay = (name: string) => page.evaluate(n => (window as unknown as { rejectTouchPlay: (error: DOMException) => void }).rejectTouchPlay(new DOMException('Test rejection', n)), name);
  await deferPlay();
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused)).toBe(true);
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await rejectPlay('AbortError');
  await page.waitForTimeout(300);
  await expect(page.locator('.film-recovery')).toBeHidden();
  await deferPlay();
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused)).toBe(true);
  await video.evaluate(v => { Reflect.deleteProperty(v, 'play'); });
  await page.locator('.film-next').click();
  await expect(page.locator('.film-player__identity')).toHaveText('Pure Gold');
  await rejectPlay('NotAllowedError');
  await page.waitForTimeout(300);
  await expect(page.locator('.film-recovery')).toBeHidden();
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused), { timeout: 30000 }).toBe(true);
  await tapPicture(page, video);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await video.evaluate(v => { (v as HTMLVideoElement).play = () => Promise.reject(new DOMException('Test rejection', 'NotAllowedError')); });
  await tapPicture(page, video);
  await expect(page.locator('.film-recovery')).toBeVisible();
});

test('tap after terminal source failure preserves the Retry action', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Mobile WebKit touch owners');
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video');
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
  await video.evaluate(v => {
    const media = v as HTMLVideoElement;
    media.pause(); media.removeAttribute('src'); media.load();
    (window as unknown as { errorPlayCount: number }).errorPlayCount = 0;
    media.play = () => { (window as unknown as { errorPlayCount: number }).errorPlayCount++; return Promise.resolve(); };
    media.dispatchEvent(new CustomEvent('film-status', { detail: 'error' }));
  });
  await expect(page.locator('.film-recovery')).toBeVisible();
  const bounds = (await video.boundingBox())!;
  await page.touchscreen.tap(bounds.x + bounds.width * .9, bounds.y + bounds.height * .4);
  await video.evaluate(v => v.dispatchEvent(new Event('waiting')));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as unknown as { errorPlayCount: number }).errorPlayCount)).toBe(0);
  await expect(page.locator('.film-recovery')).toBeVisible();
  await expect(page.locator('.film-recovery button')).toBeVisible();
  await video.evaluate(v => { Reflect.deleteProperty(v, 'play'); });
  await page.locator('.film-recovery button').click();
  await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
  await expect(page.locator('.film-recovery')).toBeHidden();
});
