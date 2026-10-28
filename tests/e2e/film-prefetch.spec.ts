import { silenceTestMedia } from './silent-media';
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.beforeEach(async ({ page }) => silenceTestMedia(page));

test.setTimeout(90000);
const registry = JSON.parse(readFileSync('config/product-films.json', 'utf8'));
const asset = registry.assets.find((a: { active: boolean; id: string; audioLocale: string }) => a.active && a.id === 'uno-introduction' && a.audioLocale === 'en');
const base = `/films/${asset.directory}`;
const cacheName = 'film-start-v1';

test.beforeEach(({}, info) => { test.skip(info.project.name === 'desktop-firefox', 'Chromium MSE and both native WebKit profiles own cache integration'); });

test('three segments warm without playback; cached range protocol and playback remain usable', async ({ page }, info) => {
  await page.addInitScript(async () => {
    await (await caches.open('film-start-obsolete')).put('/retired-film-object', new Response('old'));
    await (await caches.open('unrelated-feature-cache')).put('/unrelated-object', new Response('keep'));
    await (await caches.open('film-start-v1')).put('/retired-startup-object', new Response('old'));
  });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const warm: string[] = [];
  page.on('request', request => { if (request.headers()['x-film-preload']) warm.push(new URL(request.url()).pathname); });
  await page.goto('/en');
  await expect(page.locator('video')).toHaveAttribute('data-preload', 'ready', { timeout: 40000 });
  await expect(page.locator('video')).not.toHaveAttribute('src');
  expect(await page.locator('video').evaluate(v => (v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime === 0)).toBe(true);
  expect(warm).toHaveLength(6);
  expect(warm.filter(path => path.endsWith('.m4s'))).toEqual([0, 1, 2].map(n => `${base}/360p/segment-0000${n}.m4s`));
  const checks = await page.evaluate(async ({ base, cacheName }) => {
    const cache = await caches.open(cacheName), keys = await cache.keys();
    const url = `${base}/360p/segment-00000.m4s`;
    const rows = [];
    for (const range of [null, 'bytes=0-1', 'bytes=10-', 'bytes=-8', 'bytes=999999999-', 'bytes=4-2', 'bytes=-0']) {
      const response = await fetch(url, { headers: range ? { Range: range } : {} });
      rows.push({ range, status: response.status, length: (await response.arrayBuffer()).byteLength, hit: response.headers.get('X-Film-Cache'), contentRange: response.headers.get('Content-Range') });
    }
    const head = await fetch(url, { method: 'HEAD' });
    const unsupported = await fetch(url, { headers: { Range: 'bytes=0-1,4-5' } });
    const conditional = await fetch(url, { headers: { Range: 'bytes=0-1', 'If-Range': '"unknown-version"' } });
    return { names: await caches.keys(), unsupportedHit: unsupported.headers.get('X-Film-Cache'), conditionalHit: conditional.headers.get('X-Film-Cache'), keys: keys.map(key => key.url), rows, head: { status: head.status, length: head.headers.get('content-length'), body: (await head.arrayBuffer()).byteLength } };
  }, { base, cacheName });
  expect(checks.keys).toHaveLength(6);
  expect(checks.names).toContain('unrelated-feature-cache');
  expect(checks.names).not.toContain('film-start-obsolete');
  expect(checks.unsupportedHit).toBeNull(); expect(checks.conditionalHit).toBeNull();
  const bytes = asset.files.find((f: { path: string }) => f.path === '360p/segment-00000.m4s').bytes;
  expect(checks.rows.map(row => row.status)).toEqual([200, 206, 206, 206, 416, 416, 416]);
  expect(checks.rows.map(row => row.length)).toEqual([bytes, 2, bytes - 10, 8, 0, 0, 0]);
  expect(checks.rows.every(row => row.hit === 'hit')).toBe(true);
  expect(checks.head).toEqual({ status: 200, length: String(bytes), body: 0 });
  await page.waitForTimeout(500);
  expect(warm).toHaveLength(6);
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(1);
  await page.screenshot({ path: `screenshots/video/prefetch/open-${info.project.name}.png`, scale: 'css' });
  await page.locator('video').evaluate(v => { (v as HTMLVideoElement).currentTime = 25; });
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(26);
  await page.locator('.film-player__close').click();
  await expect(page.locator('video')).not.toHaveAttribute('src');
  expect(errors).toEqual([]);
});

test('Watch interrupts an in-flight warm transfer without awaiting it', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.fetch;
    const state = window as Window & { warmHeld?: boolean; warmAborted?: boolean };
    window.fetch = async (input, init) => {
      if (String(input).endsWith('/360p/segment-00000.m4s') && new Headers(init?.headers).has('X-Film-Preload')) {
        state.warmHeld = true;
        await new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => { state.warmAborted = true; reject(new DOMException('Cancelled', 'AbortError')); }, { once: true });
        });
      }
      return original(input, init);
    };
  });
  await page.goto('/en');
  await expect.poll(() => page.evaluate(() => (window as Window & { warmHeld?: boolean }).warmHeld), { timeout: 40000 }).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => (window as Window & { warmAborted?: boolean }).warmAborted)).toBe(true);
  await page.evaluate(() => {
    const state = window as Window & { warmHeld?: boolean; warmAborted?: boolean };
    state.warmHeld = false; state.warmAborted = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => (window as Window & { warmHeld?: boolean }).warmHeld)).toBe(true);
  await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); });
  expect(await page.evaluate(() => (window as Window & { warmAborted?: boolean }).warmAborted)).toBe(true);
  await page.evaluate(() => {
    const state = window as Window & { warmHeld?: boolean; warmAborted?: boolean };
    state.warmHeld = false; state.warmAborted = false;
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect.poll(() => page.evaluate(() => (window as Window & { warmHeld?: boolean }).warmHeld)).toBe(true);
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 15000 }).toBeGreaterThan(.2);
  expect(await page.evaluate(() => (window as Window & { warmAborted?: boolean }).warmAborted)).toBe(true);
  await page.locator('.film-player__close').click();
  await page.waitForTimeout(500);
  await expect(page.locator('video')).not.toHaveAttribute('src');
});

test('denied cache storage fails open to ordinary playback', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'caches', { get: () => { throw new Error('Storage denied'); } }); });
  await page.goto('/en');
  await expect(page.locator('video')).toHaveAttribute('data-preload', 'unavailable', { timeout: 40000 });
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(.2);
});

test('failed background transfer is terminal despite later image events', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.fetch;
    const state = window as Window & { warmFailures?: number };
    window.fetch = async (input, init) => {
      if (new Headers(init?.headers).has('X-Film-Preload')) {
        state.warmFailures = (state.warmFailures ?? 0) + 1;
        throw new TypeError('Network unavailable');
      }
      return original(input, init);
    };
  });
  await page.goto('/en');
  await expect(page.locator('video')).toHaveAttribute('data-preload', 'unavailable', { timeout: 40000 });
  await page.evaluate(() => { for (let i = 0; i < 10; i++) document.dispatchEvent(new Event('media-state')); });
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => (window as Window & { warmFailures?: number }).warmFailures)).toBe(1);
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(.2);
});

for (const registration of ['denied', 'pending'] as const) test(`registration ${registration} cannot hold Watch`, async ({ page }) => {
  await page.addInitScript(mode => {
    navigator.serviceWorker.register = () => mode === 'denied' ? Promise.reject(new Error('Registration denied')) : new Promise(() => {});
  }, registration);
  await page.goto('/en');
  await expect(page.locator('video')).toHaveAttribute('data-preload', registration === 'denied' ? 'unavailable' : 'loading', { timeout: 40000 });
  await expect.poll(() => page.locator('.art img:not([data-media-ready])').count(), { timeout: 40000 }).toBe(0);
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await expect(page.locator('#film-play')).toBeInViewport();
  const started = Date.now();
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#product-film')).toBeVisible();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 6000 }).toBeGreaterThan(.2);
  expect(Date.now() - started).toBeLessThan(6000); // Activation timeout is 8s; intent never waits for it.
});

test('evicted startup cache uses ordinary delivery and still plays', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('video')).toHaveAttribute('data-preload', 'ready', { timeout: 40000 });
  await page.evaluate(name => caches.delete(name), cacheName);
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(1);
});

test('an optional worker warm failure cannot poison ordinary MSE playback', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'MSE worker-specific owner');
  await page.addInitScript(() => {
    const original = window.fetch;
    window.fetch = async (input, init) => {
      if (String(input).includes('/vendor/hls-worker-') && init?.cache === 'force-cache') throw new TypeError('Optional worker fetch failed');
      return original(input, init);
    };
  });
  await page.goto('/en');
  await expect(page.locator('video')).toHaveAttribute('data-preload', 'ready', { timeout: 40000 });
  // Stabilize the distant control before a pointer click; the image-scroll gate can move it while artwork is still pending.
  await expect.poll(() => page.locator('.art img:not([data-media-ready])').count(), { timeout: 40000 }).toBe(0);
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await expect(page.locator('#film-play')).toBeInViewport();
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#product-film')).toBeVisible();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 20000 }).toBeGreaterThan(.2);
});

test('Watch cancels a pending worker warm without waiting for optional preparation', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'MSE worker-specific owner');
  await page.addInitScript(() => {
    const original = window.fetch;
    const state = window as Window & { workerAborted?: boolean };
    window.fetch = async (input, init) => {
      if (String(input).includes('/vendor/hls-worker-') && init?.cache === 'force-cache') {
        await new Promise((_, reject) => {
          init.signal?.addEventListener('abort', () => { state.workerAborted = true; reject(new DOMException('Cancelled', 'AbortError')); }, { once: true });
        });
      }
      return original(input, init);
    };
  });
  await page.goto('/en');
  await expect.poll(() => page.evaluate(async () => (await (await caches.open('film-start-v1')).keys()).length), { timeout: 40000 }).toBe(6);
  await expect(page.locator('video')).toHaveAttribute('data-preload', 'loading');
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 15000 }).toBeGreaterThan(.2);
  expect(await page.evaluate(() => (window as Window & { workerAborted?: boolean }).workerAborted)).toBe(true);
});

test('locale navigation unmounts and aborts the pending optional producer', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.fetch;
    const state = window as Window & { warmHeld?: boolean; warmAborted?: boolean };
    window.fetch = async (input, init) => {
      if (String(input).endsWith('/360p/segment-00000.m4s') && new Headers(init?.headers).has('X-Film-Preload')) {
        state.warmHeld = true;
        await new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => { state.warmAborted = true; sessionStorage.setItem('film-test-navigation-aborted', 'yes'); reject(new DOMException('Cancelled', 'AbortError')); }, { once: true });
        });
      }
      return original(input, init);
    };
  });
  await page.goto('/en');
  await expect.poll(() => page.evaluate(() => (window as Window & { warmHeld?: boolean }).warmHeld), { timeout: 40000 }).toBe(true);
  await page.locator('#locale-toggle').click();
  await page.locator('#locale-option-ru').click();
  await expect(page).toHaveURL(/\/ru/);
  expect(await page.evaluate(() => sessionStorage.getItem('film-test-navigation-aborted'))).toBe('yes');
  await expect(page.locator('video')).not.toHaveAttribute('src');
});
