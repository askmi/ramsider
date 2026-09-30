import { webkit } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const stage = process.argv[2];
if (!stage) throw new Error('Pass an explicit capture stage, for example before or final.');
const locale = process.argv[3] ?? 'ru';
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
await mkdir('screenshots/actual/document-cards', { recursive: true });
const browser = await webkit.launch();
for (const width of [402, 440]) {
  const context = await browser.newContext({ viewport: { width, height: width === 402 ? 874 : 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto(`${baseURL}/${locale}`);
  await page.locator('.doc-card').first().scrollIntoViewIfNeeded();
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = [...document.querySelectorAll('.art img, .doc-thumb')]
      .filter(image => image.getBoundingClientRect().top < innerHeight && image.getBoundingClientRect().bottom > 0);
    await Promise.all(images.map(async image => {
      if (!image.complete || !image.currentSrc) await new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', reject, { once: true });
      });
      await image.decode();
    }));
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const cards = await page.locator('.doc-card').evaluateAll(nodes => nodes.map(node => {
    const button = node.querySelector('button');
    const text = button.querySelector('.doc-action-label');
    const range = document.createRange();
    if (text) range.selectNodeContents(text);
    return { id: button.id, card: node.getBoundingClientRect().toJSON(), title: node.querySelector('strong').getBoundingClientRect().toJSON(), detail: node.querySelector('small').getBoundingClientRect().toJSON(), action: button.getBoundingClientRect().toJSON(), actionText: text ? range.getBoundingClientRect().toJSON() : null, arrow: button.querySelector('svg').getBoundingClientRect().toJSON() };
  }));
  const path = `screenshots/actual/document-cards/${stage}-${locale}-${width}.png`;
  await page.screenshot({ path });
  console.log(JSON.stringify({ stage, locale, width, viewport: await page.evaluate(() => ({ innerWidth, dpr: devicePixelRatio, viewport: document.querySelector('meta[name="viewport"]')?.content })), cards, path }));
  await context.close();
}
await browser.close();
