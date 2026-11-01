import { test, expect, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';

const capture = process.env.PROJECT_FOCUS_CAPTURE_DIR ?? 'screenshots/video/projects/rev/focus';
const projects = ['ramsider', 'ramsmobile', 'ramswear', 'ramsfood'];
async function settleArtwork(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>('.tail-art img')].filter(img => { const box = img.getBoundingClientRect(); return box.top < innerHeight && box.bottom > 0; }).every(img => img.complete && img.naturalWidth > 0 && (!img.hasAttribute('data-original') || img.hasAttribute('data-media-ready'))), null, { timeout: 60000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
test.use({ serviceWorkers: 'block' });
test.setTimeout(120000);
test('project selection and return keep cards free of rectangles with localized keyboard focus', async ({ page }, info) => {
  await silenceTestMedia(page); await mkdir(capture, { recursive: true });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const results = [];
  const locales = process.env.PUBLIC_PROJECT_TESTS ? ['en'] : ['en', 'ar'];
  for (const locale of locales) {
    if (locale === 'ar') await page.route('**/ar', async route => route.fulfill({ contentType: 'text/html', body: await readFile('.next/server/app/ar.html', 'utf8') }));
    await page.goto(`/${locale}`); await page.evaluate(() => document.fonts.ready);
    for (const project of projects) {
      const card = page.locator(`#project-${project}`), panel = page.locator(project === 'ramsfood' ? '#project-detail-4' : '#product-film');
      await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(120);
      const y = await page.evaluate(() => scrollY);
      await card.click(); await expect(panel).toBeVisible(); await page.keyboard.press('Escape'); await expect(panel).not.toBeVisible();
      // Film returns focus explicitly; native description dialog follows native button focus semantics.
      if (project !== 'ramsfood') await expect(card).toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBeCloseTo(y, 0);
      const pointer = await card.evaluate(el => ({ outlineStyle: getComputedStyle(el).outlineStyle, border: getComputedStyle(el).borderWidth, shadow: getComputedStyle(el).boxShadow }));
      expect(pointer).toEqual({ outlineStyle: 'none', border: '0px', shadow: 'none' });
      await settleArtwork(page);
      if (project === 'ramsider' || project === 'ramsmobile') await page.screenshot({ path: `${capture}/${info.project.name}-${locale}-${project}-returned.png` });
      await card.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await expect(card).toBeFocused();
      const keyboard = await card.evaluate(el => ({ focusVisible: el.matches(':focus-visible'), cardOutline: getComputedStyle(el).outlineWidth, arrowOutline: getComputedStyle(el.querySelector('.project-arrow')!).outlineWidth }));
      expect(keyboard).toEqual({ focusVisible: true, cardOutline: '0px', arrowOutline: '2px' });
      await page.screenshot({ path: `${capture}/${info.project.name}-${locale}-${project}-keyboard.png` });
      await page.keyboard.press('Enter'); await expect(panel).toBeVisible(); await page.keyboard.press('Escape'); await expect(panel).not.toBeVisible(); await expect(card).toBeFocused();
      expect(await card.evaluate(el => getComputedStyle(el).outlineWidth)).toBe('0px');
      if (project !== 'ramsfood') {
        await card.scrollIntoViewIfNeeded();
        const closeY = await page.evaluate(() => scrollY);
        await card.click(); await expect(panel).toBeVisible();
        await panel.locator('.product-film__close').click(); await expect(panel).not.toBeVisible(); await expect(card).toBeFocused();
        expect(await card.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('none');
        expect(await page.evaluate(() => scrollY)).toBeCloseTo(closeY, 0);
      }
      results.push({ locale, project, pointer, keyboard, scrollPreserved: true });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (locale === 'ar') await page.unroute('**/ar');
  }
  if (info.project.name === 'desktop-chromium' && !process.env.PUBLIC_PROJECT_TESTS) {
    for (const [width, height] of [[320, 740], [402, 560], [768, 1024]]) {
      await page.setViewportSize({ width, height }); await page.goto('/en');
      const card = page.locator('#project-ramsmobile'); await card.scrollIntoViewIfNeeded(); await card.click();
      await page.keyboard.press('Escape'); await expect(card).toBeFocused();
      expect(await card.evaluate(el => getComputedStyle(el).outlineWidth)).toBe('0px');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await settleArtwork(page);
      await page.screenshot({ path: `${capture}/${width}x${height}-returned.png` });
    }
  }
  expect(errors).toEqual([]); await writeFile(`${capture}/${info.project.name}.json`, JSON.stringify({ viewport: info.project.use.viewport, results, errors }, null, 2));
});
