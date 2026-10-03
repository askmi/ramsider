import { webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const evidence = path.resolve('docs/evidence/art-webp/browser');
const actual = path.resolve('screenshots/actual/art-webp');
await fs.mkdir(evidence, { recursive: true });
await fs.mkdir(actual, { recursive: true });
const browser = await webkit.launch();
const joins = [2800, 5600, 8400, 11200, 14000, 16800, 19600, 22400, 25200, 30800];
const report = [];
for (const { name, width, height } of [{ name: 'pro', width: 402, height: 874 },
  { name: 'max', width: 440, height: 956 }]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3,
    isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:3021/en', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const viewport = await page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio,
    meta: document.querySelector('meta[name="viewport"]')?.content }));
  if (viewport.width !== width || viewport.dpr !== 3 || !viewport.meta?.includes('width=device-width')) {
    throw new Error(`${name} viewport mismatch: ${JSON.stringify(viewport)}`);
  }
  const crops = [];
  for (const y of joins) {
    const top = Math.max(0, Math.round(y * width / 941 - height / 2));
    await page.evaluate(value => scrollTo({ top: value, behavior: 'instant' }), top);
    await page.waitForFunction(() => [...document.querySelectorAll('.art img,.tail-art img')]
      .filter(image => { const r = image.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })
      .every(image => image.complete && image.naturalWidth > 0));
    const state = await page.evaluate(async () => {
      const visible = [...document.querySelectorAll('.art img,.tail-art img')]
        .filter(image => { const r = image.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
      await Promise.allSettled(visible.map(image => image.decode()));
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return { scrollY, visible: visible.map(image => pathName(image.src)),
        overflow: document.documentElement.scrollWidth - innerWidth };
      function pathName(url) { return new URL(url).pathname; }
    });
    if (state.overflow > 0) throw new Error(`${name} overflow at ${y}: ${state.overflow}`);
    const screenshot = await page.screenshot({ scale: 'css' });
    const crop = await sharp(screenshot).extract({ left: 0, top: Math.floor(height / 2) - 65,
      width, height: 130 }).png().toBuffer();
    crops.push({ input: crop, left: 0, top: crops.length * 130 });
    report.push({ name, sourceJoinY: y, ...state });
  }
  await sharp({ create: { width, height: joins.length * 130, channels: 3, background: '#ffffff' } })
    .composite(crops).png().toFile(path.join(evidence, `${name}-join-contact.png`));
  // Every principal tile has been brought into view and decoded before this assembled capture.
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(actual, `${name}-assembled.png`), scale: 'css', fullPage: true });
  if (errors.length) throw new Error(`${name} page errors: ${errors.join('; ')}`);
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(evidence, 'assembly.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Checked ${report.length} WebKit join states and saved two assembled pages`);
