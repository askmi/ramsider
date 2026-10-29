import { expectOriginalUnavailable } from './original-film-support';
import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(180000);
const ids = ['uno-introduction', 'pure-gold', 'evolution', 'our-style', 'diy-madness', 'copycats', 'inside-ramsider'];
const root = 'screenshots/video/gallery-activation';
async function gallery(page: Page) {
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'gallery');
  await expect(page.locator('video')).not.toHaveAttribute('src');
}
async function playing(page: Page, id: string) {
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'playing');
  await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', id);
  const video = page.locator('video');
  await expect(video).toHaveAttribute('data-src', new RegExp(id));
  if (await expectOriginalUnavailable(page)) return;
  await expect.poll(() => video.evaluate(el => { const v = el as HTMLVideoElement; return !v.paused && v.currentTime > .2 && v.readyState >= 2; }), { timeout: 30000 }).toBe(true);
  await video.evaluate(el => new Promise<void>((resolve, reject) => {
    const v = el as HTMLVideoElement, timer = setTimeout(() => reject(Error('No decoded frame')), 10000);
    v.requestVideoFrameCallback((_now, frame) => { clearTimeout(timer); if (frame.width && frame.height) resolve(); else reject(Error('Empty decoded frame')); });
  }));
  expect(await video.evaluate(el => { const v = el as HTMLVideoElement; return v.muted && v.volume === 0; })).toBe(true);
  await expect(video).toBeFocused();
}
async function closePlayer(page: Page) {
  await page.locator('video').evaluate(el => (el as HTMLVideoElement).pause());
  await page.locator('.film-player__close').click();
  await expect(page.locator('#product-film')).not.toHaveAttribute('open');
}
for (const locale of ['en', 'ar']) test(`${locale}: compact list first selects and second activation plays all seven films`, async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native WebKit and Chromium MSE owners');
  await page.goto(`/${locale}`); await page.evaluate(() => document.fonts.ready);
  const touch = info.project.name.includes('iphone');
  for (let index = 0; index < ids.length; index++) {
    await gallery(page);
    const item = page.locator('.film-gallery__item').nth(index);
    if (touch) await item.tap(); else await item.click();
    await expect(item).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'gallery');
    await expect(page.locator('video')).not.toHaveAttribute('src');
    if (touch) await item.tap(); else await item.click();
    await playing(page, ids[index]);
    if (index === 3) {
      await page.locator('video').evaluate(el => (el as HTMLVideoElement).pause());
      await expect.poll(() => page.locator('.film-transport').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
      await expect.poll(() => page.locator('.film-player__top').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
      await mkdir(root, { recursive: true });
      await page.screenshot({ path: `${root}/${info.project.name}-${locale}-compact-started.png` });
    }
    await closePlayer(page);
  }
});

test('actual double click, double tap, rapid activation and keyboard work without fullscreen', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native WebKit and Chromium MSE owners');
  await page.goto('/en');
  await gallery(page); await page.locator('.film-gallery__item').nth(3).dblclick();
  await playing(page, ids[3]); await closePlayer(page);
  if (info.project.name.includes('iphone')) {
    await gallery(page);
    const item = page.locator('.film-gallery__item').nth(4); await item.scrollIntoViewIfNeeded();
    const r = (await item.boundingBox())!;
    await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 3);
    await page.touchscreen.tap(r.x + r.width / 2, r.y + r.height / 3);
    await playing(page, ids[4]); await closePlayer(page);
  }
  await gallery(page);
  await page.locator('.film-gallery__item').nth(5).evaluate(el => { (el as HTMLButtonElement).click(); (el as HTMLButtonElement).click(); });
  await playing(page, ids[5]); await closePlayer(page);
  for (const key of ['Enter', 'Space']) {
    await gallery(page); const item = page.locator('.film-gallery__item').nth(2); await item.focus();
    await page.keyboard.press(key); await expect(page.locator('video')).not.toHaveAttribute('src');
    await page.keyboard.press(key); await playing(page, ids[2]); await closePlayer(page);
  }
});

test('different selection and close/reopen disarm the compact list; hero remains one-click', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native WebKit and Chromium MSE owners');
  await page.goto('/en'); await gallery(page);
  const items = page.locator('.film-gallery__item');
  await items.nth(1).click(); await items.nth(2).click(); await items.nth(1).click();
  await expect(page.locator('video')).not.toHaveAttribute('src');
  await page.locator('.product-film__close').click(); await gallery(page);
  await items.nth(1).click(); await expect(page.locator('video')).not.toHaveAttribute('src');
  await page.locator('.film-gallery__hero').click(); await playing(page, ids[1]);
  await closePlayer(page);
  const size = info.project.name.includes('max') ? { width: 956, height: 440 } : { width: 874, height: 402 };
  await page.setViewportSize(size); await gallery(page);
  await items.nth(6).dblclick(); await playing(page, ids[6]);
  expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
  await closePlayer(page);
});

test('inline player List also starts a different film and resumes a paused current film', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native WebKit and Chromium MSE owners');
  const touch = info.project.name.includes('iphone');
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`); await gallery(page);
    await page.locator('.film-gallery__hero').click(); await playing(page, ids[0]);
    await page.locator('video').evaluate(el => (el as HTMLVideoElement).pause());
    await page.locator('.film-player__list-toggle').click();
    const target = page.locator('.film-playlist__item').nth(3);
    if (touch) await target.tap(); else await target.click();
    await expect(target).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('video')).toHaveAttribute('data-src', new RegExp(ids[0]));
    expect(await page.locator('video').evaluate(el => (el as HTMLVideoElement).paused)).toBe(true);
    if (touch) await target.tap(); else await target.click();
    await expect(page.locator('#film-playlist')).toHaveCount(0);
    await playing(page, ids[3]);
    await page.locator('video').evaluate(el => (el as HTMLVideoElement).pause());
    await page.locator('.film-player__list-toggle').click();
    await page.locator('.film-playlist__item').nth(3).dblclick();
    await playing(page, ids[3]);
    expect(await page.evaluate(() => document.fullscreenElement)).toBeNull();
    await closePlayer(page);
  }
});
