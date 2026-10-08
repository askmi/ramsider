import { expect, test } from '@playwright/test';

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
  await page.screenshot({ path: `docs/evidence/media-loading/nojs-${testInfo.project.name}.png` });
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
    await page.screenshot({ path: `docs/evidence/media-loading/bootstrap-${failure}-${info.project.name}.png` });
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

test('offscreen pending artwork does not block the hero but blocks when reached', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/04.webp', async route => { await held; await route.continue(); });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  const image = page.locator('img[data-media][src="/art/04.webp"]');
  await expect(image).not.toHaveAttribute('data-media-ready');
  await page.evaluate(() => {
    const image = document.querySelector('img[data-media][src="/art/04.webp"]')!;
    scrollTo({ top: image.getBoundingClientRect().top + scrollY + 40, behavior: 'instant' });
  });
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  const scroll = await page.evaluate(() => scrollY);
  await expect(page.locator('#back-to-top')).toBeHidden();
  await page.keyboard.press('PageDown');
  expect(await page.evaluate(() => {
    const touch = new Event('touchmove', { bubbles: true, cancelable: true });
    document.querySelector('.page-media-overlay')!.dispatchEvent(touch);
    return touch.defaultPrevented;
  })).toBe(true);
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(scroll);
  release();
  await expect(image).toHaveAttribute('data-media-ready', '');
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
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
