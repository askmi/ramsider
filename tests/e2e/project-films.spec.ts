import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';
import { revealFilmTop } from './film-reveal-top';

const root = process.env.PROJECT_FILM_CAPTURE_DIR ?? 'screenshots/video/projects/rev/browser';
const ids = ['project-ramsider-overview', 'project-ramsider-asmohookah', 'project-ramsider-sosuda', 'project-ramsider-cubos', 'project-ramsmobile-protos', 'project-ramsmobile-rev', 'project-ramswear'];
const entries = [['ramsider', 0], ['ramsmobile', 4], ['ramswear', 6]] as const;
const media = (page: Page) => page.locator('#product-film video');
async function enter(page: Page, project: string) {
  await page.locator(`#project-${project}`).scrollIntoViewIfNeeded();
  await page.locator(`#project-${project}`).click();
  await expect(page.locator('#product-film')).toBeVisible();
}
async function close(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.locator('#product-film')).not.toBeVisible();
}
async function decoded(page: Page) {
  await expect.poll(() => media(page).evaluate((v: HTMLVideoElement) => v.currentTime > .15 && v.videoWidth > 0 && v.readyState >= 2 && !v.error), { timeout: 45000 }).toBe(true);
  expect(await media(page).evaluate((v: HTMLVideoElement) => new Promise<boolean>(resolve => {
    const timer = setTimeout(() => resolve(false), 15000);
    v.requestVideoFrameCallback((_now, frame) => { clearTimeout(timer); resolve(frame.width > 0 && frame.height > 0); });
  }))).toBe(true);
}
async function top(page: Page) {
  if (await page.locator('.film-player__list-toggle').evaluate(el => getComputedStyle(el).pointerEvents !== 'none' && !el.closest('#film-player')!.hasAttribute('userinactive') && Number(getComputedStyle(el.parentElement!).opacity) === 1)) return;
  await revealFilmTop(page);
}

test.use({ serviceWorkers: 'block', actionTimeout: 20000 });
test.setTimeout(240000);
test.beforeEach(async ({ page }) => { await silenceTestMedia(page); await mkdir(root, { recursive: true }); });

test('original project card selects matching film in isolated collection and restores original gallery', async ({ page }, info) => {
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/\/films\/project-/.test(r.url())) requests.push(r.url()); });
  await page.goto('/en');
  expect(await page.evaluate(() => innerWidth)).toBe(info.project.use.viewport!.width);
  if (info.project.name.includes('iphone')) expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
  for (const [project, selected] of entries) {
    await enter(page, project);
    await expect(page.locator('.film-gallery__item')).toHaveCount(7);
    await expect(page.locator('.film-gallery__item').nth(selected)).toHaveAttribute('aria-pressed', 'true');
    const visibility = await page.locator('.film-gallery__item').nth(selected).evaluate(el => { const item = el.getBoundingClientRect(), list = el.closest('.film-gallery__list')!.getBoundingClientRect(); return { left: item.left >= list.left - 1, right: item.right <= list.right + 1 }; });
    expect(visibility).toEqual({ left: true, right: true });
    await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', ids[selected]);
    await expect(media(page)).not.toHaveAttribute('src');
    expect(requests, 'No project media before Play').toEqual([]);
    await page.locator('.film-gallery__hero img').evaluate((im: HTMLImageElement) => im.decode());
    const poster = await page.locator('.film-gallery__hero img').evaluate((im: HTMLImageElement) => ({ w: im.naturalWidth, h: im.naturalHeight, ratio: getComputedStyle(im.parentElement!).aspectRatio }));
    expect(poster.w).toBe(1280); expect(poster.h).toBe(720);
    const [ratioWidth, ratioHeight] = poster.ratio.split('/').map(Number); expect(ratioWidth / ratioHeight).toBeCloseTo(16 / 9, 4);
    await page.screenshot({ path: `${root}/${info.project.name}-${project}-selected.png` });
    await close(page); await expect(page.locator(`#project-${project}`)).toBeFocused();
  }
  await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click();
  await expect(page.locator('.film-gallery__item')).toHaveCount(7);
  await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', 'uno-introduction');
  await page.locator('.film-gallery__item').nth(2).click(); await close(page);
  await enter(page, 'ramswear'); await close(page);
  await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click();
  await expect(page.locator('.film-gallery__item')).toHaveCount(7);
  await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', 'evolution');
  await page.locator('.film-gallery__hero').click(); await decoded(page);
  await expect(media(page)).toHaveAttribute('data-src', /\/films\/evolution\/und-v1\/master.m3u8$/);
  await expect(page.locator('#film-player')).toHaveAttribute('data-qualities', '[144,360,720,1080]');
  await top(page); await page.locator('.film-player__close').click();
  await page.locator('#project-ramsfood').scrollIntoViewIfNeeded(); await page.locator('#project-ramsfood').click();
  await expect(page.locator('#project-detail-4')).toBeVisible();
  await page.keyboard.press('Escape'); expect(errors).toEqual([]);
});

test('all seven project films decode, seek, play in portrait/fullscreen and release same shared video', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/en'); await enter(page, 'ramsider');
  await page.evaluate(() => { Object.assign(window, { projectVideo: document.querySelector('#product-film video') }); });
  for (let i = 0; i < ids.length; i++) {
    if (i > 0) { await top(page); await page.locator('.film-player__close').click(); await enter(page, 'ramsider'); await page.locator('.film-gallery__item').nth(i).click(); }
    await page.locator('.film-gallery__hero').click();
    await decoded(page);
    await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
    await expect(media(page)).toHaveAttribute('data-src', new RegExp(`/films/${ids[i]}/und-v1/master.m3u8$`));
    expect(await media(page).evaluate(v => v === (window as unknown as { projectVideo: Element }).projectVideo)).toBe(true);
    await media(page).evaluate((v: HTMLVideoElement) => { v.currentTime = Math.min(10, v.duration / 2); });
    await expect.poll(() => media(page).evaluate((v: HTMLVideoElement) => !v.seeking && v.readyState >= 2), { timeout: 30000 }).toBe(true);
    if (info.project.name.includes('iphone')) {
      const before = await media(page).evaluate((v: HTMLVideoElement) => { v.pause(); return { src: v.currentSrc, time: v.currentTime }; });
      await page.locator('.film-fullscreen').click();
      await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
      expect(await media(page).evaluate((v: HTMLVideoElement) => ({ src: v.currentSrc, time: v.currentTime }))).toEqual(before);
      await page.screenshot({ path: `${root}/${info.project.name}-${ids[i]}-manual-portrait.png` });
      await page.keyboard.press('Escape'); await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
      await media(page).evaluate((v: HTMLVideoElement) => v.play());
      await page.setViewportSize({ width: info.project.use.viewport!.height, height: info.project.use.viewport!.width });
      await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
    } else { await page.locator('.film-fullscreen').click(); await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true); }
    await top(page); await page.screenshot({ path: `${root}/${info.project.name}-${ids[i]}-expanded.png` });
    await top(page);
    await page.locator('.film-player__list-toggle').click();
    await expect(page.locator('.film-playlist__item')).toHaveCount(7);
    await expect(page.locator('.film-playlist__item').nth(i)).toHaveAttribute('aria-current', 'true');
    await page.locator('.film-playlist__item img').evaluateAll(images => Promise.all(images.map(im => (im as HTMLImageElement).decode())));
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await page.screenshot({ path: `${root}/${info.project.name}-${ids[i]}-list.png` });
    await page.keyboard.press('Escape');
    if (info.project.name.includes('iphone')) {
      await page.setViewportSize(info.project.use.viewport!);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
    } else await page.keyboard.press('Escape');
    await top(page);
    if (info.project.name.includes('iphone')) { await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window'); await expect.poll(() => media(page).evaluate(v => getComputedStyle(v).objectFit)).toBe('contain'); }
    await page.screenshot({ path: `${root}/${info.project.name}-${ids[i]}-portrait.png` });
    await expect(page.locator('#film-player')).toHaveAttribute('data-qualities', '[144,360,720,1080,1440,2160]');
    await media(page).evaluate((v: HTMLVideoElement) => { v.currentTime = v.duration - .6; return v.play(); });
    await expect.poll(() => media(page).evaluate((v: HTMLVideoElement) => v.ended), { timeout: 30000 }).toBe(true);
    await expect(page.locator('.film-ended__replay')).toBeVisible();
    await page.locator('.film-ended__replay').click(); await decoded(page);
  }
  await top(page); await page.locator('.film-player__close').click();
  await expect.poll(() => media(page).evaluate((v: HTMLVideoElement) => v.paused && !v.hasAttribute('src') && v.readyState === 0)).toBe(true);
  await expect(page.locator('#project-ramsider')).toBeFocused();
  expect(errors).toEqual([]);
  await writeFile(`${root}/${info.project.name}-seven-project-films.json`, JSON.stringify({ ids, errors, decoded: true, note: 'WebKit emulation / actual Chromium element fullscreen; no physical iOS claim' }, null, 2));
});

test('project preview and full-height playlist adapt to short, narrow and wide windows', async ({ page }, info) => {
  test.skip(info.project.name.includes('iphone'), 'Representative extra sizes on Chromium; required mobile screenshots in other tests');
  await page.goto('/en');
  for (const size of [{width:320,height:640},{width:402,height:650},{width:768,height:1024},{width:874,height:402},{width:1440,height:900}]) {
    await page.setViewportSize(size); await enter(page, 'ramswear');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const bounds = await page.locator('.film-gallery__hero').boundingBox(); expect(bounds!.x).toBeGreaterThanOrEqual(0); expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(size.width + 1);
    await page.screenshot({ path: `${root}/${size.width}x${size.height}-preview.png` });
    await close(page);
  }
});


test('project controls retain quality, speed, playlist navigation, retry and cleanup', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/en'); await enter(page, 'ramswear');
  const fail = async (route: import('@playwright/test').Route) => route.abort();
  await page.route('**/films/project-ramswear/und-v1/**', fail);
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('.film-recovery button')).toBeVisible({ timeout: 45000 });
  await page.screenshot({ path: `${root}/${info.project.name}-error.png` });
  await page.unroute('**/films/project-ramswear/und-v1/**', fail);
  await page.locator('.film-recovery button').click(); await decoded(page);
  const pane = async (name: 'quality' | 'speed') => {
    await page.locator('.film-options__trigger').click();
    await expect.poll(() => page.locator('#film-options-menu').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    await page.locator(`.film-menu-${name}`).click();
    await expect(page.locator(`#film-${name}-options`)).not.toHaveAttribute('hidden');
  };
  for (const height of [144, 720, 2160]) {
    await pane('quality'); await page.locator(`#film-quality-options media-chrome-menu-item[value="${height}"]`).click();
    await expect.poll(() => media(page).evaluate((v: HTMLVideoElement) => v.videoHeight), { timeout: 30000 }).toBe(height);
    await decoded(page);
  }
  await pane('speed'); await page.locator('#film-speed-options media-chrome-menu-item[value="1.5"]').click();
  expect(await media(page).evaluate((v: HTMLVideoElement) => v.playbackRate)).toBe(1.5);
  await page.locator('.film-fullscreen').click();
  if (info.project.name.includes('iphone')) await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
  else await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await top(page); await page.locator('.film-player__list-toggle').click();
  await page.locator('.film-playlist__item').nth(3).click(); await page.locator('.film-playlist__item').nth(3).click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', ids[3]); await decoded(page);
  await page.locator('.film-previous').click(); await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', ids[2]); await decoded(page);
  await page.locator('.film-next').click(); await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', ids[3]); await decoded(page);
  await page.screenshot({ path: `${root}/${info.project.name}-expanded-navigation.png` });
  await top(page); await page.locator('.film-player__close').click();
  await expect.poll(() => media(page).evaluate((v: HTMLVideoElement) => v.paused && !v.hasAttribute('src') && v.readyState === 0)).toBe(true);
  expect(errors).toEqual([]);
});

test('new project film keeps reversible iPhone native fullscreen action on same media', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'iPhone native API intent probe; not AVKit verification');
  for (const query of ['', '?iphonePlayer=native']) {
  await page.goto(`/en${query}`); await enter(page, 'ramswear');
  await page.locator('.film-gallery__hero').click(); await decoded(page);
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await media(page).evaluate((v: HTMLVideoElement) => {
    Object.assign(window, { nativeCount: 0, nativeVideo: v });
    Object.defineProperty(v, 'webkitSupportsFullscreen', { configurable: true, value: true });
    Object.defineProperty(v, 'webkitEnterFullscreen', { configurable: true, value: () => { (window as unknown as {nativeCount: number}).nativeCount++; v.dispatchEvent(new Event('webkitbeginfullscreen')); } });
  });
  if (query) await page.locator('.film-fullscreen').click();
  else { await page.locator('.film-options__trigger').click(); await expect.poll(() => page.locator('#film-options-menu').evaluate(el => getComputedStyle(el).opacity)).toBe('1'); await page.locator('.film-menu-native').click(); }
  expect(await page.evaluate(() => (window as unknown as {nativeCount: number}).nativeCount)).toBe(1);
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
  expect(await media(page).evaluate(v => v === (window as unknown as {nativeVideo: Element}).nativeVideo)).toBe(true);
  await media(page).evaluate(v => v.dispatchEvent(new Event('webkitendfullscreen')));
  await top(page); await page.locator('.film-player__close').click();
  }
});

test('compiled eleven-locale project collection preserves translated labels and Arabic RTL', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit' || Boolean(process.env.PUBLIC_PROJECT_TESTS), 'One local production static-locale fixture owner; public presentation redirects to English');
  const { readFile } = await import('node:fs/promises');
  const { locales } = await import('../../lib/i18n');
  const { projectFilmCopy } = await import('../../lib/project-film-copy');
  const checks = [];
  for (const locale of locales) {
    const html = await readFile(`.next/server/app/${locale}.html`, 'utf8');
    const pattern = `**/${locale}`;
    await page.route(pattern, route => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
    await page.goto(`/${locale}`); await enter(page, 'ramswear');
    await expect(page.locator('#product-film')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator('#product-film-title')).toHaveText(`RAMSWEAR — ${projectFilmCopy[locale].teaser}`);
    await expect(page.locator('.film-gallery__item')).toHaveCount(7);
    await expect(page.locator('.film-gallery__item').nth(5)).toContainText(`RAMSMOBILE — ${projectFilmCopy[locale].shortFilm}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = await page.locator('.film-gallery__hero').boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(403);
    if (locale === 'ar') await page.screenshot({ path: `${root}/arabic-static-fixture.png` });
    checks.push({ locale, dir: locale === 'ar' ? 'rtl' : 'ltr', selected: ids[6], count: 7 });
    await close(page); await page.unroute(pattern);
  }
  await writeFile(`${root}/compiled-locale-fixtures.json`, JSON.stringify({ checks, scope: 'Actual compiled SSG pages via route fixture; active public presentation still redirects non-English to English' }, null, 2));
});


test('quick close and re-entry cannot let delayed project source override new selection', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/en');
  await page.route('**/films/project-ramsmobile-protos/und-v1/master.m3u8', async route => { await new Promise(resolve => setTimeout(resolve, 800)); await route.continue().catch(() => {}); });
  for (let i = 0; i < 3; i++) {
    await enter(page, 'ramsmobile'); await page.locator('.film-gallery__hero').click();
    await close(page);
    await enter(page, 'ramswear');
    await expect(page.locator('.film-gallery__item').nth(6)).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.film-gallery__hero').click(); await decoded(page);
    await expect(media(page)).toHaveAttribute('data-src', /\/films\/project-ramswear\/und-v1\/master.m3u8$/);
    await top(page); await page.locator('.film-player__close').click();
  }
  await writeFile(`${root}/${info.project.name}-rapid-reentry.json`, JSON.stringify({ cycles: 3, errors, selected: ids[6] }, null, 2));
  expect(errors).toEqual([]);
});

test('closing an early project session resumes only original gallery startup cache', async ({ browser }, info) => {
  test.skip(info.project.name === 'desktop-firefox', 'Native mobile and MSE Chromium cache owners');
  const profile = info.project.use;
  const context = await browser.newContext({ baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000', userAgent: profile.userAgent, viewport: profile.viewport, deviceScaleFactor: profile.deviceScaleFactor, isMobile: profile.isMobile, hasTouch: profile.hasTouch, serviceWorkers: 'allow' });
  await silenceTestMedia(context);
  const page = await context.newPage(), projectRequests: string[] = [];
  page.on('request', r => { if (r.url().includes('/films/project-')) projectRequests.push(r.url()); });
  await page.goto('/en'); await enter(page, 'ramswear');
  await close(page);
  await expect(media(page)).toHaveAttribute('data-preload', 'ready', { timeout: 60000 });
  const files = await page.evaluate(async () => (await (await caches.open('film-start-v1')).keys()).map(k => new URL(k.url).pathname));
  expect(files).toHaveLength(42); expect(files.some(path => path.includes('/project-'))).toBe(false);
  expect(projectRequests).toEqual([]);
  await enter(page, 'ramswear'); await page.locator('.film-gallery__hero').click(); await decoded(page);
  expect(projectRequests.length).toBeGreaterThan(0);
  await top(page); await page.locator('.film-player__close').click();
  const after = await page.evaluate(async () => (await (await caches.open('film-start-v1')).keys()).map(k => new URL(k.url).pathname));
  expect(after).toHaveLength(42); expect(after.some(path => path.includes('/project-'))).toBe(false);
  await context.close();
});

test('Android identity uses MSE and actual element fullscreen for the same project collection', async ({ browser }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One actual Chromium Android-identity emulator owner; not physical Android');
  const context = await browser.newContext({ baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000', viewport: { width: 393, height: 873 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' });
  await silenceTestMedia(context); const page = await context.newPage(), errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/en'); await enter(page, 'ramsmobile'); await page.locator('.film-gallery__hero').click(); await decoded(page);
  await expect(media(page)).toHaveAttribute('data-playback', 'mse-hls');
  await page.locator('.film-fullscreen').click(); await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { mobile: true, width: 873, height: 393, deviceScaleFactor: 3, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
  expect(await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual({ width: 873, height: 393 });
  await top(page);
  const androidState = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio, fullscreen: document.fullscreenElement?.id, player: document.querySelector('#film-player')!.getBoundingClientRect().toJSON() }));
  expect(androidState.width).toBe(873); expect(androidState.height).toBe(393); expect(androidState.fullscreen).toBe('film-player');
  const frame = Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })).data, 'base64');
  expect(frame.readUInt32BE(16)).toBe(2619); expect(frame.readUInt32BE(20)).toBe(1179);
  await writeFile(`${root}/android-identity-expanded.png`, frame);
  await writeFile(`${root}/android-identity-state.json`, JSON.stringify(androidState, null, 2));
  await page.locator('.film-next').click(); await decoded(page); await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', ids[5]);
  expect(await page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
  await top(page); await page.locator('.film-player__close').click(); await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  await expect(media(page)).not.toHaveAttribute('src'); expect(errors).toEqual([]);
  await context.close();
});

test('new RAMSMOBILE short film keeps full poster, presented qualities and adjacent films', async ({ page }, info) => {
  await page.goto('/en'); await enter(page, 'ramsmobile');
  await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', 'project-ramsmobile-protos');
  await page.locator('.film-gallery__item').nth(5).click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', 'project-ramsmobile-rev');
  await expect(page.locator('#product-film-title')).toHaveText('RAMSMOBILE — Short Film');
  const image = page.locator('.film-gallery__hero img'); await image.evaluate((im: HTMLImageElement) => im.decode());
  const geometry = await image.evaluate((im: HTMLImageElement) => { const r = im.getBoundingClientRect(); return { width: r.width, height: r.height, naturalWidth: im.naturalWidth, naturalHeight: im.naturalHeight }; });
  expect(geometry.naturalWidth).toBe(1280); expect(geometry.naturalHeight).toBe(720); expect(Math.abs(geometry.height - geometry.width * 9 / 16)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `${root}/${info.project.name}-rev-poster.png` });
  if (!process.env.PUBLIC_PROJECT_TESTS) {
    const { readFile } = await import('node:fs/promises');
    const reference = await readFile(process.env.PROJECT_FILM_SOURCE_POSTER ?? 'tests/fixtures/project-ramsmobile-rev-poster.png');
    await page.route('**/rev-poster-reference.png', route => route.fulfill({ status: 200, contentType: 'image/png', body: reference }));
    const original = await image.getAttribute('src'); await image.evaluate(im => { (im as HTMLImageElement).src = '/rev-poster-reference.png'; });
    await image.evaluate((im: HTMLImageElement) => im.decode());
    await page.screenshot({ path: `${root}/${info.project.name}-rev-poster-control.png` });
    await image.evaluate((im, src) => { (im as HTMLImageElement).src = src!; }, original); await image.evaluate((im: HTMLImageElement) => im.decode());
    await page.unroute('**/rev-poster-reference.png');
  }
  await writeFile(`${root}/${info.project.name}-rev-poster-geometry.json`, JSON.stringify({ geometry, dpr: await page.evaluate(() => devicePixelRatio) }, null, 2));
  await page.locator('.film-gallery__hero').click(); await decoded(page);
  const qualities = [];
  for (const height of [144, 720, 2160]) {
    await page.locator('.film-options__trigger').click(); await expect.poll(() => page.locator('#film-options-menu').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    await page.locator('.film-menu-quality').click(); await page.locator(`#film-quality-options media-chrome-menu-item[value="${height}"]`).click();
    await expect(media(page)).toHaveAttribute('data-quality-mode', String(height));
    await expect.poll(() => media(page).evaluate((v: HTMLVideoElement) => v.readyState >= 2 && !v.seeking && !v.dataset.filmSourceSwitch && v.videoHeight), { timeout: 120000 }).toBe(height);
    const frame = await media(page).evaluate((v: HTMLVideoElement) => new Promise<{ width: number; height: number; time: number }>((done, reject) => { const timer = setTimeout(() => reject(Error('No presented quality frame')), 120000); v.requestVideoFrameCallback((_t, f) => { clearTimeout(timer); done({ width: f.width, height: f.height, time: v.currentTime }); }); }));
    expect(frame.height).toBe(height); await expect.poll(() => media(page).evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 20000 }).toBeGreaterThan(frame.time + .2); qualities.push(frame);
  }
  await page.locator('.film-fullscreen').click();
  if (info.project.name.includes('iphone')) await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
  else await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await top(page); await page.screenshot({ path: `${root}/${info.project.name}-rev-2160-expanded.png` }); await top(page);
  await page.locator('.film-player__list-toggle').click(); await expect(page.locator('.film-playlist__item')).toHaveCount(7);
  const selected = page.locator('.film-playlist__item').nth(5); await expect(selected).toHaveAttribute('aria-current', 'true');
  const visible = await selected.evaluate(el => { const a = el.getBoundingClientRect(), b = el.parentElement!.getBoundingClientRect(); return a.top >= b.top - 1 && a.bottom <= b.bottom + 1; }); expect(visible).toBe(true);
  await page.keyboard.press('Escape'); await page.locator('.film-next').click(); await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', 'project-ramswear'); await decoded(page);
  await page.locator('.film-previous').click(); await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', 'project-ramsmobile-rev'); await decoded(page);
  await page.locator('.film-previous').click(); await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', 'project-ramsmobile-protos'); await decoded(page);
  await top(page); await page.locator('.film-player__close').click(); await expect(media(page)).not.toHaveAttribute('src');
  await writeFile(`${root}/${info.project.name}-rev-qualities.json`, JSON.stringify({ geometry, qualities, adjacentNavigation: true, cleanup: true }, null, 2));
});

test('new RAMSMOBILE film falls back to its own 720p then reopens native or MSE HLS', async ({ page }) => {
  await page.goto('/en'); await enter(page, 'ramsmobile'); await page.locator('.film-gallery__item').nth(5).click();
  const blockHls = async (route: import('@playwright/test').Route) => new URL(route.request().url()).pathname.endsWith('.m3u8') ? route.abort() : route.continue();
  await page.route('**/films/project-ramsmobile-rev/und-v1/**', blockHls);
  await page.locator('.film-gallery__hero').click(); await decoded(page); await expect(media(page)).toHaveAttribute('data-playback', 'mp4-fallback');
  expect(await media(page).evaluate((v: HTMLVideoElement) => v.videoHeight)).toBe(720);
  await page.locator('.film-options__trigger').click(); await expect.poll(() => page.locator('#film-options-menu').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await page.locator('.film-menu-quality').click(); await expect(page.locator('#film-quality-options media-chrome-menu-item')).toHaveCount(1);
  await expect(page.locator('#film-quality-options media-chrome-menu-item')).toHaveAttribute('value', '720');
  await page.locator('.film-options__trigger').click();
  await expect.poll(() => page.locator('#film-options-menu').evaluate(el => getComputedStyle(el).opacity)).toBe('0');
  await expect(page.locator('#product-film')).toBeVisible();
  await top(page); await page.locator('.film-player__close').click(); await page.unroute('**/films/project-ramsmobile-rev/und-v1/**', blockHls);
  await enter(page, 'ramsmobile'); await page.locator('.film-gallery__item').nth(5).click(); await page.locator('.film-gallery__hero').click(); await decoded(page);
  await expect(media(page)).not.toHaveAttribute('data-playback', 'mp4-fallback'); await expect(page.locator('#film-player')).toHaveAttribute('data-qualities', '[144,360,720,1080,1440,2160]');
  await top(page); await page.locator('.film-player__close').click(); await expect(media(page)).not.toHaveAttribute('src');
});
