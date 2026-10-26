import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';

test.setTimeout(100000);
test.beforeEach(async ({ page }) => silenceTestMedia(page));
const options = (page: Page) => page.locator('.film-options__trigger');
const quality = (page: Page, value: string) => page.locator(`input[name=film-quality][value="${value}"]`);
async function visit(page: Page, locale = 'en') {
  await page.goto(`/${locale}`);
  await expect.poll(() => page.locator('.art img:not([data-media-ready])').count(), { timeout: 45000 }).toBe(0);
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await expect(page.locator('#product-film')).toBeVisible();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 25000 }).toBeGreaterThan(.5);
}
async function choose(page: Page, value: string) {
  if (await options(page).getAttribute('aria-expanded') !== 'true') await options(page).click();
  await quality(page, value).check();
  await expect(options(page)).toHaveAttribute('aria-expanded', 'false');
}
async function frameHeight(page: Page, height: number) {
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoHeight), { timeout: 20000 }).toBe(height);
}

test('QA media is silent before Play in fixture and independent contexts', async ({ page, browser }) => {
  const context = await browser.newContext();
  await silenceTestMedia(context);
  const independent = await context.newPage();
  try {
    for (const target of [page, independent]) {
      await target.goto('/en');
      await expect.poll(() => target.locator('video').evaluate(v => { const media = v as HTMLVideoElement; return [media.muted, media.defaultMuted, media.volume, media.hasAttribute('src')]; })).toEqual([true, true, 0, false]);
    }
  } finally { await context.close(); }
});

test('resolution menu selects real frames, preserves pause/time/rate, returns to Auto and cleans up', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native Pro/Max and Chromium MSE own HLS switch coverage');
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await visit(page);
  const video = page.locator('video');
  const steps: unknown[] = [];
  const sample = async (choice: string) => steps.push(await video.evaluate((v, choice) => { const media = v as HTMLVideoElement; return { choice, mode: media.dataset.qualityMode, src: media.currentSrc, height: media.videoHeight, time: media.currentTime, rate: media.playbackRate, paused: media.paused }; }, choice));
  await options(page).click();
  expect(await page.locator('input[name=film-quality]').evaluateAll(nodes => nodes.map(n => (n as HTMLInputElement).value))).toEqual(['auto', '2160', '1440', '1080', '720', '360', '144']);
  await page.locator('button[aria-controls=film-speed-options]').click();
  await page.locator('input[name=film-speed][value="1.5"]').check();
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.5);
  await video.evaluate(v => { (v as HTMLVideoElement).currentTime = 12; });
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(12);
  await choose(page, '144');
  await frameHeight(page, 144);
  await sample('144');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(12);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.5);
  await video.evaluate(v => (v as HTMLVideoElement).pause());
  const paused = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
  await choose(page, '720');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  expect(Math.abs(await video.evaluate(v => (v as HTMLVideoElement).currentTime) - paused)).toBeLessThan(.3);
  await video.evaluate(v => (v as HTMLVideoElement).play());
  await frameHeight(page, 720);
  await sample('720');
  await choose(page, '2160');
  await frameHeight(page, 2160);
  await sample('2160');
  await choose(page, 'auto');
  await expect(video).toHaveAttribute('data-quality-mode', 'auto');
  if (info.project.name.startsWith('iphone')) await expect(video).toHaveAttribute('src', /en-v3\/master\.m3u8$/);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(false);
  const resumed = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 15000 }).toBeGreaterThan(resumed + .4);
  if (info.project.name === 'desktop-chromium') await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).videoHeight), { timeout: 15000 }).toBeLessThan(2160);
  await sample('auto');
  await options(page).click();
  const boxes = await page.evaluate(() => ({ video: document.querySelector('video')!.getBoundingClientRect().toJSON(), menu: document.querySelector('#film-options-menu')!.getBoundingClientRect().toJSON(), width: innerWidth, dpr: devicePixelRatio, overflow: document.querySelector('#product-film')!.scrollWidth > document.querySelector('#product-film')!.clientWidth }));
  expect(boxes.menu.top).toBeGreaterThanOrEqual(boxes.video.bottom);
  expect(boxes.overflow).toBe(false);
  await mkdir('screenshots/video/options', { recursive: true });
  await page.screenshot({ path: `screenshots/video/options/menu-${info.project.name}.png` });
  await writeFile(`screenshots/video/options/result-${info.project.name}.json`, JSON.stringify({ steps, boxes, pausedSwitchTime: paused, errors, silent: await video.evaluate(v => ({ muted: (v as HTMLVideoElement).muted, volume: (v as HTMLVideoElement).volume })) }, null, 2));
  await page.keyboard.press('Escape');
  await expect(options(page)).toBeFocused();
  await expect(page.locator('#product-film')).toBeVisible();
  await page.locator('.product-film__close').click();
  await expect(video).not.toHaveAttribute('src');
  expect(errors).toEqual([]);
});

test('all locale menus fit, RTL and keyboard/outside dismissal keep video unobstructed', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One mobile owner for 11 locales and responsive widths');
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    await visit(page, locale);
    await options(page).click();
    await expect(page.locator('#product-film')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    expect(await page.locator('#film-options-menu').evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    if (locale === 'ar') await page.screenshot({ path: 'screenshots/video/options/menu-ar.png' });
    await page.keyboard.press('Escape');
    await expect(options(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(options(page)).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#product-film-title').click();
    await expect(options(page)).toHaveAttribute('aria-expanded', 'false');
    await page.locator('.product-film__close').click();
  }
  for (const viewport of [{ width: 375, height: 667 }, { width: 874, height: 402 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport);
    await visit(page);
    await options(page).click();
    const geometry = await page.evaluate(() => {
      const video = document.querySelector('video')!.getBoundingClientRect(), menu = document.querySelector('#film-options-menu')!.getBoundingClientRect(), modal = document.querySelector('#product-film')!;
      return { video: video.toJSON(), menu: menu.toJSON(), overflow: modal.scrollWidth > modal.clientWidth };
    });
    expect(geometry.menu.top).toBeGreaterThanOrEqual(geometry.video.bottom);
    expect(geometry.video.top).toBeGreaterThanOrEqual(0);
    expect(geometry.video.bottom).toBeLessThan(viewport.height);
    expect(geometry.menu.bottom).toBeLessThanOrEqual(viewport.height);
    expect(geometry.overflow).toBe(false);
    await page.screenshot({ path: `screenshots/video/options/menu-${viewport.width}x${viewport.height}.png` });
    await page.locator('.product-film__close').click();
  }
});

test('a reported media error exposes only the actual fallback resolution', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native and MSE own fallback quality UI');
  await visit(page);
  await page.locator('video').evaluate(v => {
    Object.defineProperty(v, 'error', { configurable: true, value: { code: 3, message: 'QA media decode failure' } });
    v.dispatchEvent(new Event('error'));
    Reflect.deleteProperty(v, 'error');
  });
  await expect(page.locator('video')).toHaveAttribute('data-playback', 'mp4-fallback', { timeout: 20000 });
  await options(page).click();
  await expect(page.locator('input[name=film-quality]')).toHaveCount(1);
  await expect(quality(page, '720')).toBeChecked();
  await page.locator('.product-film__close').click();
  await expect(page.locator('video')).not.toHaveAttribute('src');
});

test('same-task rapid quality choices and close/reopen cannot restore stale time', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native and MSE lifecycle owners');
  await visit(page, 'ru');
  const video = page.locator('video');
  await video.evaluate(v => { const media = v as HTMLVideoElement; media.pause(); media.currentTime = 18; });
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).seeking)).toBe(false);
  // Same event-loop task guarantees the second selection precedes metadata.
  // Real pointer hit areas are covered above; no network/SW interception claim.
  await page.evaluate(() => {
    const trigger = document.querySelector<HTMLButtonElement>('.film-options__trigger')!;
    trigger.click(); document.querySelector<HTMLInputElement>('input[name=film-quality][value="720"]')!.click();
    trigger.click(); document.querySelector<HTMLInputElement>('input[name=film-quality][value="144"]')!.click();
  });
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
  expect(Math.abs(await video.evaluate(v => (v as HTMLVideoElement).currentTime) - 18)).toBeLessThan(.3);
  expect(await video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await choose(page, '2160');
  await page.locator('.product-film__close').click();
  await page.locator('#film-play').click();
  await expect(video).toHaveAttribute('data-quality-mode', 'auto');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 15000 }).toBeGreaterThan(.5);
  expect(await video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeLessThan(10);
  await page.locator('.product-film__close').click();
  await expect(video).not.toHaveAttribute('src');
});

test('keyboard selects real quality and speed and Auto resumes its viewport cap', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One keyboard and observed MSE Auto owner');
  await visit(page);
  await options(page).click();
  await quality(page, 'auto').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('video')).toHaveAttribute('data-quality-mode', '2160');
  await frameHeight(page, 2160);
  await expect(options(page)).toBeFocused();
  await options(page).click();
  await quality(page, 'auto').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('video')).toHaveAttribute('data-quality-mode', 'auto');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoHeight), { timeout: 15000 }).toBeLessThan(2160);
  await options(page).click();
  await page.locator('button[aria-controls=film-speed-options]').click();
  await page.locator('input[name=film-speed][value="1"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.25);
  await expect(options(page)).toBeFocused();
  await page.locator('.product-film__close').click();
});

test('speed selected before fallback metadata keeps the latest user choice', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'desktop-chromium'].includes(info.project.name), 'One native and one MSE fallback-speed owner');
  await visit(page);
  await options(page).click();
  await page.locator('button[aria-controls=film-speed-options]').click();
  await page.evaluate(() => {
    const video = document.querySelector('video')!;
    Object.defineProperty(video, 'error', { configurable: true, value: { code: 3, message: 'QA fallback loading' } });
    video.dispatchEvent(new Event('error'));
    Reflect.deleteProperty(video, 'error');
    // The fallback metadata event cannot run until this synchronous task ends.
    document.querySelector<HTMLInputElement>('input[name=film-speed][value="1.5"]')!.click();
  });
  await expect(page.locator('video')).toHaveAttribute('data-playback', 'mp4-fallback');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.5);
  await expect(options(page)).toContainText('1.5×');
  await page.locator('.product-film__close').click();
  await expect(page.locator('video')).not.toHaveAttribute('src');
});
