import { webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const locales = ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko'];
const widths = [375, 402, 440, 768, 1440];
await mkdir('screenshots/actual/orbit-centering', { recursive: true });
const browser = await webkit.launch();
const measurements = [];
for (const width of widths) {
  const context = await browser.newContext({ viewport: { width, height: 956 }, deviceScaleFactor: 3, isMobile: width <= 440 });
  const page = await context.newPage();
  for (const locale of locales) {
    await page.goto(`http://127.0.0.1:3000/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const rows = await page.evaluate(() => {
      const canvasWidth = document.querySelector('.canvas').getBoundingClientRect().width;
      return ['technology-experience', 'technology-repeat'].map((id) => {
        const button = document.getElementById(id);
        const box = button.getBoundingClientRect();
        const label = button.querySelector('.button-label').getBoundingClientRect();
        const caption = button.nextElementSibling.getBoundingClientRect();
        const groupCenter = (label.top + caption.bottom) / 2;
        const ringCenter = box.top + box.height / 2 + (id === 'technology-experience' ? 7 * canvasWidth / 941 : 0);
        return { id, offsetSource: (groupCenter - ringCenter) * 941 / canvasWidth,
          gapSource: (caption.top - label.bottom) * 941 / canvasWidth,
          insideHorizontal: label.left >= box.left && label.right <= box.right && caption.left >= box.left && caption.right <= box.right,
          captionBelow: label.bottom < caption.top,
          hitHeight: box.height };
      });
    });
    for (const row of rows) {
      const ok = row.insideHorizontal && row.captionBelow && row.hitHeight >= 44 && (locale === 'en' || Math.abs(row.offsetSource) <= 8);
      measurements.push({ locale, width, ...row, ok });
    }
  }
  await context.close();
}
await browser.close();
await writeFile('screenshots/actual/orbit-centering/locale-matrix.json', JSON.stringify(measurements, null, 2));
const failed = measurements.filter(row => !row.ok);
console.log(JSON.stringify({ states: measurements.length, passed: measurements.length - failed.length, failed: failed.slice(0, 12), maxAbsOffsetSource: Math.max(...measurements.filter(row => row.locale !== 'en').map(row => Math.abs(row.offsetSource))) }));
if (failed.length) process.exitCode = 1;
