import { chromium } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3021';
const browser = await chromium.launch();
const cases = [];

for (const [width, height] of [[320, 700], [375, 812], [768, 1024], [1440, 900]]) {
  const locales = width === 375 || width === 768
    ? ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']
    : ['en', 'ar'];
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  for (const locale of locales) {
    try {
      await page.goto(`${baseURL}/${locale}`);
      await page.waitForLoadState('networkidle');
      await page.locator('[data-technology-open]').first().click();
      const viewer = page.locator('#technology-viewer');
      await viewer.waitFor({ state: 'visible' });
      await viewer.locator('.technology-viewer__frame').evaluate(image => image.decode());
      const dots = viewer.locator('.technology-viewer__dots button');
      const geometry = await page.evaluate(() => {
        const rect = selector => {
          const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
          return { x, y, width, height };
        };
        return {
          viewport: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          frameLoaded: document.querySelector('.technology-viewer__frame').naturalWidth === 941,
          frame: rect('.technology-viewer__frame'),
          stage: rect('.technology-viewer__stage'),
          top: rect('.technology-viewer__next-image'),
          bottom: rect('.technology-viewer__next-group'),
          close: rect('.technology-viewer__close'),
          topText: rect('.technology-viewer__next-image span'),
          bottomText: rect('.technology-viewer__next-group span'),
          font: getComputedStyle(document.querySelector('.technology-viewer__next-image')).fontFamily,
          arrows: [...document.querySelectorAll('.technology-viewer__next-image img,.technology-viewer__next-group img')].map(image => image.getAttribute('src')),
        };
      });
      const dotRects = await dots.evaluateAll(elements => elements.map(element => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }));
      await viewer.locator('.technology-viewer__next-image').click({ timeout: 5000 });
      await page.waitForFunction(() => document.querySelector('.technology-viewer__stage img')?.getAttribute('src')?.includes('03.png'), null, { timeout: 5000 });
      const topActive = await dots.nth(1).getAttribute('aria-current');
      await dots.nth(3).click({ timeout: 5000 });
      await page.waitForFunction(() => document.querySelector('.technology-viewer__stage img')?.getAttribute('src')?.includes('05.png'), null, { timeout: 5000 });
      const dotActive = await dots.nth(3).getAttribute('aria-current');
      await viewer.locator('.technology-viewer__next-group').click({ timeout: 5000 });
      const notice = await viewer.getByRole('status').textContent();
      const activeCount = await viewer.locator('.technology-viewer__dots button[aria-current="true"]').count();
      const insideViewport = (rect, minimumWidth = 44) => rect.width >= minimumWidth && rect.height >= 44 && rect.x >= 0 && rect.x + rect.width <= width + 1 && rect.y >= 0 && rect.y + rect.height <= height + 1;
      const stage = geometry.stage;
      const frame = geometry.frame;
      const contains = (outer, inner) => inner.x >= outer.x - 1 && inner.y >= outer.y - 1 && inner.x + inner.width <= outer.x + outer.width + 1 && inner.y + inner.height <= outer.y + outer.height + 1;
      const overlaps = (a, b) => Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > .1 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > .1;
      const pass = geometry.viewport === width && geometry.scrollWidth <= width && geometry.frameLoaded
        && stage.x >= frame.x && stage.x + stage.width <= frame.x + frame.width + 1
        && stage.y >= frame.y && stage.y + stage.height <= frame.y + frame.height + 1
        && await dots.count() === 4 && [geometry.top, geometry.bottom, geometry.close].every(rect => insideViewport(rect)) && dotRects.every(rect => insideViewport(rect, 24))
        && dotRects.every(rect => rect.y >= geometry.top.y + geometry.top.height - 0.1)
        && !overlaps(geometry.top, geometry.close) && contains(geometry.top, geometry.topText) && contains(geometry.bottom, geometry.bottomText)
        && geometry.font.startsWith('OpenSans') && geometry.arrows.join(',') === '/art/technology/arrow-right.png,/art/technology/arrow-down.png'
        && topActive === 'true' && dotActive === 'true' && activeCount === 1 && !!notice?.trim();
      cases.push({ locale, width, height, pass, notice, topActive, dotActive, activeCount, geometry, dotRects });
    } catch (error) {
      cases.push({ locale, width, height, pass: false, error: String(error).slice(0, 500) });
    }
  }
  await context.close();
}

console.log(JSON.stringify({ summary: { total: cases.length, passed: cases.filter(item => item.pass).length, failed: cases.filter(item => !item.pass).map(item => `${item.locale}-${item.width}`) }, cases }, null, 2));
await browser.close();
if (cases.some(item => !item.pass)) process.exitCode = 1;
