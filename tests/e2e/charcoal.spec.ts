import { test, expect } from '@playwright/test';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const dialogSelector = '#charcoal-viewer';
async function open(page: import('@playwright/test').Page, locale = 'en') {
  await page.goto(`/${locale}`);
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#fire-learn').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('.page-media-overlay'));
  await page.locator('#fire-learn').click();
  await expect(page.locator(dialogSelector)).toBeVisible();
  await expect(page.locator('.charcoal-art[data-charcoal-ready=true]')).toHaveCount(12);
}

test('four blocks, fixed close, focus and scroll restoration, and full bottom access', async ({ page }, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await open(page);
  const saved = await page.evaluate(() => scrollY);
  const viewport = await page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio }));
  if (info.project.name.includes('iphone')) expect(viewport).toEqual({ width: info.project.name.includes('max') ? 440 : 402, dpr: 3 });
  const modal = page.locator(dialogSelector), scroll = page.locator('.charcoal-viewer__scroll');
  await expect(modal.locator('section')).toHaveCount(4);
  await expect(modal.locator('h2')).toHaveCount(4);
  await expect(modal.locator('p')).toHaveCount(4);
  await expect(modal.locator('h2')).toHaveText(['What Charcoal\nLeaves Behind.', 'No Color. No Warning.', 'Water Does Not Make It Safe.', 'Why We Removed Fire.']);
  const headingType = await page.locator('#fire').evaluate(e => { const s = getComputedStyle(e); return { size: parseFloat(s.fontSize), weight: s.fontWeight, line: parseFloat(s.lineHeight) }; });
  expect(headingType.size).toBeCloseTo(Math.min(viewport.width, 941) * 58 / 941, 2);
  for (const title of await modal.locator('h2').all()) {
    const actual = await title.evaluate(e => { const s = getComputedStyle(e); return { size: parseFloat(s.fontSize), weight: s.fontWeight, line: parseFloat(s.lineHeight), transform: s.textTransform }; });
    expect(actual.size).toBeCloseTo(headingType.size, 2);
    expect(actual.line).toBeCloseTo(headingType.line, 2);
    expect(actual.weight).toBe('400');
    expect(actual.transform).toBe('none');
  }
  await expect(modal).toContainText('It does not make inhalation risk-free.');
  const close = modal.getByRole('button', { name: 'Close', exact: true });
  const initialClose = (await close.boundingBox())!;
  expect(initialClose.width).toBeGreaterThanOrEqual(44);
  expect(initialClose.height).toBeGreaterThanOrEqual(44);
  await mkdir('screenshots/charcoal', { recursive: true });
  for (const [index, section] of (await modal.locator('section').all()).entries()) {
    const y = await section.evaluate(e => (e as HTMLElement).offsetTop);
    await scroll.evaluate((e, top) => e.scrollTop = top, y);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const box = (await close.boundingBox())!;
    expect(box.y).toBeCloseTo(initialClose.y, 0);
    expect(box.x).toBeCloseTo(initialClose.x, 0);
    const geometry = await section.locator('img').evaluateAll(images => images.map((image) => {const e=image as HTMLImageElement;return { width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height, sw: e.naturalWidth, sh: e.naturalHeight };}));
    for (const tile of geometry) {
      expect(tile.sw).toBe(1080);
      expect(tile.sh).toBeLessThanOrEqual(754);
      expect(tile.width).toBeCloseTo(Math.min(viewport.width, 941), 0);
      expect(Math.abs(tile.height - tile.width * tile.sh / tile.sw)).toBeLessThan(1);
    }
    const capture = await page.screenshot({ path: `screenshots/charcoal/final-${info.project.name}-block-${index + 1}.png`, scale: 'css' });
    // A decoded offscreen IMG can still fail to paint when only its top enters view.
    // Detect the exact repeat-row fallback symptom in the partial next artwork.
    if (index < 3) {
      const next = (await modal.locator('section').nth(index + 1).boundingBox())!;
      const screen = page.viewportSize()!;
      const y = Math.ceil(next.y) + 3, h = screen.height - y - 2;
      if (y >= 0 && h > 12) {
        const pixels = await sharp(capture).extract({ left: Math.ceil(next.x), top: y, width: Math.floor(next.width), height: h }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        let varying = 0;
        const stride = pixels.info.width * 3;
        for (let row = 1; row < h; row++) for (let x = 0; x < stride; x++) if (pixels.data[row * stride + x] !== pixels.data[x]) varying++;
        expect(varying, `partial next block ${index + 2} must paint, not repeat one background row`).toBeGreaterThan(pixels.info.width * 2);
      }
    }
  }
  await scroll.evaluate(e => e.scrollTop = e.scrollHeight);
  expect(await scroll.evaluate(e => Math.abs(e.querySelector('article')!.getBoundingClientRect().bottom - e.getBoundingClientRect().bottom)), 'Hidden raster tail must not extend scrollable height').toBeLessThan(1);
  await expect(modal.locator('footer')).toHaveCount(0);
  await expect(modal.locator('p').last()).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: `screenshots/charcoal/final-${info.project.name}-bottom.png`, scale: 'css' });
  await close.click();
  await expect(modal).not.toBeVisible();
  await expect(page.locator('#fire-learn')).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(saved, 0);
  await page.locator('#fire-learn').focus();
  await page.keyboard.press('Enter');
  await expect(modal).toBeVisible();
  await expect.poll(() => scroll.evaluate(e => e.scrollTop)).toBe(0);
  expect(await scroll.locator('article').count(), 'Native visible dialog must already contain its reading content').toBe(1);
  await scroll.focus();
  await page.keyboard.press('End');
  await expect.poll(() => scroll.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('#charcoal-viewer'))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(page.locator('#fire-learn')).toBeFocused();
  await page.locator('#choice-learn').click();
  await expect(modal).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('#anew');
  expect(errors).toEqual([]);
});

test('all locales, Arabic RTL, smaller height and representative responsive widths', async ({ page }, info) => {
  test.setTimeout(180000);
  test.skip(!info.project.name.includes('iphone'), 'Locale matrix once per required mobile profile.');
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    await open(page, locale);
    const result = await page.locator('.charcoal-ribbon').evaluate(e => ({
      width: e.getBoundingClientRect().width, overflow: e.scrollWidth,
      direction: getComputedStyle(e).direction,
      referenceSize: parseFloat(getComputedStyle(document.querySelector('#fire')!).fontSize),
      headings: [...e.querySelectorAll('h2')].map(h => ({ text: h.textContent!, size: parseFloat(getComputedStyle(h).fontSize) })),
      texts: [...e.querySelectorAll('h2,p')].map(t => ({ text: t.textContent, size: parseFloat(getComputedStyle(t).fontSize), font: getComputedStyle(t).fontFamily, rect: t.getBoundingClientRect().toJSON() })),
      sections: [...e.querySelectorAll('section')].map(section => ({ section: section.getBoundingClientRect().toJSON(), p: section.querySelector('p')!.getBoundingClientRect().toJSON() })),
    }));
    expect(result.overflow).toBeLessThanOrEqual(result.width + 1);
    expect(result.direction).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    for (const title of result.headings) {
      expect(title.size).toBeCloseTo(result.referenceSize, 2);
      if (/\p{Lu}/u.test(title.text)) expect(title.text).not.toBe(title.text.toLocaleUpperCase(locale));
    }
    for (const text of result.texts) { expect(text.text).toBeTruthy(); expect(text.font).toContain('OpenSans'); expect(text.size).toBeGreaterThanOrEqual(16); expect(text.rect.x).toBeGreaterThanOrEqual(0); expect(text.rect.right).toBeLessThanOrEqual(result.width + 1); }
    for (const section of result.sections) expect(section.p.bottom).toBeLessThanOrEqual(section.section.bottom);
    if (['ar', 'ru', 'de', 'fr'].includes(locale)) {
      await page.locator('.charcoal-viewer__scroll').evaluate(e => e.scrollTop = 0);
      await page.screenshot({ path: `screenshots/charcoal/locale-${info.project.name}-${locale}.png`, scale: 'css' });
    }
    await page.keyboard.press('Escape');
  }
  if (!info.project.name.includes('max')) {
    for (const [width, height] of [[402, 600], [375, 812], [768, 1024], [1440, 900]]) {
      await page.setViewportSize({ width, height });
      await open(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.locator('.charcoal-viewer__scroll').evaluate(e => e.scrollTop = e.scrollHeight);
      await expect(page.locator('.charcoal-section--4 p')).toBeInViewport({ ratio: 1 });
      await page.screenshot({ path: `screenshots/charcoal/adaptation-${width}x${height}-bottom.png`, scale: 'css' });
      await page.locator('.charcoal-viewer__scroll').evaluate(e => e.scrollTop = 0);
      await page.screenshot({ path: `screenshots/charcoal/adaptation-${width}x${height}-top.png`, scale: 'css' });
      await page.keyboard.press('Escape');
    }
  }
});

test('all lossless WebP blocks warm concurrently after window load and are reused on open', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/en');
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource').filter(e => e.name.includes('/art/charcoal/')).length)).toBe(12);
  const timing = await page.evaluate(() => ({ load: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).loadEventStart, entries: performance.getEntriesByType('resource').filter(e => e.name.includes('/art/charcoal/')).map(e => ({ start: e.startTime, type: (e as PerformanceResourceTiming).initiatorType })) }));
  for (const entry of timing.entries) { expect(entry.start).toBeGreaterThanOrEqual(timing.load); expect(entry.type).toBe('fetch'); }
  expect(Math.max(...timing.entries.map(e => e.start)) - Math.min(...timing.entries.map(e => e.start))).toBeLessThan(50);
  await page.locator('#fire-learn').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('.page-media-overlay'));
  await page.locator('#fire-learn').click();
  await expect(page.locator('.charcoal-art[data-charcoal-ready=true]')).toHaveCount(12);
  await page.keyboard.press('Escape');
  await page.locator('#fire-learn').click();
  await expect(page.locator('.charcoal-art[data-charcoal-ready=true]')).toHaveCount(12);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').filter(e => e.name.includes('/art/charcoal/')).length)).toBe(12);
});

test('failed image retries through shared loader; close stays usable while pending', async ({ page }) => {
  test.setTimeout(120000);
  let failed = true;
  await page.route('**/art/charcoal/1-0.webp', async route => {
    if (failed) await route.abort(); else await route.continue();
  });
  await page.goto('/en');
  await page.locator('#fire-learn').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('.page-media-overlay'));
  await page.locator('#fire-learn').click();
  await expect(page.getByText('The image could not load.', { exact: true })).toBeVisible();
  await page.locator('.charcoal-viewer__close').click();
  await expect(page.locator(dialogSelector)).not.toBeVisible();
  await page.locator('#fire-learn').click();
  await expect(page.getByText('The image could not load.', { exact: true })).toBeVisible();
  failed = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.charcoal-section--1 img[data-charcoal-ready=true]')).toHaveCount(3);
  await expect(page.getByText('The image could not load.', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
});


test('rapid native close and reopen keeps content and first keyboard input usable', async ({ page }) => {
  test.setTimeout(120000);
  await open(page);
  const scroll = page.locator('.charcoal-viewer__scroll');
  for (let i = 0; i < 4; i++) {
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.locator('#fire-learn').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(dialogSelector)).toBeVisible();
    expect(await scroll.locator('article').count()).toBe(1);
    expect(await scroll.evaluate(e => e.scrollTop)).toBe(0);
    await scroll.focus();
    await page.keyboard.press('End');
    await expect.poll(() => scroll.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  }
  await page.keyboard.press('Escape');
  await expect(page.locator(dialogSelector)).not.toBeVisible();
});

test('narrow translated last-tile Retry stays fully usable', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One narrow translated mobile regression.');
  await page.setViewportSize({ width: 280, height: 600 });
  let failed = true;
  await page.route('**/art/charcoal/3-2.webp', route => failed ? route.abort() : route.continue());
  await page.goto('/de');
  await page.locator('#fire-learn').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('.page-media-overlay'));
  await page.locator('#fire-learn').click();
  const retry = page.getByRole('button', { name: 'Erneut versuchen', exact: true });
  await retry.scrollIntoViewIfNeeded();
  await expect(retry).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: 'screenshots/charcoal/footer-correction/narrow-retry.png', scale: 'css' });
  failed = false;
  await retry.click();
  await expect(page.locator('.charcoal-section--3 img[data-charcoal-ready=true]')).toHaveCount(3);
  await expect(retry).toHaveCount(0);
  await page.locator('.charcoal-viewer__close').click();
  await expect(page.locator(dialogSelector)).not.toBeVisible();
});
