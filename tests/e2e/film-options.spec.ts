import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';
import { filmControlsCopy } from '../../lib/film-controls-copy';
import { productFilmCopy } from '../../lib/product-film';
import { locales } from '../../lib/i18n';

const root = 'screenshots/video/chrome-controls';
test.setTimeout(120000);
test.use({ actionTimeout: 15000 });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus || page.isClosed()) return;
  const state = await page.evaluate(() => {
    const gear = document.querySelector('#film-settings-toggle'), v = document.querySelector('video');
    const parents = []; let e = gear;
    while (e) { const css = getComputedStyle(e); parents.push({ tag: e.tagName, id: e.id, data: { ...((e as HTMLElement).dataset) }, hidden: e.hasAttribute('hidden'), display: css.display, visibility: css.visibility, opacity: css.opacity, box: e.getBoundingClientRect().toJSON() }); e = e.parentElement; }
    return { parents, open: document.querySelector('dialog#product-film')?.hasAttribute('open'), active: document.activeElement?.outerHTML.slice(0, 600), focus: document.hasFocus(), paused: v?.paused, time: v?.currentTime, src: v?.getAttribute('src') };
  }).catch(() => null);
  await info.attach('failed-control-state', { body: JSON.stringify(state, null, 2), contentType: 'application/json' });
});

const gear = (page: Page) => page.locator('#film-settings-toggle');
const menu = (page: Page) => page.locator('#film-options-menu');
const quality = (page: Page, value: string) => page.locator(`#film-quality-options media-chrome-menu-item[value="${value}"]`);
const speed = (page: Page, value: string) => page.locator(`#film-speed-options media-chrome-menu-item[value="${value}"]`);
async function visit(page: Page, locale = 'en') {
  await page.goto(`/${locale}`);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-media-hydrated'));
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  expect(await page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; return m.muted && m.volume === 0; })).toBe(true);
  await page.locator('video').evaluate(v => { (window as unknown as { originalFilm: Element }).originalFilm = v; });
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 25000 }).toBeGreaterThan(.5);
}
async function openMenu(page: Page) {
  if (await gear(page).getAttribute('aria-expanded') !== 'true') await gear(page).click();
  await expect(menu(page)).not.toHaveAttribute('hidden');
  await expect.poll(() => menu(page).evaluate(element => getComputedStyle(element).opacity)).toBe('1');
}
async function pane(page: Page, name: 'quality' | 'speed') {
  await openMenu(page);
  const target = page.locator(`#film-${name}-options`);
  if (await target.getAttribute('hidden') !== null) await page.locator(`.film-menu-${name}`).click();
  await expect(target).not.toHaveAttribute('hidden');
  await expect(target.locator('media-chrome-menu-item').first()).toBeFocused();
}
async function choose(page: Page, value: string) {
  await pane(page, 'quality'); await quality(page, value).click();
  await expect(menu(page)).toHaveAttribute('hidden');
}
async function presented(page: Page, height: number) {
  const video = page.locator('video');
  await expect.poll(() => video.evaluate((v, height) => { const m = v as HTMLVideoElement; return m.videoHeight === height && m.readyState >= 2 && !m.seeking; }, height), { timeout: 25000 }).toBe(true);
  return video.evaluate((v, height) => new Promise<{ width: number; height: number; time: number }>((resolve, reject) => {
    const m = v as HTMLVideoElement;
    const timer = setTimeout(() => reject(Error('No matching presented frame')), 20000);
    const callback: VideoFrameRequestCallback = (_now, frame) => {
      if (frame.height === height && !m.seeking) { clearTimeout(timer); resolve({ width: frame.width, height: frame.height, time: frame.mediaTime }); }
      else m.requestVideoFrameCallback(callback);
    };
    m.requestVideoFrameCallback(callback);
  }), height);
}
async function assertGeometry(page: Page) {
  const boxes = await page.evaluate(() => {
    const p = document.querySelector('#film-player')!, m = document.querySelector('#film-options-menu')!, g = document.querySelector('#film-settings-toggle')!, v = document.querySelector('video')!;
    return { player: p.getBoundingClientRect().toJSON(), menu: m.getBoundingClientRect().toJSON(), gear: g.getBoundingClientRect().toJSON(), range: document.querySelector('.film-seek')!.getBoundingClientRect().toJSON(), video: v.getBoundingClientRect().toJSON(), background: getComputedStyle(m).backgroundColor, radius: getComputedStyle(m).borderRadius, overflow: p.scrollWidth > p.clientWidth, width: innerWidth, dpr: devicePixelRatio, native: v.hasAttribute('controls'), gearIcon: g.querySelector('.film-gear')?.tagName, fullscreen: document.fullscreenElement === p, fullWindow: p.getAttribute('data-full-window') === 'true' };
  });
  expect(boxes.native).toBe(false); expect(boxes.gearIcon).toBe('svg'); expect(boxes.radius).toBe('18px');
  expect(boxes.background).toBe('rgba(24, 24, 28, 0.62)'); expect(boxes.overflow).toBe(false);
  expect(boxes.menu.top).toBeGreaterThanOrEqual(boxes.player.top - 1);
  expect(boxes.menu.bottom).toBeLessThanOrEqual(boxes.player.bottom + 1);
  expect(boxes.menu.right).toBeLessThanOrEqual(boxes.player.right + 1);
  expect(boxes.gear.width).toBeGreaterThanOrEqual(44); expect(boxes.gear.height).toBeGreaterThanOrEqual(44);
  expect(boxes.gear.right).toBeGreaterThan(boxes.player.right - 60);
  expect(boxes.gear.bottom).toBeLessThanOrEqual(boxes.player.bottom + 1);
  expect(boxes.range.bottom).toBeLessThanOrEqual(boxes.player.bottom + 1);
  return boxes;
}

test('QA is silent before Play in fixture and independent contexts', async ({ page, browser }) => {
  const context = await browser.newContext(); await silenceTestMedia(context); const independent = await context.newPage();
  try { for (const target of [page, independent]) { await target.goto('/en'); expect(await target.locator('video').evaluate(v => { const m = v as HTMLVideoElement; return [m.muted, m.defaultMuted, m.volume, m.hasAttribute('src')]; })).toEqual([true, true, 0, false]); } } finally { await context.close(); }
});

test('gear overlay retains the video node, real quality frames, speed, pause, Auto and cleanup', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native mobile and Chromium MSE own quality switching');
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await visit(page); await mkdir(root, { recursive: true });
  expect(await page.locator('video').evaluate(v => v === (window as unknown as { originalFilm: Element }).originalFilm)).toBe(true);
  await pane(page, 'quality');
  expect(await page.locator('#film-quality-options media-chrome-menu-item').evaluateAll(items => items.map(x => x.getAttribute('value')))).toEqual(['auto', '2160', '1440', '1080', '720', '360', '144']);
  await gear(page).click(); await expect(menu(page)).toHaveAttribute('hidden');
  await choose(page, '144'); const low = await presented(page, 144);
  await pane(page, 'speed'); await speed(page, '1.5').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.5);
  await page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; m.pause(); m.currentTime = 12; });
  await expect.poll(() => page.locator('video').evaluate(v => !(v as HTMLVideoElement).seeking)).toBe(true);
  await choose(page, '720');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2);
  expect(await page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; return m.paused && Math.abs(m.currentTime - 12) < .3; })).toBe(true);
  await page.locator('.film-play-toggle').click(); const mid = await presented(page, 720);
  await choose(page, '2160'); const high = await presented(page, 2160);
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(high.time + .5);
  await choose(page, 'auto');
  await expect(page.locator('video')).toHaveAttribute('data-quality-mode', 'auto');
  if (info.project.name.includes('iphone')) await expect(page.locator('video')).toHaveAttribute('src', /master\.m3u8$/);
  else await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoHeight), { timeout: 20000 }).toBeLessThan(2160);
  await openMenu(page); const geometry = await assertGeometry(page);
  await page.waitForTimeout(3500);
  expect(await page.locator('.film-transport').evaluate(e => Number(getComputedStyle(e).opacity))).toBe(1);
  await page.screenshot({ path: `${root}/menu-${info.project.name}.png`, scale: 'css' });
  await writeFile(`${root}/switch-${info.project.name}.json`, JSON.stringify({ low, mid, high, geometry, errors }, null, 2));
  await page.keyboard.press('Escape'); await expect(gear(page)).toBeFocused(); await expect(page.locator('#product-film')).toBeVisible();
  await page.locator('.film-player__top button').last().click(); await expect(page.locator('video')).not.toHaveAttribute('src');
  expect(errors).toEqual([]);
});

test('actual shared fullscreen and forced full-window keep gear, menu and Exit usable', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'One MSE desktop and native phone profiles');
  await mkdir(root, { recursive: true });
  await visit(page);
  await page.locator('.film-fullscreen').click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id === 'film-player' || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
  await openMenu(page); const first = await assertGeometry(page);
  if (info.project.name === 'desktop-chromium') expect(first.fullscreen).toBe(true);
  await page.screenshot({ path: `${root}/fullscreen-${info.project.name}.png`, scale: 'css' });
  await page.keyboard.press('Escape'); await expect(page.locator('#product-film')).toBeVisible();
  await page.locator('.film-fullscreen').click();
  await expect.poll(() => page.evaluate(() => !document.fullscreenElement && !document.querySelector('#film-player')?.hasAttribute('data-full-window'))).toBe(true);
  // Explicit unsupported-API fixture; this is not physical-iPhone proof.
  await page.locator('#film-player').evaluate(host => Object.defineProperty(host, 'requestFullscreen', { configurable: true, value: undefined }));
  await page.locator('.film-fullscreen').click(); await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
  await openMenu(page); await assertGeometry(page);
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window'); await expect(page.locator('#product-film')).toBeVisible();
  await page.locator('.film-fullscreen').click(); await page.locator('#product-film').evaluate((e: HTMLDialogElement) => e.close());
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window'); await expect(page.locator('video')).not.toHaveAttribute('src');
});

test('all locale controls and responsive overlay menus fit without moving the picture', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One 11-locale and responsive owner');
  await mkdir(root, { recursive: true });
  for (const locale of locales) {
    await visit(page, locale); const c = filmControlsCopy(locale);
    await openMenu(page); await expect(gear(page)).toHaveAttribute('aria-label', productFilmCopy[locale].options);
    await expect(menu(page)).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-label', c.fullscreen);
    await expect(page.locator('.film-play-toggle')).toHaveAttribute('aria-label', c.pause);
    await expect(page.locator('.film-mute-toggle')).toHaveAttribute('aria-label', c.unmute);
    await expect(page.locator('.film-menu-pip')).toHaveText(c.pip);
    await assertGeometry(page);
    if (locale === 'ar') await page.screenshot({ path: `${root}/arabic-menu.png`, scale: 'css' });
    await page.keyboard.press('Escape'); await expect(gear(page)).toBeFocused();
    await page.locator('.film-player__top button').last().click();
  }
  for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 874, height: 402 }, { width: 768, height: 1024 }, { width: 1024, height: 600 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(viewport); await visit(page); await openMenu(page); await assertGeometry(page);
    const stageBox = (await page.locator('#film-player').boundingBox())!;
    expect(stageBox.y + stageBox.height).toBeLessThanOrEqual(viewport.height);
    const pipItem = page.locator('.film-menu-pip');
    await pipItem.scrollIntoViewIfNeeded();
    expect(await pipItem.evaluate(item => { const row = item.getBoundingClientRect(), popup = item.closest('media-settings-menu')!.getBoundingClientRect(); return row.top >= popup.top && row.bottom <= popup.bottom; })).toBe(true);
    await pane(page, 'quality'); await quality(page, '144').scrollIntoViewIfNeeded();
    await expect(quality(page, '144')).toBeInViewport();
    await page.screenshot({ path: `${root}/quality-${viewport.width}x${viewport.height}.png`, scale: 'css' });
    await page.keyboard.press('Escape');
    await expect.poll(() => page.locator('.film-menu-quality').evaluate(e => getComputedStyle(e).opacity)).toBe('1');
    await expect.poll(() => menu(page).evaluate(e => getComputedStyle(e.shadowRoot!.querySelector('#container')!).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
    await page.screenshot({ path: `${root}/menu-${viewport.width}x${viewport.height}.png`, scale: 'css' });
    await page.keyboard.press('Escape'); await expect(gear(page)).toBeFocused();
    await page.locator('.film-player__top button').last().click();
  }
});

test('fallback exposes only 720p and pending speed keeps latest choice', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native and MSE fallback owners');
  await visit(page); await pane(page, 'speed');
  await page.evaluate(() => {
    const v = document.querySelector('video')!;
    Object.defineProperty(v, 'error', { configurable: true, value: { code: 3 } }); v.dispatchEvent(new Event('error')); Reflect.deleteProperty(v, 'error');
    document.querySelector<HTMLElement>('#film-speed-options media-chrome-menu-item[value="1.5"]')!.click();
  });
  await expect(page.locator('video')).toHaveAttribute('data-playback', 'mp4-fallback');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(2);
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.5);
  await pane(page, 'quality'); await expect(page.locator('#film-quality-options media-chrome-menu-item')).toHaveCount(1);
  await expect(quality(page, '720')).toHaveAttribute('aria-checked', 'true');
  await page.locator('.film-player__top button').last().click(); await expect(page.locator('video')).not.toHaveAttribute('src');
});

test('rapid quality source changes preserve paused time and reopen has fresh Auto state', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native and MSE lifecycle owners');
  await visit(page, 'ru');
  await page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; m.pause(); m.currentTime = 18; });
  await expect.poll(() => page.locator('video').evaluate(v => !(v as HTMLVideoElement).seeking)).toBe(true);
  await pane(page, 'quality');
  await page.evaluate(() => { for (const value of ['720', '144']) document.querySelector<HTMLElement>(`#film-quality-options media-chrome-menu-item[value="${value}"]`)!.click(); });
  await expect.poll(() => page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; return m.readyState >= 2 && m.paused && Math.abs(m.currentTime - 18) < .3; }), { timeout: 20000 }).toBe(true);
  await choose(page, '2160'); await page.locator('.film-player__top button').last().click();
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click(); await expect(page.locator('video')).toHaveAttribute('data-quality-mode', 'auto');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(.5);
  await page.locator('.film-player__top button').last().click();
});

test('keyboard opens ready-made submenus, selects quality and speed, and restores gear focus', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One real keyboard MSE owner');
  await visit(page); await gear(page).focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.film-menu-quality')).toBeFocused(); await page.keyboard.press('Enter');
  await expect(quality(page, 'auto')).toBeFocused(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  const frame = await presented(page, 2160); expect(frame.height).toBe(2160); await expect(gear(page)).toBeFocused();
  await pane(page, 'quality'); await quality(page, 'auto').focus(); await page.keyboard.press('Space');
  await expect(page.locator('video')).toHaveAttribute('data-quality-mode', 'auto');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).videoHeight), { timeout: 20000 }).toBeLessThan(2160);
  await openMenu(page); await page.locator('.film-menu-speed').focus(); await page.keyboard.press('Enter');
  await speed(page, '1').focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.25);
  await expect(gear(page)).toBeFocused(); await page.locator('.film-player__top button').last().click();
});

test('PiP unsupported and rejected actions are truthful and do not break playback', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One PiP API/rejection owner; physical OS window unverified');
  await page.addInitScript(() => Object.defineProperty(document, 'pictureInPictureEnabled', { configurable: true, get: () => false }));
  await visit(page); await openMenu(page); await expect(page.locator('.film-menu-pip')).toHaveAttribute('disabled');
  await page.locator('video').evaluate(v => {
    Object.defineProperty(document, 'pictureInPictureEnabled', { configurable: true, get: () => true });
    Object.defineProperty(v, 'requestPictureInPicture', { configurable: true, value: () => Promise.reject(new DOMException('QA rejected PiP', 'NotAllowedError')) });
    v.dispatchEvent(new Event('loadedmetadata'));
  });
  await expect(page.locator('.film-menu-pip')).not.toHaveAttribute('disabled'); await page.locator('.film-menu-pip').click();
  await expect(page.locator('.film-control-message')).toHaveText(filmControlsCopy('en').actionError);
  const t = await page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime);
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(t + .5);
  await page.locator('.film-player__top button').last().click();
});

test('failed optional UI upgrade keeps the same native video usable', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One failed-upgrade owner');
  await page.addInitScript(() => {
    const define = customElements.define.bind(customElements);
    customElements.define = (name, constructor, options) => { if (name === 'media-controller') throw Error('QA optional controls unavailable'); return define(name, constructor, options); };
  });
  await page.goto('/en'); await page.waitForFunction(() => document.documentElement.hasAttribute('data-media-hydrated'));
  await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('video').evaluate(v => { (window as unknown as { originalFilm: Element }).originalFilm = v; });
  expect(await page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; return m.muted && m.volume === 0; })).toBe(true);
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(.5);
  expect(await page.locator('video').evaluate(v => (v as HTMLVideoElement).controls && v === (window as unknown as { originalFilm: Element }).originalFilm)).toBe(true);
  await expect(gear(page)).toHaveCount(0); await page.locator('.film-player__top button').last().click();
});

test('ready-made transport buttons seek and adjust volume safely while paused', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One full transport/volume pointer owner');
  await visit(page); await page.locator('.film-play-toggle').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  const range = page.locator('.film-seek'), box = (await range.boundingBox())!;
  await range.click({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect.poll(() => page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; return !m.seeking && m.currentTime > 20 && m.currentTime < 40 && m.paused; })).toBe(true);
  // Any nonzero-volume UI check is done ONLY while paused; restore silence before Play.
  await page.locator('.film-volume').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).volume)).toBeGreaterThan(0);
  await page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; m.volume = 0; m.muted = true; });
  await page.locator('.film-mute-toggle').click();
  // Unmute restores the user's last nonzero volume; it is safe here because playback is paused.
  await expect.poll(() => page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; return m.paused && !m.muted && m.volume > 0; })).toBe(true);
  await page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; m.volume = 0; m.muted = true; });
  await page.locator('.film-play-toggle').click();
  const t = await page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime);
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(t + .5);
  await page.locator('.film-player__top button').last().click();
});

test('fullscreen hotkey uses the shared presentation adapter and rejected pending entry cannot reopen a closed dialog', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One keyboard/pending API owner');
  await visit(page); await page.locator('.film-play-toggle').focus(); await page.keyboard.press('f');
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
  await openMenu(page); await assertGeometry(page); await page.keyboard.press('Escape');
  await page.locator('.film-fullscreen').click();
  await page.locator('#film-player').evaluate(host => Object.defineProperty(host, 'requestFullscreen', { configurable: true, value: () => new Promise<void>((_resolve, reject) => { (window as unknown as { rejectFilmFullscreen: (error: Error) => void }).rejectFilmFullscreen = reject; }) }));
  await page.locator('.film-fullscreen').click();
  await page.locator('#product-film').evaluate((e: HTMLDialogElement) => e.close());
  await page.evaluate(() => (window as unknown as { rejectFilmFullscreen: (error: Error) => void }).rejectFilmFullscreen(Error('QA rejected after close')));
  await expect(page.locator('#product-film')).not.toHaveAttribute('data-film-expanded');
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window'); await expect(page.locator('video')).not.toHaveAttribute('src');
});

test('expanded playback errors expose an in-picture retry and recover on the same video', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'desktop-chromium'].includes(info.project.name), 'One native and one MSE expanded error owner');
  await visit(page); await page.locator('.film-fullscreen').click();
  await page.locator('video').evaluate(v => {
    for (let i = 0; i < 2; i++) { Object.defineProperty(v, 'error', { configurable: true, value: { code: 3 } }); v.dispatchEvent(new Event('error')); Reflect.deleteProperty(v, 'error'); }
  });
  await expect(page.locator('.film-recovery')).toBeVisible(); await expect(page.locator('.film-recovery')).toContainText(productFilmCopy.en.error);
  await page.locator('.film-recovery button').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(.5);
  expect(await page.locator('video').evaluate(v => v === (window as unknown as { originalFilm: Element }).originalFilm)).toBe(true);
  await expect(page.locator('.film-recovery')).toBeHidden();
  await page.locator('.film-fullscreen').click(); await page.locator('.film-player__top button').last().click();
});

test('a PiP request finishing after Close is exited instead of orphaning the player', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One deterministic OS presentation race fixture; not physical PiP proof');
  await visit(page);
  await page.locator('video').evaluate(v => {
    const state = { active: null as Element | null, exits: 0 };
    Object.defineProperty(document, 'pictureInPictureEnabled', { configurable: true, get: () => true });
    Object.defineProperty(document, 'pictureInPictureElement', { configurable: true, get: () => state.active });
    Object.defineProperty(document, 'exitPictureInPicture', { configurable: true, value: async () => { state.active = null; state.exits++; } });
    Object.defineProperty(v, 'requestPictureInPicture', { configurable: true, value: () => new Promise<void>(resolve => { (window as unknown as { finishFilmPip: () => void }).finishFilmPip = () => { state.active = v; resolve(); }; }) });
    (window as unknown as { filmPipState: typeof state }).filmPipState = state;
    v.dispatchEvent(new Event('loadedmetadata'));
  });
  await openMenu(page); await page.locator('.film-menu-pip').click();
  await page.locator('#product-film').evaluate((e: HTMLDialogElement) => e.close());
  await page.evaluate(() => (window as unknown as { finishFilmPip: () => void }).finishFilmPip());
  await expect.poll(() => page.evaluate(() => (window as unknown as { filmPipState: { exits: number } }).filmPipState.exits)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.pictureInPictureElement)).toBeNull(); await expect(page.locator('video')).not.toHaveAttribute('src');
});


test('partially constructed optional widgets retain native controls and disabled gestures', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One partial construction owner');
  await page.addInitScript(() => {
    const define = customElements.define.bind(customElements);
    customElements.define = (name, constructor, options) => define(name, name === 'media-play-button' ? class extends HTMLElement {} : constructor, options);
  });
  await page.goto('/en'); await page.waitForFunction(() => document.documentElement.hasAttribute('data-media-hydrated'));
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('video').evaluate(v => { (window as unknown as { originalFilm: Element }).originalFilm = v; });
  expect(await page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; return m.muted && m.volume === 0; })).toBe(true);
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(.5);
  await page.waitForFunction(() => customElements.get('media-controller') && document.querySelector('media-settings-menu-button')?.shadowRoot);
  expect(await page.locator('video').evaluate(v => (v as HTMLVideoElement).controls && v === (window as unknown as { originalFilm: Element }).originalFilm)).toBe(true);
  await expect(page.locator('#film-player')).toHaveAttribute('gesturesdisabled', '');
  await expect(page.locator('#film-player')).toHaveAttribute('nohotkeys', '');
  await expect(gear(page)).not.toBeVisible(); await page.locator('.film-player__top button').last().click();
});


test('Space activates fullscreen and recovery while pending-rate shortcuts retain intent', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Mobile native and Chromium adapters');
  await visit(page); await page.locator('.film-fullscreen').focus(); await page.keyboard.press('Space');
  await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('video').evaluate(v => !(v as HTMLVideoElement).paused)).toBe(true);
  await page.keyboard.press('Space'); await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed', 'false');
  await pane(page, 'quality'); await page.locator('#film-quality-options .film-menu-back').focus(); await page.keyboard.press('Space');
  await expect(page.locator('#film-quality-options')).toHaveAttribute('hidden'); await expect(menu(page)).not.toHaveAttribute('hidden');
  await pane(page, 'quality');
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#film-quality-options media-chrome-menu-item[value="720"]')!.click();
    const host = document.querySelector('#film-player')!;
    host.dispatchEvent(new KeyboardEvent('keydown', { key: '>', shiftKey: true, bubbles: true }));
    host.dispatchEvent(new KeyboardEvent('keyup', { key: '>', shiftKey: true, bubbles: true }));
  });
  await expect.poll(() => page.locator('video').evaluate(v => { const m = v as HTMLVideoElement; return m.readyState >= 2 && m.playbackRate === 1.25; })).toBe(true);
  await page.locator('.film-play-toggle').focus(); await page.keyboard.press('>');
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).playbackRate)).toBe(1.5);
  await page.locator('video').evaluate(v => { Object.defineProperty(v, 'error', { configurable: true, value: { code: 3 } }); v.dispatchEvent(new Event('error')); v.dispatchEvent(new Event('error')); Reflect.deleteProperty(v, 'error'); });
  const retry = page.locator('.film-recovery button'); await expect(retry).toBeVisible();
  await retry.focus(); await page.keyboard.press('Space');
  await expect(page.locator('.film-recovery')).toBeHidden();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(.5);
  await page.locator('.film-player__top button').last().click();
});

test('a queued old Close cannot collapse a reopened expanded player', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One deterministic queued-close owner');
  await visit(page);
  await page.locator('#film-player').evaluate(host => Object.defineProperty(host, 'requestFullscreen', { configurable: true, value: undefined }));
  await page.locator('.film-fullscreen').click();
  await page.evaluate(() => { const dialog = document.querySelector<HTMLDialogElement>('#product-film')!; dialog.close(); dialog.showModal(); });
  await page.waitForTimeout(100);
  await expect(page.locator('#product-film')).toHaveAttribute('open');
  await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
  await openMenu(page); await assertGeometry(page); await page.keyboard.press('Escape');
  await page.locator('.film-fullscreen').click(); await page.locator('.film-player__top button').last().click();
});


test('an older PiP completion cannot exit a newer reopened presentation', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One deterministic overlapping presentation owner');
  await visit(page);
  await page.locator('video').evaluate(v => {
    const state = { active: null as Element | null, exits: 0, finish: [] as (() => void)[] };
    Object.defineProperty(document, 'pictureInPictureEnabled', { configurable: true, get: () => true });
    Object.defineProperty(document, 'pictureInPictureElement', { configurable: true, get: () => state.active });
    Object.defineProperty(document, 'exitPictureInPicture', { configurable: true, value: async () => { state.active = null; state.exits++; } });
    Object.defineProperty(v, 'requestPictureInPicture', { configurable: true, value: () => new Promise<void>(resolve => { state.finish.push(() => { state.active = v; resolve(); }); }) });
    (window as unknown as { overlappingPip: typeof state }).overlappingPip = state; v.dispatchEvent(new Event('loadedmetadata'));
  });
  await openMenu(page); await page.locator('.film-menu-pip').click(); await page.locator('.film-player__top button').last().click();
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(.5);
  await openMenu(page); await page.locator('.film-menu-pip').click();
  await page.evaluate(async () => { const state = (window as unknown as { overlappingPip: { finish: (() => void)[] } }).overlappingPip; state.finish[1](); await Promise.resolve(); state.finish[0](); });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as unknown as { overlappingPip: { exits: number } }).overlappingPip.exits)).toBe(0);
  await page.locator('.film-player__top button').last().click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { overlappingPip: { exits: number } }).overlappingPip.exits)).toBe(1);
});


test('buffering and recovery remain visible while transport is inactive', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One explicit media-state feedback fixture');
  await visit(page);
  await page.locator('video').evaluate(v => {
    Object.defineProperty(v, 'readyState', { configurable: true, get: () => 1 });
    v.dispatchEvent(new Event('waiting'));
    v.parentElement!.setAttribute('userinactive', '');
  });
  const indicator = page.locator('media-loading-indicator');
  await expect(indicator).toHaveAttribute('noautohide'); await expect(indicator).toHaveAttribute('medialoading');
  await expect.poll(() => indicator.evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  await expect.poll(() => indicator.locator('svg').evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  await page.locator('video').evaluate(v => {
    Reflect.deleteProperty(v, 'readyState');
    Object.defineProperty(v, 'error', { configurable: true, value: { code: 3 } }); v.dispatchEvent(new Event('error')); v.dispatchEvent(new Event('error')); Reflect.deleteProperty(v, 'error');
    v.parentElement!.setAttribute('userinactive', '');
  });
  await expect(page.locator('.film-recovery')).toBeVisible();
  await expect.poll(() => page.locator('.film-recovery').evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  await page.locator('.film-player__top button').last().click();
});
