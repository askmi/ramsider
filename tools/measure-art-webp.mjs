import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 402, height: 874 },
  deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100,
  downloadThroughput: 500000, uploadThroughput: 500000 });
await page.addInitScript(() => {
  window.__artMetrics = { lcp: null, cls: 0 };
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) window.__artMetrics.lcp = entry.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__artMetrics.cls += entry.value;
  }).observe({ type: 'layout-shift', buffered: true });
});
const begin = performance.now();
await page.goto('http://127.0.0.1:3021/en', { waitUntil: 'domcontentloaded' });
await page.locator('.art img').first().evaluate(image => image.decode());
const heroDecodedMs = performance.now() - begin;
await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const heroPaintedMs = performance.now() - begin;
const first = await page.evaluate(() => ({
  fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
  lcp: window.__artMetrics.lcp, cls: window.__artMetrics.cls,
  heroResource: performance.getEntriesByType('resource').find(item => item.name.endsWith('/art/00.webp'))?.toJSON(),
  jsBytes: performance.getEntriesByType('resource').filter(item => item.initiatorType === 'script')
    .reduce((sum, item) => sum + item.transferSize, 0),
  firstViewportBytes: performance.getEntriesByType('resource').reduce((sum, item) => sum + item.transferSize, 0)
    + performance.getEntriesByType('navigation')[0].transferSize,
}));
const scrollBegin = performance.now();
await page.evaluate(() => scrollTo({ top: 6500, behavior: 'instant' }));
await page.evaluate(async () => {
  const visible = [...document.querySelectorAll('.art img')]
    .find(image => { const r = image.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  const url = getComputedStyle(visible).backgroundImage.slice(5, -2);
  const preview = new Image();
  preview.src = url;
  await preview.decode();
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
});
const previewPaintedMs = performance.now() - scrollBegin;
await page.evaluate(async () => {
  const visible = [...document.querySelectorAll('.art img,.tail-art img')]
    .filter(image => { const r = image.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  await Promise.all(visible.map(image => image.decode()));
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
});
const distantPaintedMs = performance.now() - scrollBegin;
const frames = await page.evaluate(() => new Promise(resolve => {
  const intervals = [];
  let previous = 0;
  const step = time => {
    if (previous) intervals.push(time - previous);
    previous = time;
    scrollBy({ top: 50, behavior: 'instant' });
    if (intervals.length < 90) requestAnimationFrame(step);
    else resolve(intervals);
  };
  requestAnimationFrame(step);
}));
const sorted = frames.toSorted((a, b) => a - b);
const report = { profile: 'Chromium 402x874 DPR3, cold cache, synthetic 4 Mbps / 100 ms RTT',
  heroDecodedMs: +heroDecodedMs.toFixed(1), heroPaintedMs: +heroPaintedMs.toFixed(1),
  previewPaintedMs: +previewPaintedMs.toFixed(1),
  distantPaintedMs: +distantPaintedMs.toFixed(1),
  fcpMs: first.fcp, lcpMs: first.lcp, cls: first.cls,
  heroTransferBytes: first.heroResource?.transferSize, jsTransferBytes: first.jsBytes,
  firstViewportTransferBytes: first.firstViewportBytes,
  scrollFrameP95Ms: +sorted[Math.floor(sorted.length * .95)].toFixed(1),
  scrollFramesOver33Ms: frames.filter(value => value > 33).length };
await fs.writeFile('docs/evidence/art-webp/performance.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
await browser.close();
