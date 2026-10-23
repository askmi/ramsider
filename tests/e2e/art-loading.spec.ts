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

for (const language of [{ code: 'ru', dir: 'ltr' }, { code: 'ar', dir: 'rtl' }]) test(`${language.code} change keeps WebP artwork available after scrolling`, async ({ page }, testInfo) => {
  await page.goto('/en');
  await page.route(`**/${language.code}`, async route => { await new Promise(resolve => setTimeout(resolve, 600)); await route.continue(); });
  await page.locator('#locale-toggle').click();
  await page.evaluate(code => document.getElementById(`locale-option-${code}`)?.click(), language.code);
  await page.waitForURL(`**/${language.code}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-story-media-ready'));
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
  let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/art/11.webp',async route=>{await held;await route.continue().catch(()=>{});});
  try {
  await page.goto('/en');
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-media-hydrated'));
  await expect(page.locator('.art img').first()).toHaveAttribute('data-media-ready','');
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await page.locator('#locale-toggle').click();
  await page.getByRole('link', { name: 'Русский' }).click();
  await page.waitForURL('**/ru', { waitUntil: 'domcontentloaded', timeout: 7000 });
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  } finally {release();}
});
