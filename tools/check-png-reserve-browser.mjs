// Confirm reserve PNGs remain unused by a production page on both phone profiles.
import { webkit } from '@playwright/test';
import fs from 'node:fs';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3023';
const browser = await webkit.launch();
const results = [];
try {
  for (const [name, width, height] of [['pro', 402, 874], ['max', 440, 956]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    try {
      const page = await context.newPage();
      const urls = [];
      page.on('request', request => urls.push(request.url()));
      await page.goto(`${base}/en`, { waitUntil: 'domcontentloaded' });
      await page.locator('.art img').first().evaluate(image => image.decode());
      await page.evaluate(() => scrollTo({ top: 6500, behavior: 'instant' }));
      await page.waitForTimeout(1200);
      const art = urls.filter(url => url.includes('/art/'));
      const reserve = art.filter(url => url.includes('/original-png/'));
      const webp = art.filter(url => url.endsWith('.webp'));
      if (reserve.length || !webp.length) throw new Error(`${name}: reserve=${reserve.length} WebP=${webp.length}`);
      results.push({ profile: name, viewport: [width, height], artRequests: art.length,
        webpRequests: webp.length, reservePngRequests: reserve.length,
        sampleWebp: webp.slice(0, 3).map(url => new URL(url).pathname) });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
fs.mkdirSync('docs/evidence/png-reserve', { recursive: true });
fs.writeFileSync('docs/evidence/png-reserve/requests.json', JSON.stringify(results, null, 2) + '\n');
console.log(results);
