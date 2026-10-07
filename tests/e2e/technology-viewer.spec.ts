import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

test('technology PNGs preserve every original pixel outside the title mask', async ({ request }) => {
  const originals = [
    ['02', 'HeatCore_02_THREE_HEATERS_941x1672.png'],
    ['03', 'HeatCore_03_ACTIVE_AIR_SAILS_941x1672.png'],
    ['04', 'HeatCore_04_PROGRAMMABLE_HEAT_PROFILES_941x1672.png'],
    ['05', 'HeatCore_05_GOLD_AND_TITANIUM_NITRIDE_941x1672.png'],
  ];
  const previous = JSON.parse(await readFile('docs/evidence/technology-viewer/original-png/assets.json', 'utf8'));
  const acceptedPhotos = JSON.parse(await readFile('docs/evidence/technology-viewer/live-title/assets.json', 'utf8'));
  for (const [id, filename] of originals) {
    const response = await request.get(`/art/technology/${id}.png`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    const original = await readFile(`design/references/tech_01/${filename}`);
    expect(createHash('sha256').update(original).digest('hex')).toBe(previous.items.find((item: { id: string }) => item.id === id).sourceSha256);
    const delivered = await readFile(`public/art/technology/${id}.png`);
    expect(createHash('sha256').update(delivered).digest('hex')).toBe(acceptedPhotos.items.find((item: { id: string }) => item.id === id).outputSha256);
    expect((await response.body()).equals(delivered)).toBe(true);
    const metadata = await sharp(delivered).metadata();
    expect([metadata.width, metadata.height, metadata.channels]).toEqual([941, 1672, 3]);
    expect(metadata.icc).toBeUndefined();
    const sourcePixels = await sharp(original).raw().toBuffer();
    const deliveredPixels = await sharp(delivered).raw().toBuffer();
    const mask = await sharp(`docs/evidence/technology-viewer/live-title/mask-${id}.png`).greyscale().raw().toBuffer();
    let outsideChanges = 0;
    let remainingDarkTitlePixels = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) {
        for (let c = 0; c < 3; c++) if (sourcePixels[i * 3 + c] !== deliveredPixels[i * 3 + c]) outsideChanges++;
      } else if (Math.max(...deliveredPixels.subarray(i * 3, i * 3 + 3)) < 130) remainingDarkTitlePixels++;
    }
    expect(outsideChanges).toBe(0);
    expect(remainingDarkTitlePixels).toBe(0);
    expect((await request.get(`/art/technology/${id}.webp`)).status()).toBe(404);
  }
});

test('technology descriptions render all source text in the decoded image coordinates', async ({ page }, testInfo) => {
  await page.goto('/en');
  await page.locator('[data-technology-open]').first().click();
  const viewer = page.locator('#technology-viewer');
  const headings = ['THREE HEATERS. ONE CONTINUOUS BALANCE.', 'EXCESS HEAT. CONTINUOUSLY RELEASED.', 'POWER, SHAPED OVER TIME.', 'GOLD FOR PURITY. TITANIUM NITRIDE FOR HEAT.'];
  for (let index = 0; index < 4; index++) {
    await viewer.locator('.technology-viewer__dots button').nth(index).click();
    const id = String(index + 2).padStart(2, '0');
    await expect(viewer.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', id);
    await expect(viewer.getByRole('heading', { level: 3 })).toHaveText(headings[index]);
    await viewer.locator('img').evaluateAll(async images => { await document.fonts.ready; await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
    const blocks = await viewer.locator('.technology-description__box').evaluateAll(elements => elements.map(element => {
      const copy = element.firstElementChild as HTMLElement;
      return { font: getComputedStyle(copy).fontFamily, height: copy.scrollHeight, maxHeight: element.clientHeight, width: copy.scrollWidth, maxWidth: element.clientWidth };
    }));
    expect(blocks.length).toBeGreaterThan(2);
    for (const block of blocks) {
      expect(block.font).toMatch(/^OpenSans/);
      expect(block.height).toBeLessThanOrEqual(block.maxHeight + 1);
      expect(block.width).toBeLessThanOrEqual(block.maxWidth + 1);
    }
    await expect(viewer.locator('.technology-description__folio')).toHaveCount(0);
    await page.screenshot({ path: `screenshots/actual/technology-descriptions/${testInfo.project.name}-slide-${index + 1}.png` });
  }
  await viewer.locator('.technology-viewer__dots button').first().click();
  await expect(viewer.getByRole('heading', { name: '01 UPPER HEAT' })).toBeVisible();
  await expect(viewer.locator('[data-description-block="upper-temperature"]')).toHaveText('0–280°C');
  await expect(viewer.locator('[data-description-block="lower-temperature"]')).toHaveText('0–160°C');
  await expect(viewer.locator('.technology-viewer__stage')).toHaveCSS('touch-action', 'pinch-zoom');
});

test('technology viewer opens from both story controls and pages through clean images', async ({ page }, testInfo) => {
  await page.goto('/en');
  expect(await page.evaluate(() => window.innerWidth)).toBe(testInfo.project.use.viewport?.width);
  expect(await page.evaluate(() => window.devicePixelRatio)).toBe(testInfo.project.use.deviceScaleFactor ?? 1);
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).toContain('width=device-width');

  const openers = page.locator('[data-technology-open]');
  await expect(openers).toHaveCount(2);
  const viewer = page.locator('#technology-viewer');
  for (let triggerIndex = 0; triggerIndex < 2; triggerIndex++) {
    await openers.nth(triggerIndex).scrollIntoViewIfNeeded();
    await openers.nth(triggerIndex).click();
    await expect(viewer).toBeVisible();
    await expect(viewer.getByRole('heading', { name: 'HeatCore Technology' })).toHaveCount(1);
    await expect(viewer.locator('.technology-viewer__title')).toHaveCSS('font-family', /OpenSans/);
    await expect(viewer).toHaveAttribute('aria-labelledby', 'technology-viewer-title');
    await expect(viewer.locator('.technology-viewer__frame')).toHaveAttribute('src', /frame-template\.webp/);
    const dots = viewer.locator('.technology-viewer__dots button');
    await expect(dots).toHaveCount(4);
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
    for (const dot of await dots.all()) {
      const hit = await dot.boundingBox();
      expect(hit?.width).toBeGreaterThanOrEqual(24);
      expect(hit?.height).toBeGreaterThanOrEqual(44);
    }
    const closeHit = await viewer.locator('.technology-viewer__close').boundingBox();
    expect(closeHit?.width).toBeGreaterThanOrEqual(44);
    expect(closeHit?.height).toBeGreaterThanOrEqual(44);
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /02\.png/);
    await expect(viewer.locator('.technology-viewer__stage')).toHaveCSS('background-image', 'none');
    await expect.poll(() => viewer.locator('.technology-viewer__stage img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await viewer.locator('img').evaluateAll(async images => {
      await document.fonts.ready;
      await Promise.all(images.map(image => (image as HTMLImageElement).decode()));
    });
    await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-entry-${triggerIndex + 1}.png` });

    const nextImage = viewer.locator('.technology-viewer__next-image');
    await expect(nextImage).toHaveAttribute('aria-label', 'Show next image');
    await expect(nextImage.locator('span')).toHaveText('Swipe for Details');
    await expect(nextImage).toHaveCSS('font-family', /OpenSans/);
    await expect(nextImage.locator('img')).toHaveAttribute('src', '/art/technology/arrow-right.png');
    await expect(viewer.locator('.technology-viewer__next-group span')).toHaveText('Next Technology');
    await expect(viewer.locator('.technology-viewer__next-group img')).toHaveAttribute('src', '/art/technology/arrow-down.png');
    await nextImage.click();
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /03\.png/);
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await dots.nth(3).click();
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /05\.png/);
    await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true');
    await nextImage.focus();
    await page.keyboard.press('Enter');
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /02\.png/);
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');

    const stage = viewer.locator('.technology-viewer__stage');
    const box = await stage.boundingBox();
    if (!box) throw new Error('Missing technology stage');
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * .8, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .2, y, { steps: 5 });
    await page.mouse.up();
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /03\.png/);
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    if (triggerIndex === 0) {
      for (let slideIndex = 0; slideIndex < 4; slideIndex++) {
        await dots.nth(slideIndex).click();
        await expect.poll(() => viewer.locator('.technology-viewer__stage img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
        await expect(dots.nth(slideIndex)).toHaveAttribute('aria-current', 'true');
        await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-slide-${slideIndex + 1}.png` });
      }
      await dots.nth(2).focus();
      await page.keyboard.press('Enter');
      await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /04\.png/);
      await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
    }
    await viewer.locator('.technology-viewer__next-group').click();
    await expect(viewer.getByRole('status')).toHaveText('The next technology is coming soon.');
    if (triggerIndex === 0) await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-next-group-placeholder.png` });
    await expect(viewer).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(viewer.getByRole('status')).toHaveCount(0);
    await viewer.locator('.technology-viewer__close').click();
    await expect(viewer).not.toBeVisible();
    await expect(openers.nth(triggerIndex)).toBeFocused();
  }
});

test('technology viewer supports touch pointers, Escape and Arabic framing', async ({ page }, testInfo) => {
  await page.goto('/ar');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-technology-open]').first().click();
  const viewer = page.locator('#technology-viewer');
  await expect(viewer).toBeVisible();
  const stage = viewer.locator('.technology-viewer__stage');
  const box = await stage.boundingBox();
  if (!box) throw new Error('Missing technology stage');
  const y = box.y + box.height / 2;
  await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: box.x + box.width * .2, clientY: y });
  await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: box.x + box.width * .8, clientY: y });
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.png/);
  await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', '03');
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
  await expect(stage.locator('img')).toHaveAttribute('alt', /زعانف هوائية نشطة/);
  await page.keyboard.press('ArrowLeft');
  await expect(stage.locator('img')).toHaveAttribute('src', /04\.png/);
  await page.keyboard.press('ArrowRight');
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.png/);
  await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', '03');
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-arabic-swipe.png` });
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await page.locator('[data-technology-open]').first().click();
  await expect(viewer).toBeVisible();
  await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 200, clientY: 500 });
  await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 200, clientY: 350 });
  await expect(viewer).toBeVisible();
  await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 200, clientY: 350 });
  await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 200, clientY: 550 });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole('status')).toHaveText('التقنية التالية ستتوفر قريباً.');
  await viewer.locator('.technology-viewer__next-group').focus();
  await page.keyboard.press('Enter');
  await expect(viewer.getByRole('status')).toBeVisible();
  await viewer.locator('.technology-viewer__close').click();
  await expect(viewer).not.toBeVisible();
});

test('previous artwork stays visible while the next slide loads', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/technology/03.png', async route => {
    await gate;
    await route.continue();
  });
  await page.goto('/en');
  await page.locator('[data-technology-open]').first().click();
  const stage = page.locator('#technology-viewer .technology-viewer__stage');
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
  await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 300, clientY: 400 });
  await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 90, clientY: 400 });
  await expect(stage.locator('img')).toHaveAttribute('src', /02\.png/);
  await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', '02');
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 1 \/ 4/);
  release();
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.png/);
  await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', '03');
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 2 \/ 4/);
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
});

test('failed warm-up and failed selection retry the same image', async ({ page }) => {
  let requests = 0;
  await page.route('**/art/technology/03.png', async route => {
    requests++;
    if (requests <= 3) await route.abort();
    else await route.continue();
  });
  await page.goto('/en');
  await expect.poll(() => requests).toBe(1);
  await page.waitForTimeout(150);
  await page.locator('[data-technology-open]').first().click();
  await expect.poll(() => requests).toBe(2);
  await page.waitForTimeout(150);
  const stage = page.locator('#technology-viewer .technology-viewer__stage');
  await page.locator('.technology-viewer__next-image').click();
  await expect.poll(() => requests).toBe(3);
  await page.waitForTimeout(150);
  await expect(stage.locator('img')).toHaveAttribute('src', /02\.png/);
  await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', '02');
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 1 \/ 4/);
  await page.locator('.technology-viewer__next-image').click();
  await expect.poll(() => requests).toBe(4);
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.png/);
  await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', '03');
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 2 \/ 4/);
});

test('all four photos start in parallel only after main page load', async ({ page }) => {
  let releaseHero!: () => void;
  let releasePhotos!: () => void;
  const heroGate = new Promise<void>(resolve => { releaseHero = resolve; });
  const photoGate = new Promise<void>(resolve => { releasePhotos = resolve; });
  const requests: string[] = [];
  await page.route('**/art/00.webp', async route => { await heroGate; await route.continue(); });
  await page.route(/\/art\/technology\/0[2-5]\.png$/, async route => {
    requests.push(route.request().url());
    await photoGate;
    await route.continue();
  });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => document.readyState)).not.toBe('complete');
  expect(requests).toHaveLength(0);
  releaseHero();
  await page.waitForLoadState('load');
  await expect.poll(() => requests.length).toBe(4);
  expect(new Set(requests.map(url => url.split('/').pop())).size).toBe(4);
  await expect(page.locator('#technology-viewer')).not.toBeVisible();
  releasePhotos();
});

test('early opening starts all four without waiting for main page load', async ({ page }) => {
  let releaseHero!: () => void;
  const gate = new Promise<void>(resolve => { releaseHero = resolve; });
  const requests = new Set<string>();
  await page.route('**/art/00.webp', async route => { await gate; await route.continue(); });
  page.on('request', request => { if (/\/technology\/0[2-5]\.png$/.test(request.url())) requests.add(request.url()); });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);
  expect(requests.size).toBe(0);
  await page.locator('[data-technology-open]').first().click();
  await expect.poll(() => requests.size).toBe(4);
  expect(await page.evaluate(() => document.readyState)).not.toBe('complete');
  await expect(page.locator('#technology-viewer')).toBeVisible();
  releaseHero();
});

test('post-load images are decoded and reused offline for swiping and reopening', async ({ page, context }) => {
  await page.addInitScript(() => {
    const records: HTMLImageElement[] = [];
    Object.defineProperty(window, '__technologyWarmImages', { value: records });
    window.Image = new Proxy(window.Image, { construct(target, args) {
      const image = Reflect.construct(target, args) as HTMLImageElement;
      records.push(image);
      return image;
    } });
  });
  await page.goto('/en');
  await expect.poll(() => page.evaluate(() => {
    const records = (window as unknown as { __technologyWarmImages: HTMLImageElement[] }).__technologyWarmImages;
    return records.filter(image => /\/technology\/0[2-5]\.png$/.test(image.src) && image.complete && image.naturalWidth === 941).length;
  })).toBe(4);
  const timing = await page.evaluate(async () => {
    const records = (window as unknown as { __technologyWarmImages: HTMLImageElement[] }).__technologyWarmImages;
    await Promise.all(records.map(image => image.decode()));
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return { load: navigation.loadEventStart, starts: performance.getEntriesByType('resource').filter(entry => /\/technology\/0[2-5]\.png$/.test(entry.name)).map(entry => entry.startTime), priorities: records.map(image => image.fetchPriority) };
  });
  expect(timing.starts).toHaveLength(4);
  expect(timing.starts.every(start => start >= timing.load)).toBe(true);
  expect(timing.priorities).toEqual(['low', 'low', 'low', 'low']);
  await page.locator('[data-technology-open]').first().click();
  await page.locator('#technology-viewer img').evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  await context.setOffline(true);
  for (let index = 0; index < 4; index++) {
    await page.locator('.technology-viewer__dots button').nth(index).click();
    await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', String(index + 2).padStart(2, '0'));
    await expect.poll(() => page.locator('.technology-viewer__stage img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(941);
  }
  await page.locator('.technology-viewer__close').click();
  await page.locator('[data-technology-open]').first().click();
  await expect.poll(() => page.locator('.technology-viewer__stage img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(941);
  expect(await page.evaluate(() => (window as unknown as { __technologyWarmImages: HTMLImageElement[] }).__technologyWarmImages.length)).toBe(4);
  await context.setOffline(false);
});

test('swipe completes when the pointer leaves the artwork', async ({ page }) => {
  await page.goto('/en');
  await page.locator('[data-technology-open]').first().click();
  const stage = page.locator('#technology-viewer .technology-viewer__stage');
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
  const box = await stage.boundingBox();
  if (!box) throw new Error('Missing technology stage');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * .8, y);
  await page.mouse.down();
  await page.mouse.move(0, y, { steps: 5 });
  await page.mouse.up();
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.png/);
  await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', '03');
});

test('technology viewer hides landing paint beneath browser chrome and restores it on close', async ({ page }, testInfo) => {
  await page.goto('/en');
  // Expanded FAQ icons explicitly set visibility:visible and must also be hidden.
  await page.locator('#faq-preorder').click();
  const opener = page.locator('[data-technology-open]').first();
  await opener.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const original = await page.evaluate(() => ({ root: getComputedStyle(document.documentElement).backgroundColor, body: getComputedStyle(document.body).backgroundColor, height: document.documentElement.scrollHeight, y: scrollY }));
  await opener.click();
  const viewer = page.locator('#technology-viewer');
  await expect(viewer).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  const paint = await page.locator('.dialog-controller > :not(#technology-viewer), .dialog-controller > :not(#technology-viewer) *').evaluateAll(elements => elements.filter(element => {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility === 'visible' && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
  }).map(element => element.tagName));
  expect(paint).toEqual([]);
  await viewer.locator('img').evaluateAll(async images => { await document.fonts.ready; await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-isolated-landing.png` });
  // Isolate the document plane to simulate the browser sampling outside modal paint.
  // This is a backing check, not an emulated screenshot of physical Safari chrome.
  const probe = await page.addStyleTag({ content: '#technology-viewer[open]{visibility:hidden!important} #technology-viewer[open] *{visibility:hidden!important} #technology-viewer[open]::backdrop{background:transparent!important}' });
  const backing = await page.screenshot();
  const { data, info } = await sharp(backing).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(info.channels).toBe(3);
  expect(data.some(value => value !== 0)).toBe(false);
  await probe.evaluate(element => (element as HTMLStyleElement).remove());
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(page.locator('html')).toHaveCSS('background-color', original.root);
  await expect(page.locator('body')).toHaveCSS('background-color', original.body);
  await expect(page.locator('main.canvas')).toBeVisible();
  await expect(page.locator('.faq-symbol').first()).toHaveCSS('visibility', 'visible');
  const restored = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, y: scrollY }));
  expect(restored.height).toBe(original.height);
  expect(restored.y).toBeCloseTo(original.y, 0);
  await opener.click();
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await viewer.locator('.technology-viewer__close').click();
  await expect(page.locator('html')).toHaveCSS('background-color', original.root);
});
