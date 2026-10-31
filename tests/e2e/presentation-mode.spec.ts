import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('English presentation, three working destinations and hidden language controls', async ({ page, request }, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  if (info.project.name === 'iphone-17-pro-webkit') {
    for (const locale of ['de','fr','es','it','ru','tr','ar','zh','ja','ko']) {
      const response = await request.get(`/${locale}?demo=1`, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(response.headers().location).toBe('/en?demo=1');
    }
  }
  await page.goto('/ar?demo=1#hospitality-section');
  await expect(page).toHaveURL(/\/en\?demo=1#hospitality-section$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-story-media-ready'));
  await expect(page.locator('.locale-switcher')).toBeHidden();
  await page.evaluate(() => scrollTo(0, 0));
  const width = page.viewportSize()!.width;
  expect(await page.evaluate(() => innerWidth)).toBe(width);
  if (info.project.name.includes('iphone')) expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
  const dir = 'screenshots/presentation'; await mkdir(dir, { recursive: true });
  const capture = async (state: string) => { await page.waitForTimeout(350); await page.screenshot({ path: `${dir}/${info.project.name}-${state}.png`, scale: 'css' }); };
  await capture('hero');
  await page.locator('#choice').scrollIntoViewIfNeeded();
  await expect(page.locator('#choice-learn')).toBeHidden();
  await expect(page.locator('#fire-learn')).toBeAttached();
  await capture('freedom');
  await page.evaluate(() => scrollTo(0, 0));
  const toggle = page.locator('#navigation-toggle'), nav = page.locator('.menu nav');
  await toggle.click();
  await expect(nav.locator('a')).toHaveText(['Video Gallery','Hospitality Solutions','Contacts']);
  await capture('menu');
  await page.keyboard.press('Escape'); await expect(toggle).toBeFocused();
  await expect(nav).toBeHidden();
  await toggle.click(); await page.locator('#navigation-hospitality').click();
  await expect(nav).toBeHidden();
  await expect(page.locator('#hospitality-section')).toBeInViewport();
  await expect(page.locator('#hospitality')).toBeInViewport();
  await expect(page.locator('#hospitality-explore')).toBeInViewport();
  await capture('hospitality');
  await expect(page.locator('#hospitality-explore')).toHaveAttribute('href', 'https://hospitality.ramsider.com/');
  await page.route('https://hospitality.ramsider.com/', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Hospitality destination</title>' }));
  await page.locator('#hospitality-explore').click();
  await expect(page).toHaveURL('https://hospitality.ramsider.com/');
  await page.goto('/en');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-story-media-ready'));

  await page.evaluate(() => scrollTo(0, 0));
  await toggle.click(); await page.locator('#navigation-video').click();
  await expect(page.locator('#film-play')).toBeInViewport();
  await page.locator('#film-play').click();
  await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'gallery');
  await expect(page.locator('.film-gallery__item')).toHaveCount(7);
  await capture('gallery');
  await page.locator('#product-film .product-film__close').click();
  await page.evaluate(() => scrollTo(0, 0));
  await toggle.click(); await page.locator('#navigation-contact').click();
  await expect(page.locator('#company-contact')).toBeInViewport();
  await capture('contacts');
  const positions = await page.evaluate(async () => {
    const result = [];
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * .9) {
      scrollTo({ top: y, behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 40));
      result.push({ y: scrollY, overflow: document.documentElement.scrollWidth > innerWidth });
    }
    scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    return { result, endGap: document.documentElement.scrollHeight - innerHeight - scrollY };
  });
  expect(positions.result.every(p => !p.overflow)).toBe(true);
  expect(Math.abs(positions.endGap)).toBeLessThanOrEqual(1);
  await capture('footer');
  for (const viewport of [{width:320,height:650},{width:768,height:1024}]) {
    await page.setViewportSize(viewport); await page.evaluate(() => scrollTo(0,0));
    await toggle.click(); await expect(nav.locator('a')).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(`menu-${viewport.width}`); await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});
