import { expect, test, type Page } from '@playwright/test';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(120000);

async function openFilm(page: Page) {
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video');
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => video.evaluate(el => !(el as HTMLVideoElement).paused && (el as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
  return video;
}

async function activity(page: Page, touch: boolean) {
  const box = await page.locator('video').boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2, y = box!.y + box!.height / 2;
  if (touch) {
    const video = page.locator('video');
    const paused = await video.evaluate(el => (el as HTMLVideoElement).paused);
    await page.touchscreen.tap(x, y);
    if (await video.evaluate(el => (el as HTMLVideoElement).paused) !== paused) await page.locator('.film-play-toggle').click();
    await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).paused)).toBe(paused);
  }
  else await page.mouse.move(x, y);
}

async function expectOpacity(page: Page, target: number) {
  for (const selector of ['.film-player__top', '.film-transport']) {
    await expect.poll(() => page.locator(selector).evaluate(el => Number(getComputedStyle(el).opacity)), { timeout: 8000, message: `${selector} opacity should be ${target}` }).toBe(target);
  }
}

test('top and bottom fade together, reappear on activity, and keep controls accessible', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'The requested matrix uses WebKit and Chromium');
  const video = await openFilm(page);
  const touch = info.project.name.includes('iphone');
  if (touch) expect(await page.evaluate(() => [innerWidth, devicePixelRatio])).toEqual([page.viewportSize()!.width, 3]);
  await activity(page, touch);
  await expectOpacity(page, 1);
  const top = page.locator('.film-player__top');
  const items = top.locator('button, .film-player__identity');
  await expect(items).toHaveCount(3);
  for (const el of await items.all()) {
    const css = await el.evaluate(e => {
      const s = getComputedStyle(e);
      return { border: s.borderTopWidth, background: s.backgroundImage };
    });
    expect(css.border).toBe('0px');
    expect(css.background).toBe(await page.locator('.film-transport').evaluate(e => getComputedStyle(e).backgroundImage));
  }
  const close = top.locator('button').last();
  expect(parseFloat(await close.evaluate(e => getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(24);
  const closeBox = await close.boundingBox();
  expect(closeBox!.width).toBeGreaterThanOrEqual(44);
  expect(closeBox!.height).toBeGreaterThanOrEqual(44);
  for (const selector of ['.film-previous', '.film-next']) {
    const paths = page.locator(`${selector} svg path`);
    await expect(paths).toHaveCount(2);
    expect(await paths.nth(0).getAttribute('d')).toMatch(/[zZ]$/);
    expect(await paths.nth(1).getAttribute('d')).toMatch(/^M\d+ 5v14$/);
  }
  await mkdir('screenshots/video/controls-visibility', { recursive: true });
  await page.screenshot({ path: `screenshots/video/controls-visibility/visible-${info.project.name}.png` });
  await expectOpacity(page, 0);
  await page.screenshot({ path: `screenshots/video/controls-visibility/hidden-${info.project.name}.png` });
  await activity(page, touch);
  await expectOpacity(page, 1);
  await page.locator('#film-settings-toggle').click();
  await expect(page.locator('#film-options-menu')).toBeVisible();
  await page.waitForTimeout(4000); // An open menu must keep its controls available beyond the idle timeout.
  await expect(page.locator('#film-options-menu')).toBeVisible();
  await expectOpacity(page, 1);
  await page.locator('#film-settings-toggle').click();
  await expectOpacity(page, 0);
  await activity(page, touch);
  await expectOpacity(page, 1);
  await page.locator('.film-play-toggle').click();
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).paused)).toBe(true);
  await page.waitForTimeout(3500);
  await expectOpacity(page, 1);
  await page.locator('.film-play-toggle').click();
  await expect.poll(() => video.evaluate(el => !(el as HTMLVideoElement).paused)).toBe(true);
  await page.locator('.film-fullscreen').click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement) || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
  await expectOpacity(page, 0);
  await activity(page, touch);
  await expectOpacity(page, 1);
  await page.locator('.film-next').click();
  await expect(page.locator('.film-player__identity')).toHaveText('Pure Gold');
  await expect(video).toHaveAttribute('data-src', /pure-gold/);
  await expect.poll(() => video.evaluate(el => !(el as HTMLVideoElement).paused && (el as HTMLVideoElement).currentTime > .5), { timeout: 30000 }).toBe(true);
  await page.locator('.film-previous').click();
  await expect(video).toHaveAttribute('data-src', /uno-introduction/);
  await expect(page.locator('.film-player__identity')).toHaveText('Ramsider Uno (Product Introduction)');
  await expect.poll(() => video.evaluate(el => !(el as HTMLVideoElement).paused && (el as HTMLVideoElement).currentTime > .5), { timeout: 30000 }).toBe(true);
  await expectOpacity(page, 0);
  await activity(page, touch);
  await expectOpacity(page, 1);
  await video.evaluate(el => { const v = el as HTMLVideoElement; v.currentTime = v.duration - .3; });
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
  await expect(page.locator('.film-ended')).toBeVisible();
  await expectOpacity(page, 1);
  await close.click();
  await expect(page.locator('#product-film')).not.toBeVisible();
});

test('settings remain open and close remains usable after inactivity', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'The requested matrix uses WebKit and Chromium');
  await openFilm(page);
  await page.locator('#film-settings-toggle').click();
  await expect(page.locator('#film-options-menu')).toBeVisible();
  await page.waitForTimeout(4000);
  await expectOpacity(page, 1);
  await expect(page.locator('#film-options-menu')).toBeVisible();
  await page.locator('.film-player__close').click();
  await expect(page.locator('#product-film')).not.toBeVisible();
});

test('touch on video toggles playback and reveals controls, which hide during playback inactivity', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Touch behavior is checked in mobile WebKit');
  const video = await openFilm(page);
  await expectOpacity(page, 0);
  const box = (await video.boundingBox())!;
  const tap = () => page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await tap();
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).paused)).toBe(true);
  await expectOpacity(page, 1);
  await tap();
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).paused)).toBe(false);
  await expectOpacity(page, 0);
  await tap();
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).paused)).toBe(true);
  await expectOpacity(page, 1);
});

for (const action of ['all', 'close'] as const) {
  test(`invisible ${action} action: first touch reveals and second touch activates`, async ({ page }, info) => {
    test.skip(!info.project.name.includes('iphone'), 'Touch hit testing is checked in mobile WebKit');
    await openFilm(page);
    await expectOpacity(page, 0);
    const target = action === 'all' ? page.locator('.film-player__top button').first() : page.locator('.film-player__close');
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    const point = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
    expect(await page.evaluate(({ x, y }) => !!document.elementFromPoint(x, y)?.closest('.film-player__top'), point)).toBe(false);
    await page.touchscreen.tap(point.x, point.y);
    await expect(page.locator('#product-film')).toBeVisible();
    await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'playing');
    await expectOpacity(page, 1);
    await page.touchscreen.tap(point.x, point.y);
    if (action === 'all') await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'gallery');
    else await expect(page.locator('#product-film')).not.toBeVisible();
  });
}

test('settings keeps cursor visible after inactivity', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Cursor is checked on desktop Chromium');
  await openFilm(page);
  await page.locator('#film-settings-toggle').click();
  await expect(page.locator('#film-options-menu')).toBeVisible();
  await page.waitForTimeout(4000);
  for (const selector of ['#film-player', '.film-transport', '#film-options-menu']) {
    expect(await page.locator(selector).evaluate(el => getComputedStyle(el).cursor), selector).not.toBe('none');
  }
});

test('keyboard focus restores and activates a hidden top action', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Keyboard owner is desktop Chromium');
  await openFilm(page);
  await activity(page, false);
  await expectOpacity(page, 0);
  const all = page.locator('.film-player__top button').first();
  await page.keyboard.press('Tab');
  await all.focus();
  await expect(all).toBeFocused();
  await expect.poll(() => page.locator('.film-player__top').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  await page.keyboard.press('Space');
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'gallery');
});


async function trackMetrics(page: Page, selector: string) {
  return page.locator(selector).evaluate(el => {
    const root = el.shadowRoot!;
    const track = root.querySelector('#track')!;
    const appearance = root.querySelector('#appearance')!;
    const pointer = root.querySelector('#pointer')!;
    const t = getComputedStyle(track), p = getComputedStyle(pointer);
    return { height: appearance.getBoundingClientRect().height, host: getComputedStyle(el).backgroundColor, pointerBackground: p.backgroundColor, pointerBorder: p.borderRightWidth, trackBorder: t.borderTopWidth, trackShadow: t.boxShadow };
  });
}

test('time and volume tracks grow on hover without a rectangular highlight and retain keyboard focus', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Hover and keyboard behavior is checked in Chromium');
  await openFilm(page);
  for (const selector of ['.film-seek', '.film-volume']) {
    await activity(page, false);
    const normal = await trackMetrics(page, selector);
    await page.locator(selector).hover();
    await page.waitForTimeout(300);
    const hover = await trackMetrics(page, selector);
    expect(normal.height).toBeLessThan(hover.height);
    expect(hover.host).toBe('rgba(0, 0, 0, 0)');
    expect(hover.pointerBackground).toBe('rgba(0, 0, 0, 0)');
    expect(hover.pointerBorder).toBe('0px');
    expect(hover.trackBorder).toBe('0px');
    expect(hover.trackShadow).toBe('none');
    const box = await page.locator(selector).boundingBox();
    await page.mouse.move(box!.x + box!.width * .4, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width * .6, box!.y + box!.height / 2, { steps: 3 });
    const drag = await trackMetrics(page, selector);
    expect(drag.height).toBeGreaterThan(normal.height);
    expect(drag.pointerBackground).toBe('rgba(0, 0, 0, 0)');
    await page.mouse.up();
  }
  const seek = page.locator('.film-seek');
  await page.locator('.film-next').focus();
  await page.keyboard.press('Tab'); // Time display precedes seek.
  await page.keyboard.press('Tab');
  await expect.poll(() => seek.evaluate(el => !!el.shadowRoot?.querySelector('input:focus-visible'))).toBe(true);
  const focus = await seek.evaluate(el => {
    const s = getComputedStyle(el);
    return { outline: s.outlineStyle, width: s.outlineWidth, shadow: s.boxShadow };
  });
  expect((focus.outline !== 'none' && focus.width !== '0px') || focus.shadow !== 'none').toBe(true);
});

test('time track grows during a real touch without an added pointer strip', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Real touchscreen interaction is checked in mobile WebKit');
  await openFilm(page);
  await activity(page, true);
  const seek = page.locator('.film-seek');
  const normal = await trackMetrics(page, '.film-seek');
  await seek.evaluate(el => {
    el.addEventListener('pointerdown', () => {
      const root = el.shadowRoot!;
      const appearance = root.querySelector('#appearance')!;
      const pointer = getComputedStyle(root.querySelector('#pointer')!);
      (el as HTMLElement).dataset.touchTrack = JSON.stringify({ height: appearance.getBoundingClientRect().height, pointerBackground: pointer.backgroundColor, pointerBorder: pointer.borderRightWidth });
    }, { once: true });
  });
  const box = await seek.boundingBox();
  await page.touchscreen.tap(box!.x + box!.width * .5, box!.y + box!.height / 2);
  const touch = JSON.parse((await seek.getAttribute('data-touch-track'))!);
  expect(touch.height).toBeGreaterThan(normal.height);
  expect(touch.pointerBackground).toBe('rgba(0, 0, 0, 0)');
  expect(touch.pointerBorder).toBe('0px');
});


test('native controls stay usable if the optional controls chunk is unavailable', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'desktop-chromium'].includes(info.project.name), 'One mobile and one desktop fallback owner');
  const chunks = join(process.cwd(), '.next/static/chunks');
  let controlsChunk = '';
  for (const name of await readdir(chunks)) {
    if (name.endsWith('.js') && (await readFile(join(chunks, name), 'utf8')).includes('film-transport__row')) { controlsChunk = name; break; }
  }
  expect(controlsChunk, 'identify the actual controls chunk in this build').not.toBe('');
  let blocked = 0;
  await page.route(`**/_next/static/chunks/${controlsChunk}`, route => { blocked++; return route.abort(); });
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video');
  await expect.poll(() => video.evaluate(el => !(el as HTMLVideoElement).paused && (el as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
  expect(blocked).toBeGreaterThan(0);
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-controls', 'ready');
  expect(await video.evaluate(el => (el as HTMLVideoElement).controls)).toBe(true);
  await video.evaluate(el => (el as HTMLVideoElement).pause());
  await expect.poll(() => video.evaluate(el => (el as HTMLVideoElement).paused)).toBe(true);
  await page.locator('.film-player__close').click();
  await expect(page.locator('#product-film')).not.toBeVisible();
});

test('loading indicator is shown while media waits and player remains closable', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'desktop-chromium'].includes(info.project.name), 'One mobile and one desktop loading owner');
  const video = await openFilm(page);
  await video.evaluate(el => {
    const v = el as HTMLVideoElement;
    Object.defineProperty(v, 'readyState', { configurable: true, get: () => 1 });
    v.dispatchEvent(new Event('waiting'));
  });
  await expect(page.locator('media-loading-indicator')).toHaveAttribute('medialoading');
  if (await page.locator('#film-player').evaluate(el => el.hasAttribute('userinactive'))) await activity(page, info.project.name.includes('iphone'));
  await expectOpacity(page, 1);
  await page.locator('.film-player__close').click();
  await expect(page.locator('#product-film')).not.toBeVisible();
  await video.evaluate(el => { Reflect.deleteProperty(el, 'readyState'); });
});
