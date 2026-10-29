import { test, expect, type Page } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.setTimeout(120000);
test.beforeEach(async ({ page }) => silenceTestMedia(page));
const titles = ['Ramsider Uno Product Introduction', 'Pure Gold', 'Evolution', 'Our Style', 'DIY Madness', 'Copycats', 'Inside Ramsider'];
// Measured source-photo apertures, excluding actual encoded matte, not dark scene content.
const apertures = [[0, 0, 1280, 715], [0, 0, 1280, 591], [0, 22, 1280, 553], [49, 43, 1182, 484], [19, 98, 1242, 493], [0, 0, 1280, 591], [114, 0, 1052, 591]];
async function readyPoster(page: Page) {
  await page.locator('.film-gallery__hero img').evaluate(async el => { const im = el as HTMLImageElement; await im.decode(); });
  await page.evaluate(() => document.fonts.ready);
}
for (const locale of ['en', 'ar']) test(`${locale}: selected title and actual preview photo reach portrait screen edges`, async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Mobile WebKit composition owners');
  const widths = info.project.name.includes('max') ? [440] : [402, 390];
  for (const width of widths) for (const height of [width === 390 ? 844 : width === 402 ? 874 : 956, 650]) {
    await page.setViewportSize({ width, height }); await page.goto(`/${locale}`);
    await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click();
    expect(await page.evaluate(() => [innerWidth, devicePixelRatio])).toEqual([width, 3]);
    for (let i = 0; i < titles.length; i++) {
      await page.locator('.film-gallery__item').nth(i).click(); await readyPoster(page);
      await expect(page.locator('#product-film-title')).toHaveText(titles[i]);
      await expect(page.locator('.film-gallery__caption')).not.toContainText(titles[i]);
      await expect(page.locator('.film-gallery__caption span')).toHaveAttribute('dir', 'ltr');
      await expect(page.locator('.film-gallery')).not.toContainText(/UNO Films|Фильмы UNO|أفلام UNO/);
      const g = await page.locator('.film-gallery__hero img').evaluate((el, crop) => {
        const im = el as HTMLImageElement, r = im.getBoundingClientRect(), h = im.closest('button')!.getBoundingClientRect();
        const [x, y, w, height] = crop, scale = r.width / im.naturalWidth;
        return { left: r.left + x * scale, right: r.left + (x + w) * scale, top: r.top + y * scale, bottom: r.top + (y + height) * scale, scaleX: scale, scaleY: r.height / im.naturalHeight, host: { x: h.x, y: h.y, width: h.width, height: h.height }, scroll: document.documentElement.scrollWidth };
      }, apertures[i]);
      expect(Math.abs(g.left)).toBeLessThanOrEqual(1); expect(Math.abs(g.right - width)).toBeLessThanOrEqual(1);
      expect(Math.abs(g.top - g.host.y)).toBeLessThanOrEqual(1); expect(Math.abs(g.bottom - g.host.y - g.host.height)).toBeLessThanOrEqual(1);
      expect(Math.abs(g.scaleX - g.scaleY)).toBeLessThan(.001); expect(g.scroll).toBe(width);
      const title = await page.locator('#product-film-title').boundingBox(); expect(title!.y + title!.height).toBeLessThanOrEqual(g.host.y);
      const close = page.locator('.product-film__close'); await expect(close).toBeVisible();
      if (height !== 650 && [0, 3, 4, 6].includes(i)) await page.screenshot({ path: `screenshots/video/preview-width/${info.project.name}-${width}-${locale}-${i + 1}.png` });
    }
    await page.locator('.product-film__close').click();
  }
});


test('gallery remains reachable at narrow/wide sizes and all eleven locales', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One responsive/locale owner');
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    await page.setViewportSize({ width: 390, height: 844 }); await page.goto(`/${locale}`);
    await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click();
    await expect(page.locator('#product-film-title')).toHaveText(titles[0]);
    await expect(page.locator('#product-film')).not.toContainText(/UNO Films|English Audio|Original Audio/);
    await expect(page.locator('#product-film-hint')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.locator('.product-film__close').click();
  }
  for (const width of [280, 320, 510, 768, 1440]) for (const locale of ['en', 'ar']) {
    await page.setViewportSize({ width, height: width >= 768 ? 400 : 844 }); await page.goto(`/${locale}`);
    await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click();
    for (let i = 0; i < titles.length; i++) {
      await page.locator('.film-gallery__item').nth(i).click(); await readyPoster(page);
      await expect(page.locator('#product-film-title')).toHaveText(titles[i]);
      await expect(page.locator('.film-gallery__item').nth(i).locator('.film-gallery__wide-number')).toHaveAttribute('dir', 'ltr');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      const hero = await page.locator('.film-gallery__hero').boundingBox();
      expect(hero!.x).toBeGreaterThanOrEqual(-1); expect(hero!.x + hero!.width).toBeLessThanOrEqual(width + 1);
      expect(hero!.y).toBeGreaterThanOrEqual(-1); expect(hero!.y + hero!.height).toBeLessThanOrEqual((width >= 768 ? 400 : 844) + 1);
      const close = page.locator('.product-film__close');
      expect(await close.evaluate(el => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el || el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
    }
    if (width >= 768) await page.screenshot({ path: `screenshots/video/preview-width/chromium-${width}-${locale}-gallery.png` });
    await page.locator('.product-film__close').click();
  }
});
