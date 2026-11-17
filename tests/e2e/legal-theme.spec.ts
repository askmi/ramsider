import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const root = process.env.LEGAL_THEME_CAPTURE_DIR ?? 'screenshots/legal-documents/2026-11-18/uniform-theme/geometry';
const sizes = [[320, 568], [402, 874], [440, 956], [699, 900], [700, 900], [1023, 900], [1024, 900], [1440, 900], [2446, 1654]];

async function checkLinks(page: Page, width: number) {
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  const result = await page.locator('.site-footer__documents a').evaluateAll(links => links.map(link => {
    const box = link.getBoundingClientRect();
    return { x: box.x, y: box.y, width: box.width, height: box.height,
      hit: link.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)) };
  }));
  expect(result).toHaveLength(3);
  for (const link of result) {
    expect(link.height).toBeGreaterThanOrEqual(44); expect(link.hit).toBe(true);
    expect(link.x).toBeGreaterThanOrEqual(0); expect(link.x + link.width).toBeLessThanOrEqual(width + 1);
  }
  if (width >= 375) expect(Math.max(...result.map(link => link.y)) - Math.min(...result.map(link => link.y))).toBeLessThan(1);
  await expect(page.locator('.site-footer__document-language')).toHaveText('English');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  return result;
}

test('reading canvas stays uniform through the footer and utility navigation adapts', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Chromium owns platform-font and pixel matrix; primary WebKit screenshots run in legal-documents');
  test.setTimeout(180000); await mkdir(root, { recursive: true });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const checks = [], fontChecks = [];
  const cdp = await context.newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const name of ['privacy', 'terms', 'delivery']) {
      await page.goto(`/en/${name}`); await page.evaluate(() => document.fonts.ready);
      await page.locator('.site-footer').evaluate(footer => scrollTo({ top: footer.getBoundingClientRect().top + scrollY - 160, behavior: 'instant' }));
      const box = (await page.locator('.site-footer').boundingBox())!;
      const png = await page.screenshot({ path: `${root}/${name}-${width}-boundary.png` });
      const image = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const samples = [box.y - 8, box.y + 8, Math.min(box.y + box.height - 8, height - 8)].map(y => {
        const offset = (Math.round(y) * image.info.width + Math.round(box.x + 8)) * image.info.channels;
        return [...image.data.subarray(offset, offset + 3)];
      });
      for (const sample of samples) expect(sample).toEqual([243, 231, 217]);
      await expect(page.locator('.site-footer img')).toHaveCount(0);
      const links = await checkLinks(page, width);
      if (width === 1440) {
        const dom = await cdp.send('DOM.getDocument');
        for (const selector of ['h1', 'article p', '.site-footer__name', '.site-footer__documents a', ...(name === 'privacy' ? ['table th'] : [])]) {
          const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: dom.root.nodeId, selector });
          const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
          expect(fonts.length).toBeGreaterThan(0);
          for (const font of fonts) { expect(font.isCustomFont).toBe(true); expect(font.postScriptName).toBe('OpenSans-Regular'); }
          fontChecks.push({ name, selector, fonts });
        }
      }
      checks.push({ page: name, width, height, samples, links });
    }
  }
  await page.goto('/en'); await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-story-media-ready', '', { timeout: 60000 });
  const main = [];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.documentElement.style.setProperty('--page-safe-bottom', '70px'));
    const links = await checkLinks(page, width);
    const art = (await page.locator('.site-footer__art').boundingBox())!;
    const footer = (await page.locator('.site-footer').boundingBox())!;
    expect(Math.abs(art.height - art.width * 2588 / 941)).toBeLessThan(1);
    expect(art.height).toBeGreaterThanOrEqual(footer.height);
    await page.screenshot({ path: `${root}/landing-${width}-safe70.png` }); main.push({ width, height, links, art, footer });
  }
  expect(errors).toEqual([]);
  await writeFile(`${root}/verification.json`, JSON.stringify({ checks, fontChecks, main, errors }, null, 2));
});
