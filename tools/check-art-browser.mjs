import { webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root = path.resolve('docs/evidence/art-webp/browser');
await fs.mkdir(root, { recursive: true });
const referenceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ramsider-art-reference-'));
const generated = spawnSync('python3', ['tools/convert-art-webp.py'], {
  env: { ...process.env, ART_REFERENCE_PNG_DIR: referenceDir }, encoding: 'utf8' });
if (generated.status !== 0) throw new Error(generated.stderr || generated.stdout);
const browser = await webkit.launch();
const results = [];
async function settleVisible(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('.art img,.tail-art img,.faq-stack img,.doc-card img')]
    .filter(image => { const r = image.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })
    .every(image => image.complete && image.naturalWidth > 0), { timeout: 30000 });
  await page.evaluate(async () => {
    const visible = [...document.querySelectorAll('.art img,.tail-art img,.faq-stack img,.doc-card img')]
      .filter(image => { const r = image.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
    await Promise.allSettled(visible.map(image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
for (const { name, width, height } of [
  { name: 'pro', width: 402, height: 874 },
  { name: 'max', width: 440, height: 956 },
]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3,
    isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('**/art/*.png', async route => {
    const filename = path.basename(new URL(route.request().url()).pathname);
    const reference = path.join(referenceDir, filename);
    try {
      await route.fulfill({ body: await fs.readFile(reference), contentType: 'image/png' });
    } catch (error) {
      if (error.code === 'ENOENT') await route.continue();
      else throw error;
    }
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:3021/en', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const dimensions = await page.evaluate(() => ({ innerWidth, dpr: devicePixelRatio,
    viewportMeta: document.querySelector('meta[name=viewport]')?.content }));
  if (dimensions.innerWidth !== width || dimensions.dpr !== 3 || !dimensions.viewportMeta?.includes('width=device-width')) {
    throw new Error(`Wrong viewport ${JSON.stringify(dimensions)}`);
  }
  for (const [label, y] of [['hero', 0], ['first-join', Math.round(2800 * width / 941) - 400],
    ['middle', Math.round(14000 * width / 941) - 350],
    ['documents', Math.round(23300 * width / 941) - 350],
    ['faq', Math.round(27500 * width / 941) - 350],
    ['footer', Math.round(30700 * width / 941) - 350]]) {
    await page.evaluate(value => scrollTo({ top: value, behavior: 'instant' }), y);
    await settleVisible(page);
    const webp = await page.screenshot({ path: path.join(root, `${name}-${label}-webp.png`), scale: 'css' });
    await page.evaluate(async () => {
      const images = [...document.querySelectorAll('img[src$=".webp"]')];
      for (const image of images) image.src = image.src.replace(/\.webp$/, '.png');
    });
    await settleVisible(page);
    const png = await page.screenshot({ path: path.join(root, `${name}-${label}-png.png`), scale: 'css' });
    const a = await sharp(webp).removeAlpha().raw().toBuffer();
    const b = await sharp(png).removeAlpha().raw().toBuffer();
    let sum = [0, 0, 0], max = [0, 0, 0];
    for (let i = 0; i < a.length; i++) {
      const channel = i % 3;
      const difference = Math.abs(a[i] - b[i]);
      sum[channel] += difference;
      max[channel] = Math.max(max[channel], difference);
    }
    const pixels = width * height;
    results.push({ name, label, scrollY: await page.evaluate(() => scrollY),
      meanAbsRgb: sum.map(value => +(value / pixels).toFixed(3)), maxAbsRgb: max });
    await page.evaluate(async () => {
      const images = [...document.querySelectorAll('img[src$=".png"]')]
        .filter(image => /\/art\/(?:\d|faq-row|doc-)/.test(image.src));
      for (const image of images) image.src = image.src.replace(/\.png$/, '.webp');
    });
    await settleVisible(page);
  }
  await context.close();
  if (errors.length) throw new Error(`${name} page errors: ${errors.join('; ')}`);
}
await browser.close();
await fs.rm(referenceDir, { recursive: true, force: true });
await fs.writeFile(path.join(root, 'comparison.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
