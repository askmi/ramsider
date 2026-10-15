import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

async function scene(page: Page, locale = 'en') {
  await page.goto(`/${locale}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.querySelectorAll('.art img')].slice(0, 2).every(i => i.hasAttribute('data-media-ready')));
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 2048 * Math.min(innerWidth, 941) / 941 - 24); });
  await expect(page.locator('.ember-scene__canvas')).toHaveAttribute('data-state', 'running');
  return page.locator('.ember-scene');
}

async function pixelChanges(a: Buffer, b: Buffer) {
  const first = await sharp(a).removeAlpha().raw().toBuffer();
  const next = await sharp(b).removeAlpha().raw().toBuffer();
  return first.reduce((sum, value, i) => sum + (Math.abs(value - next[i]) > 3 ? 1 : 0), 0);
}

test('real pixels move, pause freezes, offscreen/modal stop, reduced motion restores original', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const root = await scene(page);
  const surface = root.locator('canvas'), button = root.getByRole('button');
  const box = (await root.boundingBox())!;
  const width = Math.min(page.viewportSize()!.width, 941);
  expect(box.width).toBeCloseTo(width * 480 / 941, 1);
  expect(Math.abs(box.height - box.width * 760 / 480)).toBeLessThan(1);
  expect(await page.evaluate(() => innerWidth)).toBe(page.viewportSize()!.width);
  const buttonBox = (await button.boundingBox())!;
  expect(buttonBox.width).toBe(44); expect(buttonBox.height).toBe(44);
  expect(await surface.getAttribute('aria-hidden')).toBe('true');
  expect(await surface.evaluate(e => getComputedStyle(e).pointerEvents)).toBe('none');
  const before = await surface.screenshot();
  await page.waitForTimeout(1000);
  expect(await pixelChanges(before, await surface.screenshot())).toBeGreaterThan(100);
  await page.locator('#fire-learn').focus();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await page.keyboard.press('Space');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(surface).toHaveAttribute('data-state', 'paused');
  const stopped = await surface.screenshot();
  await page.waitForTimeout(500);
  expect(await pixelChanges(stopped, await surface.screenshot())).toBe(0);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(surface).toHaveAttribute('data-state', 'paused');
  await root.scrollIntoViewIfNeeded();
  await expect(surface).toHaveAttribute('data-state', 'paused');
  await button.click();
  await expect(surface).toHaveAttribute('data-state', 'running');
  await page.locator('#fire-learn').click();
  await expect(page.locator('#charcoal-viewer')).toBeVisible();
  await expect(surface).toHaveAttribute('data-state', 'paused');
  await page.keyboard.press('Escape');
  await expect(page.locator('#fire-learn')).toBeFocused();
  await expect(surface).toHaveAttribute('data-state', 'running');
  // Native dialog close restores the saved page position on its next animation frame.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(surface).toHaveAttribute('data-state', 'paused');
  const time = await surface.getAttribute('data-time');
  await page.waitForTimeout(400);
  expect(await surface.getAttribute('data-time')).toBe(time);
  await root.scrollIntoViewIfNeeded();
  await expect(surface).toHaveAttribute('data-state', 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(root).toHaveAttribute('data-motion', 'reduced');
  await expect(surface).not.toBeVisible(); await expect(button).not.toBeVisible();
  // Compare the scene itself; unrelated back-to-top opacity can still settle after scrolling.
  await page.waitForTimeout(350);
  const reducedBox = (await root.boundingBox())!;
  const region = { left: Math.ceil(reducedBox.x), top: Math.ceil(reducedBox.y), width: Math.floor(reducedBox.width)-1, height: Math.floor(reducedBox.height)-1 };
  const original = await page.screenshot({ scale: 'css' });
  await root.evaluate(e => (e as HTMLElement).style.display = 'none');
  const withoutLayer = await page.screenshot({ scale: 'css' });
  expect(await pixelChanges(await sharp(original).extract(region).png().toBuffer(), await sharp(withoutLayer).extract(region).png().toBuffer())).toBe(0);
  await root.evaluate(e => (e as HTMLElement).style.display = '');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(surface).toBeVisible();
  await expect(surface).toHaveAttribute('data-state', 'running');
  await mkdir('screenshots/ember', { recursive: true });
  await page.screenshot({ path: `screenshots/ember/test-${info.project.name}.png`, scale: 'css' });
  expect(errors).toEqual([]);
});

test('no first-viewport mask, reduced-motion startup and failed GPU preserve static content', async ({ page }) => {
  test.setTimeout(90000);
  const masks: string[] = [];
  page.on('request', req => { if (req.url().includes('/art/ember/')) masks.push(req.url()); });
  await page.goto('/en', { waitUntil: 'load' });
  await page.waitForTimeout(700);
  expect(masks).toHaveLength(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.ember-scene').scrollIntoViewIfNeeded();
  await expect(page.locator('.ember-scene')).toHaveAttribute('data-motion', 'reduced');
  await page.waitForTimeout(400);
  expect(masks).toHaveLength(0);
  await expect(page.locator('.ember-scene__toggle')).not.toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.ember-scene__canvas')).toHaveAttribute('data-state', 'running');
  const supported = await page.locator('canvas.ember-scene__canvas').evaluate(e => {
    const gl = (e as HTMLCanvasElement).getContext('webgl')!;
    const extension = gl.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext(); return true;
  });
  if (supported) {
    await expect(page.locator('.ember-scene__canvas')).not.toBeVisible();
    await expect(page.locator('.ember-scene__toggle')).not.toBeVisible();
  }
  await expect(page.locator('#fire-learn')).toBeVisible();
});

test('eleven localized motion labels, RTL and proportional adaptation', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'locale/adaptation matrix runs once on baseline WebKit');
  test.setTimeout(180000);
  for (const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']) {
    const root = await scene(page, locale);
    const button = root.getByRole('button');
    expect(await button.getAttribute('aria-label')).toBeTruthy();
    const bounds = (await root.boundingBox())!;
    expect(bounds.x).toBeCloseTo(402 * 260 / 941, 1);
    if (locale === 'ar') {
      await page.screenshot({ path: 'screenshots/ember/arabic.png', scale: 'css' });
      expect(await page.locator('html').getAttribute('dir')).toBe('rtl');
    }
    await button.click(); await expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(await button.getAttribute('aria-label')).not.toBe('Pause Ember Animation');
  }
  await scene(page);
  for (const [width,height] of [[375,812],[402,650],[768,1024],[1440,900]]) {
    await page.setViewportSize({ width,height });
    await page.locator('.ember-scene').scrollIntoViewIfNeeded();
    await expect(page.locator('.ember-scene__canvas')).toHaveAttribute('data-state', 'running');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `screenshots/ember/adapt-${width}x${height}.png`, scale: 'css' });
  }
});
