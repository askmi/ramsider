import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { openTechnology } from './helpers/technology';

test('a partially transferred first photo stays hidden with true progress and locked navigation', async ({ page }, info) => {
  const bytes = await readFile('public/art/technology/02.png');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const server = createServer(async (_request, response) => {
    response.writeHead(200, { 'content-type': 'image/png', 'content-length': bytes.length, 'access-control-allow-origin': '*' });
    response.write(bytes.subarray(0, Math.floor(bytes.length / 4)));
    await gate;
    response.end(bytes.subarray(Math.floor(bytes.length / 4)));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No streaming server');
  await page.route('**/art/technology/02.png', route => route.continue({ url: `http://127.0.0.1:${address.port}/photo.png` }));
  try {
    await page.goto('/en');
    await openTechnology(page);
    const viewer = page.locator('#technology-viewer');
    await expect(viewer).toHaveAttribute('aria-busy', 'true');
    await expect(viewer.locator('.technology-viewer__stage')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveCount(0);
    await expect(viewer.locator('.technology-viewer__title, .technology-viewer__descriptions')).toHaveCount(0);
    await expect(viewer.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
    await expect(viewer.locator('.technology-viewer__next-image')).toBeDisabled();
    await expect(viewer.locator('.technology-viewer__dots button').first()).toBeDisabled();
    const scroll = await page.evaluate(() => scrollY);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    if (!info.project.use.isMobile) await page.mouse.wheel(0, 800);
    else expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
    await viewer.locator('.technology-viewer__stage').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 300, clientY: 500 });
    await viewer.locator('.technology-viewer__stage').dispatchEvent('pointerup', { pointerType: 'touch', clientX: 100, clientY: 500 });
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
    await page.screenshot({ path: `docs/evidence/media-loading/${info.project.name}-pending.png` });
    release();
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    const image = viewer.locator('.technology-viewer__stage img');
    await expect(image).toHaveAttribute('data-source', '/art/technology/02.png');
    const delivered = await image.evaluate(async (element: HTMLImageElement) => {
      const buffer = await (await fetch(element.src)).arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    });
    expect(delivered).toBe(createHash('sha256').update(bytes).digest('hex'));
    await expect(viewer.getByRole('heading', { name: 'HeatCore Technology' })).toBeVisible();
    await page.screenshot({ path: `docs/evidence/media-loading/${info.project.name}-ready.png` });
  } finally {
    release();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('invalid first image has white backing and retry; close never traps the user', async ({ page }) => {
  let valid = false;
  await page.route('**/art/technology/02.png', route => valid ? route.continue() : route.fulfill({ contentType: 'image/png', body: Buffer.from('not an image') }));
  await page.goto('/en');
  await openTechnology(page);
  const viewer = page.locator('#technology-viewer');
  await expect(viewer.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(viewer.locator('.technology-viewer__stage img')).toHaveCount(0);
  await viewer.locator('.technology-viewer__close').click();
  await expect(viewer).not.toBeVisible();
  await openTechnology(page);
  await expect(viewer.getByRole('button', { name: 'Retry' })).toBeVisible();
  valid = true;
  await viewer.getByRole('button', { name: 'Retry' }).click();
  await expect(viewer).toHaveAttribute('aria-busy', 'false');
  await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('data-source', '/art/technology/02.png');
});

test('retry replaces a corrupt HTTP 200 retained in the real browser cache', async ({ page }, info) => {
  const bytes = await readFile('public/art/technology/02.png');
  let valid = false, requests = 0;
  const server = createServer((_request, response) => {
    requests++;
    const body = valid ? bytes : Buffer.from('cached corrupt image');
    response.writeHead(200, { 'content-type': 'image/png', 'content-length': body.length, 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' });
    response.end(body);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No cache server');
  const url = `http://127.0.0.1:${address.port}/photo.png`;
  // No page.route: routing disables HTTP caching and would miss this regression.
  await page.addInitScript(({ url }) => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => nativeFetch(input === '/art/technology/02.png' ? url : input, init);
  }, { url });
  try {
    await page.goto('/en');
    await openTechnology(page);
    const viewer = page.locator('#technology-viewer');
    await expect(viewer.getByRole('button', { name: 'Retry' })).toBeVisible();
    const beforeProbe = requests;
    expect(await page.evaluate(async url => (await fetch(url, { cache: 'force-cache' })).text(), url)).toBe('cached corrupt image');
    // WebKit's ephemeral mobile context does not retain this cross-origin response.
    // Desktop profiles must prove actual retention, rather than only a successful retry.
    if (info.project.use.browserName !== 'webkit') expect(requests).toBe(beforeProbe);
    info.annotations.push({ type: 'HTTP-cache', description: requests === beforeProbe ? 'Corrupt response retained: no probe network request' : 'Cross-origin cache not retained by mobile WebKit; network retry/reuse verified' });
    const before = requests;
    valid = true;
    await viewer.getByRole('button', { name: 'Retry' }).click();
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('data-source', '/art/technology/02.png');
    expect(requests).toBe(before + 1);
    await viewer.locator('.technology-viewer__close').click();
    await openTechnology(page);
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('data-source', '/art/technology/02.png');
    expect(requests).toBe(before + 1);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('horizontal swipes stop at both ends and reverse through preceding photos', async ({ page }) => {
  await page.goto('/en');
  await openTechnology(page);
  const viewer = page.locator('#technology-viewer'), stage = viewer.locator('.technology-viewer__stage');
  await expect(viewer).toHaveAttribute('aria-busy', 'false');
  const swipe = async (from: number, to: number) => {
    await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: from, clientY: 400 });
    await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: to, clientY: 400 });
  };
  await swipe(100, 300);
  await expect(stage.locator('img')).toHaveAttribute('data-source', '/art/technology/02.png');
  await viewer.locator('.technology-viewer__dots button').last().click();
  await expect(stage.locator('img')).toHaveAttribute('data-source', '/art/technology/05.png');
  await swipe(300, 100);
  await expect(stage.locator('img')).toHaveAttribute('data-source', '/art/technology/05.png');
  await swipe(100, 300);
  await expect(stage.locator('img')).toHaveAttribute('data-source', '/art/technology/04.png');
  await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
});

test('contained artwork and controls adapt to short landscape, tablet and desktop', async ({ page }, info) => {
  await page.goto('/en');
  await openTechnology(page);
  const viewer = page.locator('#technology-viewer');
  await expect(viewer).toHaveAttribute('aria-busy', 'false');
  for (const [width, height] of [[390, 664], [844, 390], [768, 1024], [1440, 900]] as const) {
    await page.setViewportSize({ width, height });
    const bounds = await viewer.evaluate(element => {
      const box = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
      const photo = box('.technology-viewer__content'), stage = box('.technology-viewer__stage'), frame = box('.technology-viewer__frame');
      const next = box('.technology-viewer__next-group'), top = box('.technology-viewer__next-image'), close = box('.technology-viewer__close'), dots = box('.technology-viewer__dots');
      const rightArrow = box('.technology-viewer__next-image img'), downArrow = box('.technology-viewer__next-group img');
      const metal = getComputedStyle(element.querySelector('.technology-viewer__frame')!);
      const paintWidths = metal.borderImageWidth.split(' ').map(parseFloat);
      return { ratio: photo.width / photo.height, cornerRatio: paintWidths[1] / paintWidths[0], rightArrowRatio: rightArrow.width / rightArrow.height, downArrowRatio: downArrow.width / downArrow.height, photo: { left: photo.left, right: photo.right, top: photo.top, bottom: photo.bottom }, stage: { left: stage.left, right: stage.right, top: stage.top, bottom: stage.bottom }, frame: { top: frame.top, bottom: frame.bottom }, nextTop: next.top, nextBottom: next.bottom, headerBottom: top.bottom, dotsTop: dots.top, dotsBottom: dots.bottom, closeRight: close.right };
    });
    expect(bounds.ratio).toBeCloseTo(941 / 1672, 3);
    expect(bounds.cornerRatio).toBeCloseTo(29 / 31, 3);
    expect(bounds.rightArrowRatio).toBeCloseTo(28 / 45, 2);
    expect(bounds.downArrowRatio).toBeCloseTo(45 / 29, 2);
    expect(bounds.photo.left).toBeGreaterThanOrEqual(bounds.stage.left - 1);
    expect(bounds.photo.right).toBeLessThanOrEqual(bounds.stage.right + 1);
    expect(bounds.photo.top).toBeGreaterThanOrEqual(bounds.stage.top - 1);
    expect(bounds.photo.bottom).toBeLessThanOrEqual(bounds.stage.bottom + 1);
    expect(bounds.headerBottom).toBeLessThanOrEqual(bounds.frame.top);
    expect(bounds.headerBottom).toBeLessThanOrEqual(bounds.dotsTop);
    expect(bounds.dotsBottom).toBeLessThanOrEqual(bounds.frame.top);
    expect(bounds.frame.bottom).toBeLessThanOrEqual(bounds.nextTop);
    expect(bounds.nextBottom).toBeLessThanOrEqual(height);
    expect(bounds.closeRight).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `docs/evidence/media-loading/${info.project.name}-${width}x${height}.png` });
  }
});

test('loading and retry fit every locale including Arabic at a short phone height', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.route('**/art/technology/02.png', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    await page.goto(`/${locale}`);
    await openTechnology(page);
    const loader = page.locator('.technology-viewer__loading');
    await expect(loader.locator('button')).toBeVisible();
    const fit = await loader.locator('p,button').evaluateAll(elements => elements.map(element => ({ width: element.scrollWidth, available: element.clientWidth })));
    for (const item of fit) expect(item.width).toBeLessThanOrEqual(item.available + 1);
    if (locale === 'ar') await expect(loader).toHaveAttribute('dir', 'rtl');
    await page.locator('.technology-viewer__close').click();
  }
});
