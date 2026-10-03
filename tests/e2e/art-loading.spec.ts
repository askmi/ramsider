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

test('color-managed WebP tiles load after a fast distant scroll', async ({ page }, testInfo) => {
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
    expect(first.preview).toBe('none');

    await page.evaluate(() => scrollTo({ top: 6500, behavior: 'instant' }));
    const distant = await page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>('.art img')]
      .filter(image => { const box = image.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; })
      .map(image => ({ complete: image.complete, preview: getComputedStyle(image).backgroundImage })));
    expect(distant.length).toBeGreaterThan(0);
    expect(distant.some(image => !image.complete && image.preview.includes('data:image/webp;base64,'))).toBe(true);
    const preview = await page.evaluate(async () => {
      const visible = [...document.querySelectorAll<HTMLImageElement>('.art img')]
        .find(image => { const r = image.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
      const background = getComputedStyle(visible!).backgroundImage;
      const url = background.slice(5, -2);
      const image = new Image();
      image.src = url;
      await image.decode();
      return { width: image.naturalWidth, height: image.naturalHeight };
    });
    expect(preview.width).toBe(118);
    expect(preview.height).toBeGreaterThan(100);
  } finally {
    releaseImages();
  }
  await expect.poll(async () => page.locator('.art img, .tail-art img').evaluateAll(images => {
    const visible = images.filter(image => {
      const box = image.getBoundingClientRect();
      return box.top < innerHeight && box.bottom > 0;
    });
    return visible.length > 0 && visible.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0);
  }), { timeout: 30000 }).toBe(true);
  await page.evaluate(() => Promise.all([...document.querySelectorAll<HTMLImageElement>('.art img, .tail-art img')]
    .filter(image => { const box = image.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; })
    .map(image => image.decode())));
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect.poll(() => page.locator('.art img').evaluateAll(images => images
    .filter(image => { const r = image.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })
    .every(image => getComputedStyle(image).backgroundImage === 'none'))).toBe(true);
  const final = await page.screenshot({ scale: 'css', path: testInfo.outputPath('fast-scroll-loaded.png') });
  const width = testInfo.project.use.viewport!.width;
  expect(await luminanceRange(final, { left: 0, top: 210, width: Math.round(width * .42), height: 420 })).toBeGreaterThan(25);
});

for (const language of [{ code: 'ru', dir: 'ltr' }, { code: 'ar', dir: 'rtl' }]) test(`${language.code} change keeps WebP artwork available after scrolling`, async ({ page }, testInfo) => {
  await page.goto('/en');
  await page.route(`**/${language.code}`, async route => { await new Promise(resolve => setTimeout(resolve, 600)); await route.continue(); });
  await page.locator('#locale-toggle').click();
  await page.evaluate(code => document.getElementById(`locale-option-${code}`)?.click(), language.code);
  await page.waitForURL(`**/${language.code}`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => scrollTo({ top: 6500, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>('.art img')]
    .filter(image => { const box = image.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; })
    .every(image => image.complete && image.naturalWidth > 0)), { timeout: 30000 }).toBe(true);
  await page.evaluate(() => Promise.all([...document.querySelectorAll<HTMLImageElement>('.art img')]
    .filter(image => { const box = image.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; })
    .map(image => image.decode())));
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
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
    document.querySelector<HTMLImageElement>('.art img')!.decode = () => new Promise(() => {});
  });
  await page.locator('#locale-toggle').click();
  await page.getByRole('link', { name: 'Русский' }).click();
  await page.waitForURL('**/ru', { waitUntil: 'domcontentloaded', timeout: 7000 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});
