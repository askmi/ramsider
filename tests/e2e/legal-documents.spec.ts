import { expect, test, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { legalCopy, legalDocuments, legalHref } from '../../lib/legal-copy';
import { locales } from '../../lib/i18n';

const root = process.env.LEGAL_CAPTURE_DIR ?? 'screenshots/legal-documents/2026-11-18/local-1';
const sourceHashes = {
  privacy: '7538bc028c24ad8b68306b5d720d43143fa01ac42c875fb012d3a0ce10a1cf84',
  terms: '406cfe95239d247ee9a927246f07bf3b527372ae8a4e724d8872fbc978a88d71',
  delivery: '252c1487f756bd70b49a16d60613a34300594ec23f7e40b69e1c7d8d2e9d5673',
};
const normalize = (text: string) => text.replaceAll('&quot;', '"').replace(/\s+/g, ' ').trim();

async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => innerWidth)).toBe(page.viewportSize()!.width);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
}

async function capture(page: Page, name: string) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: `${root}/${test.info().project.name}/${name}.png` });
}

test('complete English documents, clause anchors and compatibility URLs', async ({ page, request }, info) => {
  test.setTimeout(120000);
  await mkdir(`${root}/${info.project.name}`, { recursive: true });
  const approvedTexts: Record<typeof legalDocuments[number], string> = JSON.parse(await readFile('lib/legal-documents.json', 'utf8'));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const checks = [];
  for (const document of legalDocuments) {
    const response = await page.goto(legalHref(document)); expect(response?.status()).toBe(200);
    await ready(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    if (info.project.name.includes('iphone')) expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
    const source = approvedTexts[document];
    expect(createHash('sha256').update(source).digest('hex')).toBe(sourceHashes[document]);
    expect(normalize(await page.locator('article').innerText())).toBe(normalize(source));
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://ramsider.com${legalHref(document)}`);
    expect(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, `${document}-top`);
    if (document === 'privacy') {
      await page.locator('table').scrollIntoViewIfNeeded();
      await expect(page.locator('table thead th')).toHaveCount(3);
      await expect(page.locator('table tbody tr')).toHaveCount(9);
      await capture(page, 'privacy-table');
      await page.locator('table thead').scrollIntoViewIfNeeded(); await capture(page, 'privacy-table-start');
      await page.locator('table tbody tr').last().scrollIntoViewIfNeeded(); await capture(page, 'privacy-table-end');
    }
    await page.locator('article > p').last().scrollIntoViewIfNeeded();
    await capture(page, `${document}-end`);
    const footer = page.locator('.site-footer'); await footer.scrollIntoViewIfNeeded();
    await expect(footer).toHaveClass(/site-footer--plain/);
    await expect(footer.locator('img')).toHaveCount(0);
    const theme = await footer.evaluate(el => {
      const page = el.parentElement!;
      return {
        pageBackground: getComputedStyle(page).backgroundColor,
        footerBackground: getComputedStyle(el).backgroundColor,
        pageFont: getComputedStyle(page).fontFamily,
        footerFont: getComputedStyle(el).fontFamily,
        regularLoaded: [...window.document.fonts].some(face => face.family === 'OpenSans' && face.weight === '400' && face.status === 'loaded'),
        rasterRequests: performance.getEntriesByType('resource').filter(entry => /\/art\//.test(entry.name)).map(entry => entry.name),
      };
    });
    expect(theme.pageBackground).toBe('rgb(243, 231, 217)');
    expect(theme.footerBackground).toBe(theme.pageBackground);
    expect(theme.footerFont).toBe(theme.pageFont);
    expect(theme.footerFont).toContain('OpenSans');
    expect(theme.regularLoaded).toBe(true);
    expect(theme.rasterRequests).toEqual([]);
    await capture(page, `${document}-footer`);
    const alias = await request.get(`/${document}`, { maxRedirects: 0 });
    expect(alias.status()).toBe(308); expect(alias.headers().location).toBe(legalHref(document));
    checks.push({ document, textParity: true, alias: alias.status(), sourceCharacters: source.length, theme });
  }
  for (const path of ['/en/missing-document', '/en/privacy/extra', '/Privacy_RU.txt']) expect((await request.get(path)).status()).toBe(404);
  await page.goto('/terms#6.3'); await ready(page);
  await expect(page).toHaveURL(/\/en\/terms#6\.3$/);
  await expect(page.locator('[id="6.3"]')).toBeInViewport();
  await expect(page.locator('[id="6.3"]')).toContainText('The Seller delivers the Goods both within the UAE and abroad.');
  await capture(page, 'terms-clause');
  expect(errors).toEqual([]);
  await writeFile(`${root}/${info.project.name}/documents.json`, JSON.stringify({ checks, errors }, null, 2));
});

test('landing footer links and original FAQ reference navigate to the English text', async ({ page }, info) => {
  test.setTimeout(120000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/en'); await ready(page);
  const footer = page.locator('.site-footer'); await footer.scrollIntoViewIfNeeded();
  await expect(page.locator('.site-footer__art')).toHaveAttribute('data-media-ready', '', { timeout: 60000 });
  await expect(page.locator('html')).toHaveAttribute('data-story-media-ready', '', { timeout: 60000 });
  const fields = await footer.locator('section').evaluateAll(nodes => nodes.map(s => ({ text: (s as HTMLElement).innerText, x: s.getBoundingClientRect().x, width: s.getBoundingClientRect().width, height: s.getBoundingClientRect().height })));
  await capture(page, 'landing-footer');
  for (const document of legalDocuments) {
    const link = page.locator(`.site-footer__documents a[href="${legalHref(document)}"]`);
    await expect(link).toHaveAttribute('hreflang', 'en');
    const box = await link.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44);
    await link.click(); await expect(page).toHaveURL(new RegExp(`${legalHref(document)}$`));
    await expect(page.locator('article')).toBeVisible();
    await page.goBack(); await ready(page);
  }
  await expect(page.locator('.site-footer__documents a')).toHaveCount(3);
  await expect(page.locator('.site-footer__documents a[href*="/ru/"]')).toHaveCount(0);
  const summary = page.locator('#faq-shipping'); await summary.scrollIntoViewIfNeeded(); await summary.click();
  const link = page.getByRole('link', { name: 'Terms and Conditions of Sale §6.3', exact: true });
  await expect(link).toBeVisible(); await capture(page, 'faq-open'); await link.click();
  await expect(page).toHaveURL(/\/en\/terms#6\.3$/); await expect(page.locator('[id="6.3"]')).toBeInViewport();
  expect(errors).toEqual([]);
  await writeFile(`${root}/${info.project.name}/landing.json`, JSON.stringify({ fields, errors }, null, 2));
});

test('all eleven compiled locale footers keep English targets and Arabic FAQ navigation', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit' || Boolean(process.env.LEGAL_PUBLIC), 'One local compiled-locale fixture owner; public presentation redirects to English');
  test.setTimeout(240000);
  const checks = [];
  for (const locale of locales) {
    const html = await readFile(`.next/server/app/${locale}.html`, 'utf8');
    const pattern = `**/${locale}`;
    await page.route(pattern, route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.goto(`/${locale}`); await ready(page);
    const footer = page.locator('.site-footer'); await footer.scrollIntoViewIfNeeded();
    await expect(page.locator('.site-footer__art')).toHaveAttribute('data-media-ready', '', { timeout: 60000 });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    for (const document of legalDocuments) {
      const link = footer.getByRole('link', { name: legalCopy[locale][document], exact: true });
      await expect(link).toHaveAttribute('href', legalHref(document));
      const box = (await link.boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(403);
      expect(await link.evaluate(el => {
        const box = el.getBoundingClientRect();
        return el.contains(window.document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      })).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (locale === 'ar') {
      await capture(page, 'arabic-footer');
      const summary = page.locator('#faq-shipping'); await summary.scrollIntoViewIfNeeded(); await summary.click();
      const link = page.locator('.faq-stack a[href="/en/terms#6.3"]'); await expect(link).toContainText('6.3');
      await link.click(); await expect(page).toHaveURL(/\/en\/terms#6\.3$/); await expect(page.locator('[id="6.3"]')).toBeInViewport();
    }
    checks.push({ locale, links: 3, overflow: false }); await page.unroute(pattern);
  }
  await writeFile(`${root}/compiled-locales.json`, JSON.stringify({ method: 'local compiled SSG HTML fixture; public locale redirects unchanged', checks }, null, 2));
});

test('reading and document navigation adapt to small phones, tablet, desktop and keyboard', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Single responsive and keyboard owner');
  const checks = [];
  for (const [width, height] of [[320, 568], [375, 812], [768, 1024], [1024, 768], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    for (const document of legalDocuments) {
      await page.goto(legalHref(document)); await ready(page);
      expect(await page.evaluate(() => window.document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await capture(page, `delivery-${width}`); checks.push({ width, height, documents: 3, overflow: false });
  }
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/en/privacy'); await ready(page);
  await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'RAMSIDER UNO — Home' })).toBeFocused();
  for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
  const link = page.locator('.site-footer__documents a').first(); await expect(link).toBeFocused();
  expect(await link.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Tab'); await expect(page.locator('.site-footer__documents a').nth(1)).toBeFocused();
  await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/en\/terms$/);
  await writeFile(`${root}/responsive-keyboard.json`, JSON.stringify({ checks, keyboard: 'Tab/focus/Enter PASS' }, null, 2));
});
