import { expect, test } from '@playwright/test';
// Preview/queue/input coverage moved to loading-flow.spec.ts; see coverage-migration.md.

test('without JavaScript the native page artwork, text and FAQ remain usable', async ({ browser, baseURL }, testInfo) => {
  const profile = testInfo.project.use;
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: profile.viewport, deviceScaleFactor: profile.deviceScaleFactor, isMobile: profile.isMobile, hasTouch: profile.hasTouch });
  const page = await context.newPage();
  await page.goto('/en');
  const hero = page.locator('.art img[data-media]').first();
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

test('initial framework script network failure falls back to native readable content', async ({ page }) => {
  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, route => route.abort());
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).not.toHaveAttribute('data-media-js');
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
  await expect(page.locator('.page-media-overlay')).toBeHidden();
  const hero = page.locator('.art img[data-media]').first();
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
    const hero = page.locator('.art img[data-media]').first();
    await expect(hero).toBeVisible();
    await expect(hero).toHaveJSProperty('naturalWidth', 941);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.screenshot({ path: `${process.env.LOADING_EVIDENCE ?? 'docs/evidence/media-loading'}/bootstrap-${failure}-${info.project.name}.png` });
    const faq = page.locator('.faq-stack details').first();
    await faq.locator('summary').click();
    await expect(faq).toHaveAttribute('open', '');
  });
}
