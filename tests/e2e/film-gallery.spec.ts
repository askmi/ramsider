import { emulateCustomFullscreenLayout } from './fullscreen-layout-adapter';
test.beforeEach(async ({ page }, info) => { if (info.project.name.includes('iphone')) await emulateCustomFullscreenLayout(page); });
import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(180000);

// A hidden chrome intentionally does not intercept pointer input. Reproduce the
// user gesture that reveals it before testing its top actions.
async function revealTop(page: Page, touch: boolean) {
  const stage = page.locator('#film-player');
  if (await stage.evaluate(el => el.hasAttribute('userinactive'))) {
    const box = await page.locator('video').boundingBox();
    if (!box) throw new Error('Video is not visible for control activity');
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    if (touch) await page.touchscreen.tap(x, y);
    else { await page.mouse.move(x - 2, y); await page.mouse.move(x, y); }
  }
  await expect.poll(() => page.locator('.film-player__top').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
}

test('gallery posters, all seven films, controls and cleanup', async ({ page }, info) => {
  const errors: string[] = [];
  const posterRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('/art/films/')) posterRequests.push(request.url()); });
  await page.goto('/en');
  await page.evaluate(() => document.fonts.ready);
  const viewport = page.viewportSize()!;
  if (info.project.name.includes('iphone')) expect(await page.evaluate(() => [innerWidth, devicePixelRatio])).toEqual([viewport.width, 3]);
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  expect(posterRequests).toHaveLength(0);
  await page.locator('#film-play').click();
  const dialog = page.locator('#product-film');
  await expect(dialog).toHaveAttribute('data-view', 'gallery');
  const items = dialog.locator('.film-gallery__item');
  await expect(items).toHaveCount(7);
  await expect(dialog.locator('video')).not.toHaveAttribute('src');
  await expect(dialog.locator('.film-gallery__hero img')).toHaveAttribute('src', /\/art\/films\/1\.jpg/);
  for (let step = 0; step < 4; step++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('#product-film')))).toBe(true);
  }
  await dialog.locator('.film-gallery img').evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  await mkdir('screenshots/video/gallery', { recursive: true });
  await page.screenshot({ path: `screenshots/video/gallery/portrait-${info.project.name}.png` });
  const titles = ['Ramsider Uno (Product Introduction)', 'Pure Gold', 'Evolution', 'Our Style', 'DIY Madness', 'Copycats', 'Inside Ramsider'];
  for (let index = 0; index < 7; index++) {
    await items.nth(index).click();
    await expect(items.nth(index)).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog).toContainText(titles[index]);
    const geometry = await dialog.locator('.film-gallery__hero img').evaluate(async image => {
      const img = image as HTMLImageElement; await img.decode(); const rect = img.getBoundingClientRect();
      return { width: rect.width, height: rect.height, expected: rect.width * img.naturalHeight / img.naturalWidth };
    });
    expect(Math.abs(geometry.height - geometry.expected)).toBeLessThanOrEqual(1);
    if (info.project.name.includes('iphone')) await page.screenshot({ path: `screenshots/video/gallery/poster-${index + 1}-${info.project.name}.png` });
    await dialog.locator('.film-gallery__hero').click();
    await expect(dialog).toHaveAttribute('data-view', 'playing');
    const video = dialog.locator('video');
    await expect(video).toBeFocused();
    await expect.poll(() => video.evaluate(element => { const v = element as HTMLVideoElement; return !v.paused && v.currentTime > .2 && v.readyState >= 2; }), { timeout: 30000 }).toBe(true);
    const presented = await video.evaluate(element => new Promise<boolean>(resolve => {
      const v = element as HTMLVideoElement;
      if (!v.requestVideoFrameCallback) { resolve(false); return; }
      const timeout = setTimeout(() => resolve(false), 10000);
      v.requestVideoFrameCallback((_now, metadata) => { clearTimeout(timeout); resolve(metadata.width > 0 && metadata.height > 0); });
    }));
    expect(presented, `presented frame for ${titles[index]}`).toBe(true);
    await expect(video).toHaveAttribute('data-src', new RegExp(index ? ['pure-gold', 'evolution', 'our-style', 'diy-madness', 'copycats', 'inside-ramsider'][index - 1] : 'uno-introduction'));
    await video.evaluate(element => { const v = element as HTMLVideoElement; v.currentTime = Math.min(10, v.duration / 2); });
    await expect.poll(() => video.evaluate(element => { const v = element as HTMLVideoElement; return !v.seeking && v.currentTime > 9.9; }), { timeout: 30000 }).toBe(true);
    if (index === 0) {
      await dialog.locator('.film-play-toggle').hover();
      await expect(dialog.locator('.film-transport')).toBeVisible();
      await page.waitForTimeout(600); // Allow Media Chrome's control fade-in to finish before capture.
      await page.screenshot({ path: `screenshots/video/gallery/playing-${info.project.name}.png` });
    }
    await revealTop(page, info.project.name.includes('iphone'));
    await dialog.locator('.film-player__list-toggle').click();
    await expect(dialog.locator('#film-playlist')).toBeVisible();
    await expect(dialog.locator('.film-playlist__item[aria-current=true]')).toContainText(titles[index]);
    await dialog.locator('.film-playlist__close').click();
    await dialog.locator('.film-player__close').click();
    await expect(dialog).not.toBeVisible();
    await page.locator('#film-play').click();
    await expect(dialog).toHaveAttribute('data-view', 'gallery');
  }
  await dialog.locator('.product-film__close').click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.locator('video').evaluate(element => [(element as HTMLVideoElement).paused, element.getAttribute('src')])).toEqual([true, null]);
  expect(errors).toEqual([]);
});

test('film navigation, end choices and full-window gallery', async ({ page }, info) => {
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video');
  const dialog = page.locator('#product-film');
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  const identity = page.locator('.film-player__identity');
  await expect(identity).toContainText('Ramsider Uno (Product Introduction)');
  expect(await identity.evaluate(element => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight)).toBe(true);
  await page.locator('.film-next').click();
  await expect(video).toHaveAttribute('data-src', /pure-gold/);
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.locator('.film-previous').click();
  await expect(video).toHaveAttribute('data-src', /uno-introduction/);
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await video.evaluate(element => { const v = element as HTMLVideoElement; v.currentTime = Math.max(0, v.duration - .3); });
  await expect(dialog).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
  await expect(page.locator('.film-ended')).toBeVisible();
  const endCard = await page.locator('.film-ended').boundingBox();
  const transport = await page.locator('.film-transport').boundingBox();
  expect(endCard!.y + endCard!.height).toBeLessThanOrEqual(transport!.y + 1);
  for (const button of await page.locator('.film-ended button').all()) {
    expect(await button.evaluate(element => {
      const r = element.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return hit === element || element.contains(hit);
    })).toBe(true);
  }
  await mkdir('screenshots/video/gallery', { recursive: true });
  await page.screenshot({ path: `screenshots/video/gallery/ended-${info.project.name}.png` });
  await video.evaluate(element => { (element as HTMLVideoElement).currentTime = 20; });
  await expect.poll(() => video.evaluate(element => !(element as HTMLVideoElement).seeking), { timeout: 30000 }).toBe(true);
  await page.locator('.film-play-toggle').click();
  await expect(dialog).toHaveAttribute('data-view', 'playing');
  await video.evaluate(element => { const v = element as HTMLVideoElement; v.currentTime = v.duration - .3; });
  await expect(dialog).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
  await page.locator('.film-ended__replay').click();
  await expect(dialog).toHaveAttribute('data-view', 'playing');
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.locator('.film-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id === 'film-player' || document.querySelector('#film-player')?.getAttribute('data-element-fullscreen') === 'true')).toBe(true);
  await expect(page.locator('#film-settings-toggle')).toBeVisible();
  await page.locator('.film-play-toggle').hover();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `screenshots/video/gallery/fullscreen-playing-${info.project.name}.png` });
  await video.evaluate(element => { const v = element as HTMLVideoElement; v.currentTime = v.duration - .3; });
  await expect(dialog).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
  const fullscreenCard = await page.locator('.film-ended').boundingBox();
  const fullscreenTransport = await page.locator('.film-transport').boundingBox();
  expect(fullscreenCard!.y + fullscreenCard!.height).toBeLessThanOrEqual(fullscreenTransport!.y + 1);
  await page.locator('.film-play-toggle').hover();
  await page.screenshot({ path: `screenshots/video/gallery/fullscreen-ended-${info.project.name}.png` });
  await revealTop(page, info.project.name.includes('iphone'));
  await page.locator('.film-player__list-toggle').click();
  await expect(dialog.locator('#film-playlist')).toBeVisible();
  await expect(dialog.locator('.film-playlist__item[aria-current=true]')).toContainText('Ramsider Uno (Product Introduction)');
  await dialog.locator('.film-playlist__close').click();
  await page.locator('.film-player__close').click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => !document.fullscreenElement && !document.querySelector('#film-player')?.hasAttribute('data-element-fullscreen'))).toBe(true);
});

test('landscape gallery and Arabic layout remain usable', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One mobile WebKit owner for the adaptation matrix');
  await page.setViewportSize({ width: 874, height: 402 });
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`);
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click();
    const dialog = page.locator('#product-film');
    await expect(dialog).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(dialog.locator('.film-gallery__item')).toHaveCount(7);
    await dialog.locator('.film-gallery__item').nth(6).click();
    await expect(dialog.locator('.film-gallery__hero img')).toHaveAttribute('src', /7\.jpg/);
    const geometry = await dialog.locator('.film-gallery__hero img').evaluate(async element => {
      const img = element as HTMLImageElement; await img.decode(); const rect = img.getBoundingClientRect();
      return { width: rect.width, height: rect.height, expected: rect.width * img.naturalHeight / img.naturalWidth };
    });
    expect(Math.abs(geometry.height - geometry.expected)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(dialog.locator('.product-film__close')).toBeInViewport();
    await mkdir('screenshots/video/gallery', { recursive: true });
    await page.screenshot({ path: `screenshots/video/gallery/landscape-${locale}.png` });
    await dialog.locator('.product-film__close').click();
  }
});

test('narrow transport keeps full touch targets and seek usable', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One WebKit owner for narrow-width target matrix');
  for (const width of [320, 375, 402, 440]) {
    await page.setViewportSize({ width, height: 874 });
    await page.goto('/en');
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click();
    await page.locator('.film-gallery__hero').click();
    const video = page.locator('video');
    await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
    await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
    for (const selector of ['.film-previous', '.film-play-toggle', '.film-next', '.film-mute-toggle', '#film-settings-toggle', '.film-fullscreen', '.film-seek']) {
      const box = await page.locator(selector).boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.width, selector).toBeGreaterThanOrEqual(44);
      expect(box!.height, selector).toBeGreaterThanOrEqual(44);
      expect(box!.x, selector).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, selector).toBeLessThanOrEqual(width + 1);
    }
    await page.locator('#film-settings-toggle').click();
    await expect(page.locator('#film-options-menu')).toBeVisible();
    await expect(page.locator('.film-player__close')).toBeVisible();
    await expect(page.locator('.film-player__list-toggle')).toBeVisible();
    await page.locator('#film-settings-toggle').click();
    const seek = await page.locator('.film-seek').boundingBox();
    await page.mouse.click(seek!.x + seek!.width * .6, seek!.y + seek!.height / 2);
    await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(20);
  }
});

test('last film ends without inventing a next film', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One WebKit owner for the final item boundary');
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__item').nth(6).click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video');
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await video.evaluate(element => { const v = element as HTMLVideoElement; v.currentTime = v.duration - .3; });
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
  await expect(page.locator('.film-ended button')).toHaveCount(1);
  await expect(page.locator('.film-ended__replay')).toBeVisible();
  await expect(page.locator('.film-ended__next')).toHaveCount(0);
  await expect(page.locator('.film-next')).toBeDisabled();
  await page.locator('.film-ended__replay').click();
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'playing');
  await expect(page.locator('.film-player__identity')).toHaveText('Inside Ramsider');
});

test('keyboard activates player actions with Space', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One keyboard owner');
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const dialog = page.locator('#product-film'), video = page.locator('video');
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.locator('.film-player__list-toggle').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#film-playlist')).toBeVisible();
  await page.locator('.film-playlist__close').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#film-playlist')).toHaveCount(0);
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await video.evaluate(element => { const v = element as HTMLVideoElement; v.currentTime = v.duration - .3; });
  await expect(dialog).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
  await page.locator('.film-ended__replay').focus();
  await page.keyboard.press('Space');
  await expect(dialog).toHaveAttribute('data-view', 'playing');
  await page.locator('.film-player__close').focus();
  await page.keyboard.press('Space');
  await expect(dialog).not.toBeVisible();
});

test('wide short landscape preserves the entire selected poster', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One wide-viewport owner');
  await page.setViewportSize({ width: 1440, height: 400 });
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  const img = page.locator('.film-gallery__hero img');
  await expect(img).toHaveAttribute('src', /1\.jpg/);
  const geometry = await img.evaluate(async element => {
    const i = element as HTMLImageElement; await i.decode(); const r = i.getBoundingClientRect();
    return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height, expected: r.width * i.naturalHeight / i.naturalWidth };
  });
  expect(geometry.y).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(400);
  expect(Math.abs(geometry.height - geometry.expected)).toBeLessThanOrEqual(1);
  const dialogBox = await page.locator('#product-film').boundingBox();
  expect(geometry.y).toBeGreaterThanOrEqual(dialogBox!.y - 1);
  expect(geometry.bottom).toBeLessThanOrEqual(dialogBox!.y + dialogBox!.height + 1);
  await mkdir('screenshots/video/gallery', { recursive: true });
  await page.screenshot({ path: 'screenshots/video/gallery/landscape-short-wide.png' });
});
