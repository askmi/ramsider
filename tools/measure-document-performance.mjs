import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3020';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await context.newPage();
await page.addInitScript(() => {
  window.__qa = { lcp: 0, cls: 0 };
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) window.__qa.lcp = entry.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver(list => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__qa.cls += entry.value;
  }).observe({ type: 'layout-shift', buffered: true });
});
await page.goto(`${baseURL}/en`, { waitUntil: 'load' });
await page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => setTimeout(resolve, 900)); });
const first = await page.evaluate(() => ({ lcpMs: window.__qa.lcp, cls: window.__qa.cls }));
const resourceTotals = () => page.evaluate(() => {
  const entries = performance.getEntriesByType('resource');
  return {
    transferBytes: entries.reduce((sum, entry) => sum + entry.transferSize, 0),
    jsTransferBytes: entries.filter(entry => entry.initiatorType === 'script').reduce((sum, entry) => sum + entry.transferSize, 0),
    resourceCount: entries.length,
  };
});
const firstViewportResources = await resourceTotals();
const scroll = await page.evaluate(async () => {
  const frames = [];
  let last = performance.now();
  for (let i = 0; i < 160; i++) {
    await new Promise(resolve => requestAnimationFrame(now => {
      if (i) frames.push(now - last);
      last = now;
      scrollTo(0, i * (document.documentElement.scrollHeight - innerHeight) / 159);
      resolve();
    }));
  }
  frames.sort((a, b) => a - b);
  return { frames: frames.length, p95Ms: frames[Math.floor(frames.length * .95)], over33Ms: frames.filter(value => value > 33).length };
});
await page.evaluate(async () => {
  for (const image of document.querySelectorAll('.art img, .tail-art img, .doc-thumb')) {
    image.scrollIntoView({ block: 'center' });
    if (!image.complete || !image.currentSrc) await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', reject, { once: true });
    });
    await image.decode();
  }
});
const fullPageResources = await resourceTotals();
const result = { baseURL, viewport: '402x874 DPR3', ...first, ...scroll, firstViewportResources, fullPageResources, inp: 'not measured' };
await mkdir('screenshots/actual/document-cards', { recursive: true });
await writeFile('screenshots/actual/document-cards/performance.json', JSON.stringify(result, null, 2));
console.log(result);
await browser.close();
