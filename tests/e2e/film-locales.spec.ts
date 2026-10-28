import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';

type Asset = { id: string; active: boolean; audioLocale: string; directory: string; duration: number; audioLabels: Record<string, string>; files: Array<{ path: string; bytes: number }> };
const registry = JSON.parse(readFileSync('config/product-films.json', 'utf8')) as { assets: Asset[] };
const locales = ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko'];
const cacheName = 'film-start-v1';
const assetFor = (audio: string) => registry.assets.find(asset => asset.active && asset.id === 'uno-introduction' && asset.audioLocale === audio)!;
const expectedAudio = (locale: string) => ['ru', 'de', 'es'].includes(locale) ? locale : 'en';
const baseFor = (audio: string) => `/films/${assetFor(audio).directory}`;
const starter = (audio: string) => ['master.m3u8', '360p/index.m3u8', '360p/init.mp4', ...[0, 1, 2].map(n => `360p/segment-${String(n).padStart(5, '0')}.m4s`)].map(path => `${baseFor(audio)}/${path}`);
async function ready(page: Page, locale: string) {
  await page.goto(`/${locale}`);
  await expect(page.locator('video')).toHaveAttribute('data-preload', 'ready', { timeout: 45000 });
}

test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(140000);

test('all eleven page locales select exact supplied audio or the English fallback', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One native mobile locale-matrix owner');
  for (const locale of locales) {
    const audio = expectedAudio(locale), base = baseFor(audio);
    await page.goto(`/${locale}`);
    const video = page.locator('video');
    await expect(video).toHaveAttribute('data-audio-locale', audio);
    await expect(video).toHaveAttribute('data-src', `${base}/master.m3u8`);
    await expect(video).toHaveAttribute('data-fallback', `${base}/fallback.mp4`);
    await expect(video).not.toHaveAttribute('src');
    await expect(page.locator('#product-film .film-gallery__audio')).toHaveCount(0);
    await expect(page.locator('#product-film')).not.toContainText(/English Audio|Original Audio/i);
    await expect(page.locator('#product-film')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click();
    await expect(page.locator('.film-gallery__caption')).toBeVisible();
    if (locale === 'en' || locale === 'ar') {
      for (const item of await page.locator('.film-gallery__item').all()) {
        await item.click();
        await expect(page.locator('.film-gallery__audio')).toHaveCount(0);
        await expect(page.locator('.film-gallery__caption')).not.toContainText(/English Audio|Original Audio/i);
      }
      await mkdir('screenshots/video/no-audio-labels', { recursive: true });
      await page.screenshot({ path: `screenshots/video/no-audio-labels/${locale}.png` });
    }
    await page.locator('.product-film__close').click();
  }
});

for (const locale of ['ru', 'de', 'es']) {
  test(`${locale} warms only its six files, plays the film, seeks and releases silently`, async ({ page }, info) => {
    test.skip(info.project.name === 'desktop-firefox', 'Native Pro/Max plus Chromium MSE own localized media coverage');
    const base = baseFor(locale), warm: string[] = [], errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (request.headers()['x-film-preload']) warm.push(new URL(request.url()).pathname);
    });
    await ready(page, locale);
    expect(warm).toEqual(starter(locale));
    const before = await page.evaluate(async cacheName => {
      const video = document.querySelector('video')!;
      const cache = await caches.open(cacheName), keys = await cache.keys();
      return { paused: video.paused, time: video.currentTime, src: video.getAttribute('src'), keys: keys.map(k => new URL(k.url).pathname), bytes: (await Promise.all(keys.map(async k => (await (await cache.match(k))!.arrayBuffer()).byteLength))).reduce((a, b) => a + b, 0) };
    }, cacheName);
    expect(before.src).toBeNull(); expect(before.paused).toBe(true); expect(before.time).toBe(0);
    expect(before.keys.sort()).toEqual(starter(locale).sort());
    const bytes = starter(locale).reduce((total, url) => total + assetFor(locale).files.find(f => `${base}/${f.path}` === url)!.bytes, 0);
    expect(before.bytes).toBe(bytes); expect(bytes).toBeLessThanOrEqual(1024 * 1024);
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const video = document.querySelector('video')!;
      const probe = { start: 0, firstFrameMs: null as number | null };
      (window as Window & { filmLocaleProbe?: typeof probe }).filmLocaleProbe = probe;
      document.querySelector('.film-gallery__hero')!.addEventListener('click', () => { probe.start = performance.now(); }, { once: true, capture: true });
      video.requestVideoFrameCallback(() => { probe.firstFrameMs = performance.now() - probe.start; });
    });
    await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
    const video = page.locator('video');
    await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(6);
    expect(await video.evaluate(v => ({ muted: (v as HTMLVideoElement).muted, volume: (v as HTMLVideoElement).volume }))).toEqual({ muted: true, volume: 0 });
    await expect(video).toHaveAttribute('data-playback', info.project.name.includes('webkit') ? 'native-hls' : 'mse-hls');
    await mkdir('screenshots/video/locales', { recursive: true });
    await page.screenshot({ path: `screenshots/video/locales/${locale}-${info.project.name}.png`, scale: 'css' });
    const full = info.project.name !== 'iphone-17-pro-max-webkit';
    if (full) await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).ended), { timeout: 85000 }).toBe(true);
    const firstFrameMs = await page.evaluate(() => (window as Window & { filmLocaleProbe?: { firstFrameMs: number | null } }).filmLocaleProbe?.firstFrameMs);
    expect(firstFrameMs).toBeGreaterThan(0);
    await video.evaluate(v => { (v as HTMLVideoElement).currentTime = 30; return (v as HTMLVideoElement).play(); });
    await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(31);
    await page.locator('.film-player__close').click();
    await expect.poll(() => video.evaluate(v => ({ src: v.getAttribute('src'), paused: (v as HTMLVideoElement).paused, ready: (v as HTMLVideoElement).readyState }))).toEqual({ src: null, paused: true, ready: 0 });
    expect(errors).toEqual([]);
    await writeFile(`screenshots/video/locales/${locale}-${info.project.name}.json`, JSON.stringify({ locale, project: info.project.name, startupBytes: bytes, startupFiles: warm.slice(0, 6), firstFrameMs, fullFilmEnded: full, seekBeyond31: true, silent: true, errors }, null, 2));
  });
}

test('locale navigation and other tabs cannot substitute a different cached audio version', async ({ page, context }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'desktop-chromium'].includes(info.project.name), 'One native and one MSE cache-navigation owner');
  for (const locale of ['ru', 'de', 'es', 'fr']) {
    if (locale === 'ru') await ready(page, locale);
    else {
      await page.locator('#locale-toggle').click();
      await page.locator(`#locale-option-${locale}`).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}(?:[?#]|$)`));
      await expect(page.locator('video')).toHaveAttribute('data-preload', 'ready', { timeout: 45000 });
    }
    const audio = expectedAudio(locale);
    await expect(page.locator('video')).toHaveAttribute('data-audio-locale', audio);
    const keys = await page.evaluate(async cacheName => (await (await caches.open(cacheName)).keys()).map(k => new URL(k.url).pathname), cacheName);
    expect(keys.sort()).toEqual(starter(audio).sort());
  }
  await page.goBack();
  await expect(page).toHaveURL(/\/es(?:[?#]|$)/);
  await expect(page.locator('video')).toHaveAttribute('data-audio-locale', 'es');
  const second = await context.newPage();
  await silenceTestMedia(second);
  await ready(second, 'de'); // Shared cache may evict this tab's ES bootstrap; ordinary HTTP must remain usable.
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(2);
  await expect(page.locator('video')).toHaveAttribute('data-audio-locale', 'es');
  await expect(page.locator('video')).toHaveAttribute('data-src', `${baseFor('es')}/master.m3u8`);
  await page.locator('.film-player__close').click();
  await second.close();
});

test('all four complete packages have immutable delivery and their own progressive fallback', async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One HTTP object graph owner');
  for (const audio of ['en', 'ru', 'de', 'es']) {
    const asset = assetFor(audio), base = baseFor(audio);
    const master = await request.get(`${base}/master.m3u8`);
    expect(master.status()).toBe(200);
    expect(master.headers()['content-type']).toContain('application/vnd.apple.mpegurl');
    expect(await master.text()).toContain('#EXT-X-INDEPENDENT-SEGMENTS');
    await master.dispose();
    for (const file of asset.files) {
      const response = await request.head(`${base}/${file.path}`);
      expect(response.status(), `${audio}/${file.path}`).toBe(200);
      expect(Number(response.headers()['content-length'])).toBe(file.bytes);
      expect(response.headers()['cache-control']).toContain('immutable');
      await response.dispose();
    }
    const partial = await request.get(`${base}/fallback.mp4`, { headers: { Range: 'bytes=0-1023' } });
    expect(partial.status()).toBe(206);
    expect((await partial.body()).length).toBe(1024);
    await partial.dispose();
  }
});
