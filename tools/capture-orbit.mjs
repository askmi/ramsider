import { webkit } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const stage = process.argv[2] ?? 'before';
const locale = process.argv[3] ?? 'ru';
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
await mkdir('screenshots/actual/orbit-centering', { recursive: true });
const browser = await webkit.launch();
for (const width of [402, 440]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 402 ? 874 : 956 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/${locale}`);
  await page.evaluate(() => document.fonts.ready);
  for (const id of ['technology-experience', 'technology-repeat']) {
    const element = page.locator(`#${id}`);
    await element.scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      await Promise.all([...document.images]
        .filter((image) => image.getBoundingClientRect().top < innerHeight && image.getBoundingClientRect().bottom > 0)
        .map(async (image) => {
          if (!image.complete || !image.currentSrc) await new Promise((resolve, reject) => {
            image.addEventListener('load', resolve, { once: true });
            image.addEventListener('error', reject, { once: true });
          });
          await image.decode();
        }));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const box = await element.boundingBox();
    const label = await element.locator('.button-label').boundingBox();
    const caption = await element.evaluate((node) => {
      const next = node.nextElementSibling;
      return next ? { text: next.textContent, box: next.getBoundingClientRect().toJSON() } : null;
    });
    const path = `screenshots/actual/orbit-centering/${stage}-${locale}-${width}-${id}.png`;
    await page.screenshot({ path });
    console.log(JSON.stringify({ stage, locale, width, id, box, label, caption, path, viewport: await page.evaluate(() => ({ innerWidth, dpr: devicePixelRatio })) }));
  }
  await context.close();
}
await browser.close();
