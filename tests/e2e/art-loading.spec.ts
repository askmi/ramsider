import { expect, test } from '@playwright/test';
import sharp from 'sharp';

async function luminanceRange(png: Buffer, box: { left: number; top: number; width: number; height: number }) {
  const { data, info } = await sharp(png).extract(box).raw().toBuffer({ resolveWithObject: true });
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const value = (data[i] * 3 + data[i + 1] * 6 + data[i + 2]) / 10;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return max - min;
}

test('cold first paint and a fast distant scroll show artwork while tiles load', async ({ page }, testInfo) => {
  let releaseImages!: () => void;
  const imageGate = new Promise<void>(resolve => { releaseImages = resolve; });
  await page.route('**/art/*.webp', async route => { await imageGate; await route.continue(); });
  try {
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    const first = await page.locator('.art img').first().evaluate(image => ({
      complete: (image as HTMLImageElement).complete,
      preview: getComputedStyle(image).backgroundImage,
    }));
    expect(first.complete).toBe(false);
    expect(first.preview).toContain('data:image/webp;base64');

    await page.evaluate(() => scrollTo({ top: 6500, behavior: 'instant' }));
    const distant = await page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>('.art img')]
      .filter(image => { const box = image.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; })
      .map(image => ({ complete: image.complete, preview: getComputedStyle(image).backgroundImage })));
    expect(distant.length).toBeGreaterThan(0);
    expect(distant.some(image => !image.complete && image.preview.includes('data:image/webp;base64'))).toBe(true);
  } finally {
    releaseImages();
  }
  await expect.poll(async () => page.locator('.art img, .tail-art img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)), { timeout: 15000 }).toBe(true);
  const final = await page.screenshot({ scale: 'css', path: testInfo.outputPath('fast-scroll-loaded.png') });
  const width = testInfo.project.use.viewport!.width;
  expect(await luminanceRange(final, { left: 0, top: 210, width: Math.round(width * .42), height: 420 })).toBeGreaterThan(25);
});

for (const language of [{ code: 'ru', dir: 'ltr' }, { code: 'ar', dir: 'rtl' }]) test(`${language.code} change restores artwork and position in the first new frame`, async ({ page }, testInfo) => {
  await page.goto('/en');
  await page.evaluate(async () => {
    scrollTo({ top: 6500, behavior: 'instant' });
    await Promise.all([...document.querySelectorAll<HTMLImageElement>('.art img')]
      .filter(image => { const box = image.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; })
      .map(image => image.decode()));
  });
  await page.route(`**/${language.code}`, async route => { await new Promise(resolve => setTimeout(resolve, 600)); await route.continue(); });
  await page.locator('#locale-toggle').click();
  await page.evaluate(code => document.getElementById(`locale-option-${code}`)?.click(), language.code);
  await page.waitForURL(`**/${language.code}`, { waitUntil: 'domcontentloaded' });
  const frame = await page.screenshot({ scale: 'css', path: testInfo.outputPath('locale-first-frame.png') });
  const state = await page.evaluate(() => ({
    y: scrollY,
    locale: document.documentElement.lang,
    dir: document.documentElement.dir,
    visible: [...document.querySelectorAll<HTMLImageElement>('.art img')]
      .filter(image => { const box = image.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; })
      .every(image => image.complete && image.naturalWidth > 0),
  }));
  expect(Math.abs(state.y - 6500)).toBeLessThan(2);
  expect(state.locale).toBe(language.code);
  expect(state.dir).toBe(language.dir);
  expect(state.visible).toBe(true);
  const width = testInfo.project.use.viewport!.width;
  expect(await luminanceRange(frame, { left: 0, top: 210, width: Math.round(width * .42), height: 420 })).toBeGreaterThan(25);
});

test('a stalled image cannot hold language navigation indefinitely', async ({ page }) => {
  await page.goto('/en');
  await page.evaluate(() => {
    scrollTo({ top: 6500, behavior: 'instant' });
    for (const image of document.querySelectorAll<HTMLImageElement>('.art img')) {
      const box = image.getBoundingClientRect();
      if (box.top < innerHeight && box.bottom > 0) image.decode = () => new Promise(() => {});
    }
  });
  await page.locator('#locale-toggle').click();
  await page.getByRole('link', { name: 'Русский' }).click();
  await page.waitForURL('**/ru', { waitUntil: 'domcontentloaded', timeout: 7000 });
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(6400);
});
