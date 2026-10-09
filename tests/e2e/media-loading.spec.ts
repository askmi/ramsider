import { expect, test } from '@playwright/test';
import sharp from 'sharp';

async function readyExcept(page: import('@playwright/test').Page, path: string) {
  await expect.poll(() => page.locator('img[data-media]:not([data-media-ready])').evaluateAll((images, path) => images.every(image => new URL((image as HTMLImageElement).src).pathname === path), path)).toBe(true);
}


test('without JavaScript the native page artwork, text and FAQ remain usable', async ({ browser, baseURL }, testInfo) => {
  const profile = testInfo.project.use;
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: profile.viewport, deviceScaleFactor: profile.deviceScaleFactor, isMobile: profile.isMobile, hasTouch: profile.hasTouch });
  const page = await context.newPage();
  await page.goto('/en');
  const hero = page.locator('.art > img[data-media]').first();
  await expect(page.locator('html')).not.toHaveAttribute('data-media-js');
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
  await expect(page.locator('.page-media-overlay')).toBeHidden();
  await expect(hero).toBeVisible();
  // Firefox's JS-property matcher can stall with page JavaScript disabled;
  // read the native element through Playwright's isolated evaluation instead.
  await expect.poll(() => hero.evaluate(image => ({ complete: (image as HTMLImageElement).complete, width: (image as HTMLImageElement).naturalWidth }))).toEqual({ complete: true, width: 941 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.screenshot({ path: `${process.env.LOADING_EVIDENCE ?? 'docs/evidence/media-loading'}/nojs-${testInfo.project.name}.png` });
  const faq = page.locator('.faq-stack details').first();
  await faq.locator('summary').click();
  await expect(faq).toHaveAttribute('open', '');
  await expect(faq.getByText('Confirmed details are not available')).toBeVisible();
  await context.close();
});

test('early bootstrap protects held artwork before framework hydration', async ({ page }) => {
  let releaseHero!: () => void, releaseScripts!: () => void;
  const heroHeld = new Promise<void>(resolve => { releaseHero = resolve; });
  const scriptsHeld = new Promise<void>(resolve => { releaseScripts = resolve; });
  await page.route('**/art/00.webp', async route => { await heroHeld; await route.continue(); });
  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, async route => { await scriptsHeld; await route.continue(); });
  await page.goto('/en', { waitUntil: 'commit' });
  await expect(page.locator('html')).toHaveAttribute('data-media-js', '');
  await expect(page.locator('html')).not.toHaveAttribute('data-media-hydrated');
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
  const hero = page.locator('.art > img[data-media]').first();
  await expect(hero).toBeHidden();
  await expect(page.locator('#home-link')).toBeHidden();
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => scrollY)).toBe(0);
  releaseHero();
  await expect(hero).toHaveJSProperty('complete', true);
  await expect(hero).toHaveJSProperty('naturalWidth', 941);
  await expect(hero).toBeHidden();
  releaseScripts();
  await expect(hero).toHaveAttribute('data-media-ready', '');
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await expect(hero).toBeVisible();
});

test('initial framework script network failure falls back to native readable content', async ({ page }) => {
  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, route => route.abort());
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).not.toHaveAttribute('data-media-js');
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
  await expect(page.locator('.page-media-overlay')).toBeHidden();
  const hero = page.locator('.art > img[data-media]').first();
  await expect(hero).toBeVisible();
  await expect(hero).toHaveJSProperty('naturalWidth', 941);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const faq = page.locator('.faq-stack details').first();
  await faq.locator('summary').click();
  await expect(faq).toHaveAttribute('open', '');
});

for (const failure of ['synchronous', 'rejection'] as const) {
  test(`initial framework ${failure} failure restores native readable content`, async ({ page }, info) => {
    const body = failure === 'synchronous'
      ? "throw new Error('QA framework execution failure');"
      : "Promise.reject(new Error('QA framework execution failure'));";
    const responses: number[] = [];
    page.on('response', response => { if (/\/_next\/static\/.*\.js/.test(response.url())) responses.push(response.status()); });
    await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, route => route.fulfill({ status: 200, contentType: 'application/javascript', body }));
    await page.goto('/en');
    expect(responses.length).toBeGreaterThan(0);
    expect(responses.every(status => status === 200)).toBe(true);
    await expect(page.locator('html')).not.toHaveAttribute('data-media-js');
    await expect(page.locator('html')).not.toHaveAttribute('data-media-hydrated');
    await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
    await expect(page.locator('.page-media-overlay')).toBeHidden();
    const hero = page.locator('.art > img[data-media]').first();
    await expect(hero).toBeVisible();
    await expect(hero).toHaveJSProperty('naturalWidth', 941);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.screenshot({ path: `${process.env.LOADING_EVIDENCE ?? 'docs/evidence/media-loading'}/bootstrap-${failure}-${info.project.name}.png` });
    const faq = page.locator('.faq-stack details').first();
    await faq.locator('summary').click();
    await expect(faq).toHaveAttribute('open', '');
  });
}

test('visible artwork remains hidden and page scroll locked until complete decode', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/00.webp', async route => { await held; await route.continue(); });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  const image = page.locator('img[data-media][src="/art/00.webp"]');
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  await expect(page.locator('.page-media-overlay').getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  await expect(image).toBeHidden();
  await expect(page.locator('.page-media-content')).toHaveAttribute('inert', '');
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => {
    const touch = new Event('touchmove', { bubbles: true, cancelable: true });
    document.querySelector('.page-media-overlay')!.dispatchEvent(touch);
    return touch.defaultPrevented;
  })).toBe(true);
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  release();
  await expect(image).toHaveAttribute('data-media-ready', '');
  await expect(image).toBeVisible();
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
});

test('pending next block retains ready pixels, stops downward scroll and allows upward scroll', async ({ page }, info) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/04.webp', async route => { await held; await route.continue(); });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  const image = page.locator('img[data-media][src="/art/04.webp"]');
  await expect(image).not.toHaveAttribute('data-media-ready');
  await readyExcept(page, '/art/04.webp');
  const frontier = await image.evaluate(image => image.getBoundingClientRect().top + scrollY);
  // Let preceding resources decode, without entering the held block.
  await page.evaluate(() => scrollTo({ top: 100000, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(Math.floor(frontier) - info.project.use.viewport!.height);
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  const clipped = page.locator('#account-personal');
  expect(await clipped.evaluate(element => (element as HTMLElement).inert)).toBe(true);
  expect(await clipped.evaluate(element => { (element as HTMLElement).focus({ preventScroll: true }); return document.activeElement === element; })).toBe(false);
  const scroll = await page.evaluate(() => scrollY);
  await page.keyboard.press('End');
  await page.evaluate(() => scrollTo({ top: 100000, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(scroll);
  await page.evaluate(() => document.fonts.ready);
  const viewport = info.project.use.viewport!;
  const crop = { left: 0, top: 0, width: viewport.width, height: viewport.height - 200 };
  const pending = await sharp(await page.screenshot({ path: `${process.env.LOADING_EVIDENCE ?? 'docs/evidence/media-loading'}/retained-${info.project.name}-pending.png`, scale: 'device' })).resize({ width: viewport.width }).extract(crop).raw().toBuffer();
  await page.keyboard.press('Home');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await page.evaluate(() => scrollTo({ top: 100000, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(scroll);
  release();
  await expect(image).toHaveAttribute('data-media-ready', '');
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await expect.poll(async () => {
    const ready = await sharp(await page.screenshot({ path: `${process.env.LOADING_EVIDENCE ?? 'docs/evidence/media-loading'}/retained-${info.project.name}-ready.png`, scale: 'device' })).resize({ width: viewport.width }).extract(crop).raw().toBuffer();
    return ready.equals(pending);
  }).toBe(true);
  await page.evaluate(() => scrollTo({ top: scrollY + 200, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll);
});

test('remaining landing artwork warms asynchronously after first block decode without scrolling', async ({ page }) => {
  await page.addInitScript(() => {
    const qa = window as Window & { mediaFetchPriorities?: string[] };
    qa.mediaFetchPriorities = [];
    const fetchResource = window.fetch;
    window.fetch = (input, options) => {
      if (String(input).includes('/art/technology/')) qa.mediaFetchPriorities!.push((options as RequestInit & { priority?: string })?.priority ?? 'auto');
      return fetchResource(input, options);
    };
  });
  const requested = new Set<string>();
  page.on('request', request => { requested.add(new URL(request.url()).pathname); });
  await page.addInitScript(() => {
    const qa = window as Window & { releaseHeroDecode?: () => void };
    const held = new Promise<void>(resolve => { qa.releaseHeroDecode = resolve; });
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this);
      if (new URL(this.currentSrc || this.src).pathname === '/art/00.webp') await held;
    };
  });
  await page.goto('/en');
  expect(requested.has('/art/11.webp')).toBe(false);
  await page.evaluate(() => (window as Window & { releaseHeroDecode?: () => void }).releaseHeroDecode!());
  await expect.poll(() => requested.has('/art/11.webp')).toBe(true);
  await expect.poll(() => page.locator('img[data-media]:not([data-media-ready])').count()).toBe(0);
  expect(await page.locator('img[data-media]').evaluateAll(images => images.every(image => (image as HTMLImageElement).fetchPriority === 'high'))).toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await expect.poll(() => page.evaluate(() => (window as Window & { mediaFetchPriorities?: string[] }).mediaFetchPriorities?.length ?? 0)).toBeGreaterThan(0);
  expect(await page.evaluate(() => (window as Window & { mediaFetchPriorities?: string[] }).mediaFetchPriorities?.every(priority => priority === 'low' || priority === 'auto'))).toBe(true);
});

test('failed visible image has an accessible retry and successful recovery', async ({ page }) => {
  let attempts = 0, available = false;
  await page.route(/\/art\/00\.webp(?:\?.*)?$/, async route => {
    attempts++;
    // WebKit may retry a failed preload as the native image starts. Keep the
    // origin unavailable until the explicit recovery action under test.
    if (!available) await route.fulfill({ status: 503, body: 'Unavailable' });
    else await route.continue();
  });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(page.locator('img[data-media][src="/art/00.webp"]')).toBeHidden();
  const failedAttempts = attempts;
  available = true;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await expect(page.locator('.art > img[data-media]').first()).toHaveAttribute('data-media-ready', '');
  await expect(page.locator('.art > img[data-media]').first()).toHaveAttribute('src', /\/art\/00\.webp\?media-retry=\d+$/);
  expect(attempts).toBeGreaterThanOrEqual(failedAttempts + 1);
});

test('truncated visible image is never revealed as a partially decoded resource', async ({ page }) => {
  let attempts = 0;
  let available = false;
  await page.route(/\/art\/00\.webp(?:\?.*)?$/, async route => {
    attempts++;
    if (!available) {
      const response = await route.fetch();
      const original = await response.body();
      await route.fulfill({ status: 200, contentType: 'image/webp', body: original.subarray(0, 64) });
    } else await route.continue();
  });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(page.locator('img[data-media][src="/art/00.webp"]')).not.toHaveAttribute('data-media-ready');
  const failedAttempts = attempts;
  available = true;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  const image = page.locator('.art > img[data-media]').first();
  await expect(image).toHaveAttribute('data-media-ready', '');
  await expect(image).toHaveAttribute('src', /\/art\/00\.webp\?media-retry=\d+$/);
  expect(attempts).toBeGreaterThanOrEqual(failedAttempts + 1);
});

test('page gate suspends behind a native dialog and resumes missing page media after close', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/00.webp', async route => { await held; await route.continue(); });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  await page.evaluate(() => (document.querySelector('#unavailable-commerce') as HTMLDialogElement).showModal());
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
  await page.locator('#close-unavailable-commerce').click();
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  await expect(page.locator('.page-media-content')).toHaveAttribute('inert', '');
  release();
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
});


test('native desktop wheel stops at pending boundary and can reverse upward', async ({ page }, info) => {
  test.skip(!!info.project.use.isMobile, 'Use native Chromium touch below; mobile WebKit mouse wheel is unavailable.');
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/04.webp', async route => { await held; await route.continue(); });
  await page.goto('/en');
  await readyExcept(page, '/art/04.webp');
  await page.evaluate(() => scrollTo({ top: 100000, behavior: 'instant' }));
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  const edge = await page.evaluate(() => scrollY);
  await page.mouse.move(info.project.use.viewport!.width / 2, 300);
  await page.mouse.wheel(0, 10000);
  // Chromium completes the first wheel gesture asynchronously, including at a boundary.
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => scrollY)).toBe(edge);
  await page.mouse.wheel(0, -600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(edge);
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await page.mouse.wheel(0, 10000);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(edge);
  release();
});

test('native mobile touch cannot cross missing block and can reverse while it is pending', async ({ browser }, info) => {
  test.skip(info.project.use.browserName !== 'chromium', 'CDP native touch exists only on Chromium; WebKit native hardware momentum is not claimed.');
  const context = await browser.newContext({ baseURL: process.env.BASE_URL, viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/04.webp', async route => { await held; await route.continue(); });
  await page.goto('/en');
  await readyExcept(page, '/art/04.webp');
  await page.evaluate(() => scrollTo({ top: 100000, behavior: 'instant' }));
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  const edge = await page.evaluate(() => scrollY);
  const touch = await context.newCDPSession(page);
  const pan = async (from: number, to: number) => {
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: from }] });
    for (let step = 1; step <= 12; step++) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: from + (to - from) * step / 12 }] });
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await pan(620, 160);
  expect(await page.evaluate(() => scrollY)).toBe(edge);
  await pan(180, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(edge);
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await page.screenshot({ path: `${process.env.LOADING_EVIDENCE ?? 'docs/evidence/media-loading'}/retained-native-touch-up.png` });
  release();
  await context.close();
});

test('pending frontier follows viewport resize and expanded FAQ instead of exposing blank artwork', async ({ page }, info) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/faq-row-3.webp', async route => { await held; await route.continue(); });
  await page.goto('/en');
  await readyExcept(page, '/art/faq-row-3.webp');
  await page.evaluate(() => scrollTo({ top: 100000, behavior: 'instant' }));
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  const cap = () => page.locator('.page-media-shell').evaluate(element => Number.parseFloat((element as HTMLElement).style.height));
  const before = await cap();
  const first = page.locator('.faq-stack details').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect.poll(cap).toBeGreaterThan(before);
  await page.setViewportSize({ width: 390, height: 664 });
  await page.evaluate(() => scrollTo({ top: 100000, behavior: 'instant' }));
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  const frontier = await cap();
  expect(await page.evaluate(() => scrollY + innerHeight)).toBe(frontier);
  await expect(first.locator('summary')).not.toHaveAttribute('inert');
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
  await page.screenshot({ path: `${process.env.LOADING_EVIDENCE ?? 'docs/evidence/media-loading'}/retained-${info.project.name}-faq-resize.png` });
  release();
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
});


test('retained loading strip fits all eleven locales including Arabic', async ({ page }, info) => {
  test.setTimeout(120000);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/04.webp', async route => { await held; await route.continue(); });
  // Failed optional gallery background fetches must never block the main page.
  await page.route('**/art/technology/**', route => route.abort());
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    await page.goto(`/${locale}`);
    await readyExcept(page, '/art/04.webp');
    await page.evaluate(() => scrollTo({ top: 100000, behavior: 'instant' }));
    const status = page.locator('.page-media-overlay .media-loading');
    await expect(status).toBeVisible();
    await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
    expect(await status.evaluate(element => element.scrollWidth <= element.clientWidth && element.getBoundingClientRect().right <= innerWidth)).toBe(true);
    await expect(status).toHaveCSS('background-color', 'rgb(24, 21, 18)');
    await expect(status).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(status).toHaveCSS('padding', '0px');
    expect(await status.evaluate(element => element.getBoundingClientRect().width)).toBe(Math.min(info.project.use.viewport!.width-48,420));
    if (locale === 'ar') {
      await expect(status).toHaveAttribute('dir', 'rtl');
      await page.screenshot({ path: `${process.env.LOADING_EVIDENCE ?? 'docs/evidence/media-loading'}/retained-${info.project.name}-arabic.png` });
    }
  }
  release();
});
