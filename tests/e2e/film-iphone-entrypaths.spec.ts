import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';
import { revealFilmTop } from './film-reveal-top';

type Probe = { enters: number; exits: number; active: boolean; element: number; begin: () => void; end: () => void };
const root = 'screenshots/video/iphone-entrypaths';
function rotated(info: TestInfo) { const v = info.project.use.viewport!; return { width: v.height, height: v.width }; }
const host = (page: Page) => page.locator('#film-player');
const full = (page: Page) => page.locator('.film-fullscreen');
const pageErrors = new WeakMap<Page, string[]>();
const native = (page: Page) => page.evaluate(() => {
  const p = (window as unknown as { entryProbe: Probe }).entryProbe;
  return { enters: p.enters, exits: p.exits, active: p.active, element: p.element };
});
async function identity(page: Page) {
  return page.locator('video').evaluate((v: HTMLVideoElement) => ({ src: v.currentSrc, time: v.currentTime, muted: v.muted, volume: v.volume }));
}
async function rotate(page: Page, size: { width: number; height: number }) {
  await page.setViewportSize(size);
  // A physical orientation has a rendered intermediate state; allow its media-query event to run.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function seek(page: Page, time: number) {
  await page.locator('video').evaluate((v: HTMLVideoElement, t) => { v.pause(); v.currentTime = t; }, time);
  await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => !v.seeking && v.readyState >= 2 && v.videoWidth > 0), { timeout: 30000 }).toBe(true);
}
async function open(page: Page, index = 3, query = '') {
  await page.goto(`/en${query}`);
  await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click();
  await page.locator('.film-gallery__item').nth(index).click(); await page.locator('.film-gallery__hero').click();
  await expect(host(page)).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.evaluate(() => {
    const v = document.querySelector('video')!, h = document.querySelector('#film-player')!;
    const p: Probe = { enters: 0, exits: 0, active: false, element: 0, begin: () => {}, end: () => {} };
    p.begin = () => { p.active = true; v.dispatchEvent(new Event('webkitbeginfullscreen')); };
    p.end = () => { p.active = false; p.exits++; v.dispatchEvent(new Event('webkitendfullscreen')); };
    Object.defineProperties(v, {
      webkitSupportsFullscreen: { configurable: true, value: true }, webkitDisplayingFullscreen: { configurable: true, get: () => p.active },
      webkitEnterFullscreen: { configurable: true, value: () => { p.enters++; p.begin(); } }, webkitExitFullscreen: { configurable: true, value: p.end },
    });
    for (const name of ['requestFullscreen', 'webkitRequestFullscreen']) Object.defineProperty(h, name, { configurable: true, value: () => { p.element++; throw new Error('Unexpected element fullscreen on iPhone'); } });
    Object.assign(window, { entryProbe: p, entryVideo: v });
  });
}
async function windowMode(page: Page, expected = true) {
  if (expected) await expect(host(page)).toHaveAttribute('data-full-window', 'true');
  else await expect(host(page)).not.toHaveAttribute('data-full-window');
  expect(await page.locator('video').evaluate(v => v === (window as unknown as { entryVideo: Element }).entryVideo)).toBe(true);
}
async function menu(page: Page) {
  await page.locator('.film-options__trigger').click();
  await expect.poll(() => page.locator('.film-settings').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await page.locator('.film-settings').evaluate(async el => { await Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))); });
}

test.use({ serviceWorkers: 'block', actionTimeout: 15000 });
test.setTimeout(180000);
test.beforeEach(async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Unadapted mobile WebKit/DPR3; native API is an intent probe, not AVKit proof');
  const errors: string[] = []; pageErrors.set(page, errors); page.on('pageerror', e => errors.push(e.message));
  await silenceTestMedia(page); await mkdir(root, { recursive: true });
});
test.afterEach(async ({ page }, info) => {
  if (!info.project.name.includes('iphone')) return;
  const errors = pageErrors.get(page) ?? [];
  await writeFile(`${root}/${info.project.name}-${info.line}-errors.json`, JSON.stringify({ title: info.title, errors }, null, 2));
  expect(errors).toEqual([]);
});

test('original customer button, keyboard and Media Chrome requests share own presentation', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await open(page); await seek(page, 14); const before = await identity(page);
  const rect = await full(page).boundingBox(); expect(rect).not.toBeNull();
  await page.touchscreen.tap(rect!.x + rect!.width / 2, rect!.y + rect!.height / 2); await windowMode(page);
  expect(await identity(page)).toEqual(before); await page.screenshot({ path: `${root}/${info.project.name}-manual-portrait.png` });
  await rotate(page, rotated(info)); await windowMode(page);
  await page.screenshot({ path: `${root}/${info.project.name}-manual-landscape.png` });
  await rotate(page, info.project.use.viewport!); await windowMode(page);
  await full(page).focus(); await page.keyboard.press('Space'); await windowMode(page, false);
  await page.keyboard.press('Enter'); await windowMode(page); await expect(full(page)).toBeFocused();
  await page.keyboard.press('Escape'); await windowMode(page, false);
  await page.locator('video').focus(); await page.keyboard.press('f'); await windowMode(page);
  await page.keyboard.press('f'); await windowMode(page, false);
  await host(page).dispatchEvent('mediaenterfullscreenrequest'); await windowMode(page);
  await host(page).dispatchEvent('mediaexitfullscreenrequest'); await windowMode(page, false);
  expect(await native(page)).toEqual({ enters: 0, exits: 0, active: false, element: 0 }); expect(errors).toEqual([]);
});

test('rotation enters own mode, restores portrait and respects explicit exit and closed gallery', async ({ page }, info) => {
  await open(page); await seek(page, 14); const before = await identity(page);
  const portrait = info.project.use.viewport!;
  for (let i = 0; i < 2; i++) {
    await rotate(page, i === 0 ? rotated(info) : { width: 844, height: 390 }); await windowMode(page); expect(await identity(page)).toEqual(before);
    await page.screenshot({ path: `${root}/${info.project.name}-auto-${i}.png` });
    await rotate(page, portrait); await windowMode(page, false);
  }
  await rotate(page, rotated(info)); await windowMode(page);
  await full(page).click(); await windowMode(page, false);
  await rotate(page, { width: 844, height: 300 }); await windowMode(page, false);
  await page.locator('video').evaluate(v => v.dispatchEvent(new Event('playing'))); await windowMode(page, false);
  await rotate(page, portrait); await windowMode(page, false);
  await rotate(page, rotated(info)); await windowMode(page);
  await revealFilmTop(page); await page.locator('.film-player__close').click(); await windowMode(page, false);
  await rotate(page, portrait); await rotate(page, rotated(info)); await windowMode(page, false);
  await page.locator('#film-play').click(); await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'gallery'); await windowMode(page, false);
  await page.locator('.film-gallery__hero').click(); await windowMode(page);
  expect((await native(page)).enters).toBe(0); expect((await native(page)).element).toBe(0);
});

test('all seven films keep decoded playback and own controls across both original paths', async ({ page }, info) => {
  await open(page, 0); const records = [];
  for (let index = 0; index < 7; index++) {
    await rotate(page, info.project.use.viewport!);
    if (index) {
      await revealFilmTop(page); await page.locator('.film-player__list-toggle').click();
      await page.locator('.film-playlist__item').nth(index).click(); await page.locator('.film-playlist__item').nth(index).click();
    }
    await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
    await seek(page, index === 1 ? 5 : 10); const before = await identity(page);
    await page.locator('video').evaluate((v: HTMLVideoElement) => v.play());
    await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(before.time + .15);
    await seek(page, index === 1 ? 5 : 10);
    if (await host(page).getAttribute('data-full-window')) { await full(page).click(); await windowMode(page, false); }
    if (index % 2) await rotate(page, rotated(info));
    else { await full(page).click(); await rotate(page, rotated(info)); }
    await windowMode(page);
    const g = await page.locator('video').evaluate((v: HTMLVideoElement) => {
      const b = v.closest('media-controller')!.getBoundingClientRect(), r = v.getBoundingClientRect();
      return { id: v.closest('media-controller')!.getAttribute('data-film-id'), decoded: [v.videoWidth, v.videoHeight], fit: getComputedStyle(v).objectFit, host: b.toJSON(), video: r.toJSON(), viewport: [innerWidth, innerHeight], src: v.currentSrc };
    });
    expect(g.fit).toBe('cover'); expect(g.decoded[0]).toBeGreaterThan(0); expect(g.host.width).toBe(rotated(info).width); expect(g.host.height).toBe(rotated(info).height);
    expect(g.video.left).toBeLessThanOrEqual(1); expect(g.video.right).toBeGreaterThanOrEqual(rotated(info).width - 1);
    expect(g.video.top).toBeLessThanOrEqual(1); expect(g.video.bottom).toBeGreaterThanOrEqual(rotated(info).height - 1);
    await page.screenshot({ path: `${root}/${info.project.name}-film${index + 1}.png` }); records.push(g);
    if (index === 2) { await seek(page, 109); await page.screenshot({ path: `${root}/${info.project.name}-evolution-end.png` }); }
  }
  expect((await native(page)).enters).toBe(0); expect((await native(page)).element).toBe(0);
  await writeFile(`${root}/${info.project.name}-films.json`, JSON.stringify(records, null, 2));
});

for (const url of [false, true]) test(`explicit native ${url ? 'URL' : 'menu'} remains reversible and rotation never interrupts it`, async ({ page }, info) => {
  await open(page, 2, url ? '?iphonePlayer=native' : ''); await seek(page, 10); const before = await identity(page);
  if (url) await full(page).click();
  else { await full(page).click(); await menu(page); await page.locator('.film-menu-native').click(); }
  expect((await native(page)).enters).toBe(1); await windowMode(page, false);
  await rotate(page, rotated(info)); await windowMode(page, false); expect((await native(page)).active).toBe(true);
  expect(await identity(page)).toEqual(before);
  await page.evaluate(() => (window as unknown as { entryProbe: Probe }).entryProbe.end()); await windowMode(page, false);
  await rotate(page, info.project.use.viewport!); await rotate(page, rotated(info));
  await windowMode(page, !url); expect((await native(page)).enters).toBe(1);
  if (url) { await full(page).click(); expect((await native(page)).enters).toBe(2); }
});

test('unrequested native presentation returns to own mode and cannot resurrect a closed viewer', async ({ page }) => {
  await open(page); await seek(page, 14); const before = await identity(page);
  await page.evaluate(() => (window as unknown as { entryProbe: Probe }).entryProbe.begin());
  await windowMode(page); expect(await identity(page)).toEqual(before); expect((await native(page)).active).toBe(false);
  await full(page).click(); await windowMode(page, false);
  await page.evaluate(() => (window as unknown as { entryProbe: Probe }).entryProbe.begin());
  await windowMode(page, false); expect((await native(page)).active).toBe(false);
  await full(page).click(); await windowMode(page);
  await page.locator('#product-film').evaluate((d: HTMLDialogElement) => d.close());
  await page.evaluate(() => (window as unknown as { entryProbe: Probe }).entryProbe.begin());
  await windowMode(page, false); expect((await native(page)).active).toBe(false);
  await expect(page.locator('#product-film')).not.toHaveAttribute('open');
});

test('PiP remains explicit and rotation does not take it over', async ({ page }, info) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'pictureInPictureEnabled', { configurable: true, value: false });
    Object.defineProperty(HTMLVideoElement.prototype, 'webkitSupportsPresentationMode', { configurable: true, value: () => true });
    Object.defineProperty(HTMLVideoElement.prototype, 'webkitSetPresentationMode', { configurable: true, value: function(this: HTMLVideoElement, mode: string) { Object.defineProperty(this, 'webkitPresentationMode', { configurable: true, value: mode }); this.dispatchEvent(new Event('webkitpresentationmodechanged')); } });
  });
  await open(page); await full(page).click(); await menu(page); await page.locator('.film-menu-pip').click(); await windowMode(page, false);
  await rotate(page, rotated(info)); await windowMode(page, false);
  await page.evaluate(() => (window as unknown as { entryProbe: Probe }).entryProbe.begin());
  await windowMode(page, false); expect((await native(page)).active).toBe(false);
  expect(await page.locator('video').evaluate(v => (v as HTMLVideoElement & { webkitPresentationMode: string }).webkitPresentationMode)).toBe('picture-in-picture');
  await full(page).click(); await windowMode(page);
  await rotate(page, info.project.use.viewport!); await windowMode(page);
  expect((await native(page)).enters).toBe(0);
});

test('short landscape has reachable gold controls and explicit fallback under safe insets', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page);
  await rotate(page, { width: 568, height: 220 }); await windowMode(page);
  await page.addStyleTag({ content: '.film-player[data-full-window] .film-player__top{padding-inline:40px!important}.film-player[data-full-window] .film-transport{padding:0 40px 21px!important}' });
  for (const selector of ['.film-fullscreen', '.film-options__trigger', '.film-player__close']) {
    const r = await page.locator(selector).boundingBox(); expect(r).not.toBeNull(); expect(r!.width).toBeGreaterThanOrEqual(44); expect(r!.height).toBeGreaterThanOrEqual(44);
    expect(r!.x).toBeGreaterThanOrEqual(0); expect(r!.y).toBeGreaterThanOrEqual(0); expect(r!.x + r!.width).toBeLessThanOrEqual(569); expect(r!.y + r!.height).toBeLessThanOrEqual(221);
  }
  await menu(page); await page.locator('.film-menu-native').scrollIntoViewIfNeeded();
  expect(await page.locator('.film-menu-native').evaluate(el => { const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return el === hit || el.contains(hit); })).toBe(true);
  await page.screenshot({ path: `${root}/${info.project.name}-short-menu.png` }); await page.locator('.film-menu-native').click(); expect((await native(page)).enters).toBe(1);
});
