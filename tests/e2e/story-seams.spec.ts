import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'block' });

test('a failed story image retains its preview and retries without moving the artwork', async ({ page }) => {
  let fail = true;
  await page.route('**/art/story-v2-01.webp', route => fail ? route.abort() : route.continue());
  await page.goto('/en');
  const image = page.locator('img[data-original="/art/story-v2-01.webp"]');
  await expect(image).toHaveAttribute('data-media-error', '', { timeout: 30000 });
  await expect(image).toHaveAttribute('data-preview', 'ready');
  await image.evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY + 50, behavior: 'instant' }));
  const before = await image.boundingBox();
  const retry = page.getByRole('button', { name: 'Retry', exact: true });
  await expect(retry).toBeVisible();
  fail = false;
  await retry.click();
  await expect(image).toHaveAttribute('data-media-ready', '', { timeout: 30000 });
  const after = await image.boundingBox();
  expect(Math.abs(before!.height - after!.height)).toBeLessThan(1);
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
});

for (const width of [768, 1440]) test(`decoded story artwork paints immediately after a distant jump at ${width}px`, async ({ browser }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One WebKit run per wide viewport.');
  const context = await browser.newContext({ viewport: { width, height: width === 768 ? 1024 : 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, serviceWorkers: 'block' });
  try {
    const page = await context.newPage();
    await page.goto((process.env.BASE_URL ?? 'http://127.0.0.1:3000') + '/en');
    await page.waitForFunction(() => [...document.querySelectorAll('.art img[data-media],.tail-art img[data-media]')]
      .every(image => image.hasAttribute('data-media-ready')), null, { timeout: 90000 });
    for (const y of [1850, 3360, 6580, 11580]) {
      await page.evaluate(y => {
        const box = document.querySelector('.art')!.getBoundingClientRect();
        scrollTo({ top: box.top + scrollY + y * box.width / 941 - innerHeight / 2, behavior: 'instant' });
      }, y);
      await page.waitForTimeout(60);
    }
    // A flat canvas color here means the decoded next tile has not been painted.
    const screenshot = await page.screenshot({ path: `screenshots/feed-seams/wide/paint-regression-${width}.png` });
    const { default: sharp } = await import('sharp');
    const { data, info: pixels } = await sharp(screenshot).raw().toBuffer({ resolveWithObject: true });
    expect(pixels.width).toBe(width);
    const left = Math.floor((width - Math.min(width, 941)) / 2) + 30;
    const top = pixels.height - 120;
    const values: number[] = [];
    for (let y = top; y < top + 30; y++) for (let x = left; x < left + 60; x++) values.push(data[(y * pixels.width + x) * pixels.channels]);
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(20);
  } finally {
    await context.close();
  }
});

test('the project image keeps its boundary preview after failure and recovers in place', async ({ page }) => {
  let fail = true;
  await page.route('**/art/story-v3-13.webp', route => fail ? route.abort() : route.continue());
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('data-media-hydrated', '');
  await page.locator('.tail-art').evaluate(element => {
    const box = element.getBoundingClientRect();
    scrollTo({ top: box.top + scrollY + (29264 - 28207) * box.width / 941 - innerHeight / 2, behavior: 'instant' });
  });
  const image = page.locator('.tail-art img[data-original="/art/story-v3-13.webp"]');
  await expect(image).toHaveAttribute('data-media-error', '', { timeout: 30000 });
  await expect(image).toHaveAttribute('data-preview', 'ready');
  const before = await image.boundingBox();
  await page.screenshot({ path: `screenshots/feed-seams/dark-light/error-${test.info().project.name}.png` });
  fail = false;
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(image).toHaveAttribute('data-media-ready', '', { timeout: 30000 });
  const after = await image.boundingBox();
  expect(Math.abs(before!.height - after!.height)).toBeLessThan(1);
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
});
