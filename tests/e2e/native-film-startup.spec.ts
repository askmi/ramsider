import { test, expect, type Page } from '@playwright/test';
import { createServer, request, type Server } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { silenceTestMedia } from './silent-media';

// Actual streamed responses produce trusted WebKit progress events. Holding a
// Playwright route and then fulfilling its whole body cannot test this policy.
let server: Server, origin: string;
let mode: 'slow' | 'stall' | 'notification-loss' = 'slow';
const sockets = new Set<import('node:net').Socket>();
test.use({ serviceWorkers: 'block' });
test.setTimeout(200000);
test.beforeAll(async () => {
  const upstream = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:3000');
  server = createServer(async (req, res) => {
    const path = new URL(req.url!, 'http://localhost').pathname;
    if (/^\/films\/project-[a-z-]+\/und-v1\/2160p\/segment-\d+\.m4s$/.test(path)) {
      const body = await readFile(resolve('public', '.' + path));
      res.writeHead(200, { 'Content-Type': 'video/iso.segment', 'Content-Length': body.length, 'Cache-Control': 'no-store' });
      res.flushHeaders();
      if (mode === 'stall') return;
      let offset = 0;
      const timer = setInterval(() => {
        const end = Math.min(body.length, offset + 16384);
        res.write(body.subarray(offset, end)); offset = end;
        if (offset === body.length) { clearInterval(timer); res.end(); }
      }, 32);
      res.on('close', () => clearInterval(timer));
      return;
    }
    const proxy = request(new URL(req.url!, upstream), { method: req.method, headers: { ...req.headers, host: upstream.host } }, response => {
      res.writeHead(response.statusCode!, response.headers); response.pipe(res);
    });
    proxy.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end(); });
    res.on('close', () => proxy.destroy()); req.pipe(proxy);
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  origin = `http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
});
test.afterAll(async () => { for (const socket of sockets) socket.destroy(); await new Promise<void>(done => server.close(() => done())); });
test.beforeEach(async ({ page }, info) => { test.skip(!info.project.name.includes('iphone'), 'Native iPhone HLS policy; MSE covered by project controls regression'); await silenceTestMedia(page); });
const video = (page: Page) => page.locator('#product-film video');
async function start(page: Page, project = 'ramswear') {
  await page.goto(origin + '/en'); await page.locator(`#project-${project}`).click(); await page.locator('.film-gallery__hero').click();
  await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.currentTime > .1 && v.videoWidth > 0), { timeout: 45000 }).toBe(true);
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await expect(video(page)).toHaveAttribute('data-playback', 'native-hls');
}
async function quality(page: Page, value: number | 'auto') {
  await page.locator('.film-options__trigger').click();
  await expect.poll(() => page.locator('#film-options-menu').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
  await page.locator('.film-menu-quality').click();
  await page.locator(`#film-quality-options media-chrome-menu-item[value="${value}"]`).click();
  await expect(video(page)).toHaveAttribute('data-quality-mode', String(value));
}

test('manual native 4K receives data beyond 15 seconds and presents advancing decoded frames', async ({ page }, info) => {
  mode = 'slow'; await start(page);
  const started = Date.now(); await quality(page, 2160);
  await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.videoHeight === 2160 && v.readyState >= 3 && !v.paused && !v.seeking && !v.error), { timeout: 110000 }).toBe(true);
  const frame = await video(page).evaluate((v: HTMLVideoElement) => new Promise<{ width: number; height: number; time: number }>(done => v.requestVideoFrameCallback((_t, f) => done({ width: f.width, height: f.height, time: v.currentTime }))));
  expect(frame.height).toBe(2160); expect(frame.width).toBe(3840); expect(Date.now() - started).toBeGreaterThan(15000);
  await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15000 }).toBeGreaterThan(frame.time + .2);
  await expect(video(page)).toHaveAttribute('data-playback', 'native-hls');
  await video(page).evaluate((v: HTMLVideoElement) => v.pause());
  await page.screenshot({ path: `screenshots/video/projects/watchdog-${info.project.name}-2160.png` });
  await info.attach('slow-native-frame', { body: JSON.stringify({ frame, elapsedMs: Date.now() - started, streamBytesPerSecond: 512000 }), contentType: 'application/json' });
});

test('paused and hidden manual startup suspend timers; synthetic progress cannot hide a true stall', async ({ page }) => {
  mode = 'stall'; await start(page); await quality(page, 2160);
  await video(page).evaluate((v: HTMLVideoElement) => v.pause());
  await page.waitForTimeout(17000); await expect(video(page)).toHaveAttribute('data-quality-mode', '2160');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await video(page).evaluate((v: HTMLVideoElement) => { void v.play().catch(() => {}); });
  await page.waitForTimeout(17000); await expect(video(page)).toHaveAttribute('data-quality-mode', '2160');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); Object.assign(window, { syntheticProgress: setInterval(() => { const v = document.querySelector('video')!; v.dispatchEvent(new Event('progress')); v.dispatchEvent(new Event('waiting')); }, 100) }); });
  await expect(video(page)).toHaveAttribute('data-playback', 'mp4-fallback', { timeout: 21000 });
  await page.evaluate(() => clearInterval((window as unknown as { syntheticProgress: number }).syntheticProgress));
  await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.currentTime > .1 && v.readyState >= 2), { timeout: 20000 }).toBe(true);
});

test('lost playing notification cannot extend the independent 120 second startup cap', async ({ page }, info) => {
  test.skip(info.project.name.includes('max'), 'One real-time hard-cap owner; both devices run slow data and inactivity lifecycle');
  mode = 'notification-loss'; await start(page, 'ramsider');
  await video(page).evaluate((v: HTMLVideoElement) => {
    const events: { name: string; trusted: boolean; ms: number; source: string; playback?: string; error?: number; time: number }[] = []; Object.assign(window, { capEvents: events });
    // Fault injection: lose the notification, not its real decoded frames or
    // network progress. Real slow-start/playing behavior is tested separately.
    v.addEventListener('playing', event => { if (v.currentSrc.includes('/2160p/')) event.stopImmediatePropagation(); }, { capture: true });
    for (const name of ['progress', 'loadedmetadata', 'waiting', 'error', 'playing', 'pause']) v.addEventListener(name, event => events.push({ name, trusted: event.isTrusted, ms: performance.now(), source: v.currentSrc, playback: v.dataset.playback, error: v.error?.code, time: v.currentTime }));
  });
  const started = Date.now(); await quality(page, 2160);
  try {
    await page.waitForTimeout(100000); await expect(video(page)).toHaveAttribute('data-playback', 'native-hls');
    await expect(video(page)).toHaveAttribute('data-playback', 'mp4-fallback', { timeout: 26000 });
    expect(Date.now() - started).toBeGreaterThanOrEqual(119000); expect(Date.now() - started).toBeLessThan(127000);
    const progress = await page.evaluate(() => (window as unknown as { capEvents: { name: string; trusted: boolean; ms: number; source: string }[] }).capEvents.filter(e => e.name === 'progress' && e.trusted && e.source.includes('/2160p/')).map(e => e.ms));
    expect(progress.length).toBeGreaterThan(8);
    expect(Math.max(...progress.slice(1).map((ms, i) => ms - progress[i]))).toBeLessThan(15000);
  } finally {
    await writeFile(info.outputPath('cap-events.json'), JSON.stringify({ elapsedMs: Date.now() - started, bytesPerSecond: 512000, fault: 'Capture suppresses playing notification only; real trusted native progress and source retained', events: await page.evaluate(() => (window as unknown as { capEvents: object[] }).capEvents) }, null, 2));
  }
});

test('rapid manual changes, Auto and close/reopen cancel the previous startup owner', async ({ page }) => {
  mode = 'stall'; await start(page); await quality(page, 2160); await quality(page, 144); await quality(page, 2160); await quality(page, 'auto');
  await expect.poll(() => video(page).evaluate((v: HTMLVideoElement) => v.currentTime > .2 && v.readyState >= 3), { timeout: 30000 }).toBe(true);
  await page.keyboard.press('Escape'); await expect(page.locator('#product-film')).not.toBeVisible();
  await expect(video(page)).not.toHaveAttribute('src');
  await start(page); await page.waitForTimeout(17000);
  await expect(video(page)).toHaveAttribute('data-playback', 'native-hls'); await expect(video(page)).toHaveAttribute('data-quality-mode', 'auto');
  expect(await video(page).evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(10);
});
