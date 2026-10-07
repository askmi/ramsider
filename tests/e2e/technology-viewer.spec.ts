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
    await expect(viewer).toHaveAttribute('data-group', 'CyberMind');
    await expect(dots).toHaveCount(2);
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
  await expect(viewer).toHaveAttribute('data-group', 'CyberMind');
  await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 200, clientY: 350 });
  await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 200, clientY: 550 });
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
    if (requests <= 2) await route.abort();
    else await route.continue();
  });
  await page.goto('/en');
  expect(requests).toBe(0);
  await page.locator('[data-technology-open]').first().click();
  await expect.poll(() => requests).toBe(1);
  await page.waitForTimeout(150);
  const stage = page.locator('#technology-viewer .technology-viewer__stage');
  await page.locator('.technology-viewer__next-image').click();
  await expect.poll(() => requests).toBe(2);
  await page.waitForTimeout(150);
  await expect(stage.locator('img')).toHaveAttribute('src', /02\.png/);
  await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', '02');
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 1 \/ 4/);
  await page.locator('.technology-viewer__next-image').click();
  await expect.poll(() => requests).toBe(3);
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.png/);
  await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', '03');
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 2 \/ 4/);
});

test('first photo of each group warms after load; remaining photos start together on open', async ({ page }) => {
  let releaseHero!: () => void;
  let releasePhotos!: () => void;
  const heroGate = new Promise<void>(resolve => { releaseHero = resolve; });
  const photoGate = new Promise<void>(resolve => { releasePhotos = resolve; });
  const requests: string[] = [];
  await page.route('**/art/00.webp', async route => { await heroGate; await route.continue(); });
  await page.route(/\/art\/technology\/(?:cybermind\/0[12]|0[2-5])\.png$/, async route => {
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
  await expect.poll(() => requests.length).toBe(2);
  expect(requests.map(url => new URL(url).pathname).sort()).toEqual(['/art/technology/02.png', '/art/technology/cybermind/01.png']);
  await expect(page.locator('#technology-viewer')).not.toBeVisible();
  await page.locator('[data-technology-open]').first().click();
  await expect.poll(() => requests.length).toBe(6);
  expect(new Set(requests).size).toBe(6);
  releasePhotos();
});

test('early opening starts all six without waiting for main page load', async ({ page }) => {
  let releaseHero!: () => void;
  const gate = new Promise<void>(resolve => { releaseHero = resolve; });
  const requests = new Set<string>();
  await page.route('**/art/00.webp', async route => { await gate; await route.continue(); });
  page.on('request', request => { if (/\/technology\/(?:cybermind\/0[12]|0[2-5])\.png$/.test(request.url())) requests.add(request.url()); });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);
  expect(requests.size).toBe(0);
  await page.locator('[data-technology-open]').first().click();
  await expect.poll(() => requests.size).toBe(6);
  expect(await page.evaluate(() => document.readyState)).not.toBe('complete');
  await expect(page.locator('#technology-viewer')).toBeVisible();
  releaseHero();
});

test('first images warm at low priority; all decoded images are reused offline across groups', async ({ page, context }) => {
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
    return records.filter(image => /\/technology\/(?:cybermind\/01|02)\.png$/.test(image.src) && image.complete && image.naturalWidth === 941).length;
  })).toBe(2);
  const timing = await page.evaluate(async () => {
    const records = (window as unknown as { __technologyWarmImages: HTMLImageElement[] }).__technologyWarmImages;
    await Promise.all(records.map(image => image.decode()));
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return { load: navigation.loadEventStart, starts: performance.getEntriesByType('resource').filter(entry => /\/technology\/(?:cybermind\/01|02)\.png$/.test(entry.name)).map(entry => entry.startTime), priorities: records.map(image => image.fetchPriority) };
  });
  expect(timing.starts).toHaveLength(2);
  expect(timing.starts.every(start => start >= timing.load)).toBe(true);
  expect(timing.priorities).toEqual(['low', 'low']);
  await page.locator('[data-technology-open]').first().click();
  await page.locator('#technology-viewer img').evaluateAll(async images => { await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  await expect.poll(() => page.evaluate(() => (window as unknown as { __technologyWarmImages: HTMLImageElement[] }).__technologyWarmImages.filter(image => image.complete && image.naturalWidth === 941).length)).toBe(6);
  await page.evaluate(async () => { await Promise.all((window as unknown as { __technologyWarmImages: HTMLImageElement[] }).__technologyWarmImages.map(image => image.decode())); });
  await context.setOffline(true);
  for (let index = 0; index < 4; index++) {
    await page.locator('.technology-viewer__dots button').nth(index).click();
    await expect(page.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide', String(index + 2).padStart(2, '0'));
    await expect.poll(() => page.locator('.technology-viewer__stage img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(941);
  }
  await page.locator('.technology-viewer__next-group').click();
  await expect(page.locator('#technology-viewer')).toHaveAttribute('data-group', 'CyberMind');
  for (let index = 0; index < 2; index++) {
    await page.locator('.technology-viewer__dots button').nth(index).click();
    await expect(page.locator('.technology-viewer__stage img')).toHaveAttribute('src', `/art/technology/cybermind/0${index + 1}.png`);
  }
  await page.locator('.technology-viewer__previous-group').click();
  await expect(page.locator('#technology-viewer')).toHaveAttribute('data-group', 'HeatCore');
  await page.locator('.technology-viewer__close').click();
  await page.locator('[data-technology-open]').first().click();
  await expect.poll(() => page.locator('.technology-viewer__stage img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(941);
  expect(await page.evaluate(() => (window as unknown as { __technologyWarmImages: HTMLImageElement[] }).__technologyWarmImages.length)).toBe(6);
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

test('metal contour reaches mobile side edges and the image stays inside its cutout', async ({ page }, testInfo) => {
  await page.goto('/en');
  await page.locator('[data-technology-open]').first().click();
  const viewer = page.locator('#technology-viewer');
  await viewer.locator('img').evaluateAll(async images => { await document.fonts.ready; await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  const canvas = await viewer.locator('.technology-viewer__canvas').boundingBox();
  const frame = await viewer.locator('.technology-viewer__frame').boundingBox();
  const stage = await viewer.locator('.technology-viewer__stage').boundingBox();
  if (!canvas || !frame || !stage) throw new Error('Missing gallery geometry');
  const viewportWidth = await page.evaluate(() => innerWidth);
  expect(viewportWidth).toBe(testInfo.project.use.viewport?.width);
  const fullWidth = viewportWidth < 700;
  if (fullWidth) {
    expect(frame.x).toBeCloseTo(canvas.x, 1);
    expect(frame.width).toBeCloseTo(canvas.width, 1);
    expect(frame.x).toBe(0);
    expect(frame.width).toBe(viewportWidth);
  }
  expect(stage.x).toBeCloseTo(frame.x + frame.width * 29 / 941, 1);
  expect(stage.width).toBeCloseTo(frame.width * 883 / 941, 1);
  const screenshot = await page.screenshot();
  const { data, info } = await sharp(screenshot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const scale = info.width / viewportWidth;
  const y = Math.floor((frame.y + frame.height / 2) * scale);
  // Both edge pixels must contain metal, not the formerly exterior black gutters.
  for (const x of [Math.round(frame.x * scale), Math.round((frame.x + frame.width) * scale) - 1]) {
    expect(Math.max(...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3))).toBeGreaterThan(10);
  }
});

test('CyberMind PNGs retain native RGB, alpha and resolution outside title glyphs', async ({ request }) => {
  const manifest = JSON.parse(await readFile('docs/evidence/technology-viewer/cybermind/assets.json', 'utf8'));
  for (const item of manifest.items) {
    const source = await readFile(item.source);
    const delivered = await readFile(item.output);
    expect(createHash('sha256').update(source).digest('hex')).toBe(item.sourceSha256);
    expect(createHash('sha256').update(delivered).digest('hex')).toBe(item.outputSha256);
    const metadata = await sharp(delivered).metadata();
    expect([metadata.width, metadata.height, metadata.channels]).toEqual([941,1672,item.channels]);
    expect(metadata.icc).toBeUndefined();
    const response = await request.get(`/art/technology/cybermind/${item.id}.png`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).equals(delivered)).toBe(true);
    const a = await sharp(source).raw().toBuffer(), b = await sharp(delivered).raw().toBuffer();
    const mask = await sharp(`docs/evidence/technology-viewer/cybermind/mask-${item.id}.png`).greyscale().raw().toBuffer();
    let outside = 0, alpha = 0, remainingLetters = 0;
    for (let i=0;i<mask.length;i++) {
      if (!mask[i]) for (let c=0;c<item.channels;c++) if (a[i*item.channels+c]!==b[i*item.channels+c]) outside++;
      if (item.channels===4 && a[i*4+3]!==b[i*4+3]) alpha++;
      if (mask[i] && Math.max(...b.subarray(i*item.channels,i*item.channels+3))<130) remainingLetters++;
    }
    expect([outside,alpha,remainingLetters]).toEqual([0,0,0]);
    expect((await request.get(`/art/technology/cybermind/${item.id}.webp`)).status()).toBe(404);
  }
});

test('CyberMind uses two interactive slides, a live title and two-axis navigation', async ({ page }, testInfo) => {
  await page.goto('/en');
  await page.locator('[data-technology-open]').first().click();
  const viewer=page.locator('#technology-viewer'), stage=viewer.locator('.technology-viewer__stage');
  await viewer.locator('.technology-viewer__dots button').nth(2).click();
  await expect(stage.locator('img')).toHaveAttribute('src','/art/technology/04.png');
  await viewer.locator('.technology-viewer__dots button').nth(3).focus();
  await page.keyboard.press('ArrowDown');
  await expect(viewer).toHaveAttribute('data-group','CyberMind');
  await expect(viewer).toHaveAccessibleName('CyberMind Technology');
  await expect(viewer).toBeFocused();
  await expect(viewer.locator('.technology-viewer__dots button')).toHaveCount(2);
  await expect(viewer.locator('.technology-viewer__descriptions')).toHaveCount(0);
  await expect(viewer.locator('.technology-viewer__title')).toHaveCSS('font-family',/OpenSans/);
  await expect(viewer.locator('.technology-viewer__title svg text').last()).toHaveAttribute('stroke','#fff');
  await expect(viewer.locator('.technology-viewer__title svg text').last()).toHaveAttribute('paint-order','stroke fill');
  const back=viewer.getByRole('button',{name:'Previous technology',exact:true});
  const backBox=await back.boundingBox(), nextBox=await viewer.locator('.technology-viewer__next-group').boundingBox();
  if(!backBox||!nextBox)throw new Error('Missing group navigation');
  await expect(back).toHaveCSS('width','44px');await expect(back).toHaveCSS('height','44px');
  expect(backBox.width).toBeGreaterThanOrEqual(43.99);expect(backBox.height).toBeGreaterThanOrEqual(43.99);
  expect(backBox.x+backBox.width).toBeLessThanOrEqual(nextBox.x);
  for(let i=0;i<2;i++){
    await viewer.locator('.technology-viewer__dots button').nth(i).click();
    await expect(stage.locator('img')).toHaveAttribute('src',`/art/technology/cybermind/0${i+1}.png`);
    await expect(viewer.locator('.technology-viewer__dots button').nth(i)).toHaveAttribute('aria-current','true');
    await viewer.locator('img').evaluateAll(async imgs=>{await document.fonts.ready;await Promise.all(imgs.map(img=>(img as HTMLImageElement).decode()));});
    await page.screenshot({path:`screenshots/actual/cybermind/${testInfo.project.name}-slide-${i+1}.png`});
  }
  await viewer.locator('.technology-viewer__next-image').click();
  await expect(stage.locator('img')).toHaveAttribute('src','/art/technology/cybermind/01.png');
  await viewer.locator('.technology-viewer__next-group').click();
  await expect(viewer.getByRole('status')).toHaveText('The next technology is coming soon.');
  await page.keyboard.press('ArrowUp');
  await expect(viewer).toHaveAttribute('data-group','HeatCore');
  await expect(stage.locator('img')).toHaveAttribute('src','/art/technology/04.png');
  await expect(viewer.getByRole('status')).toHaveCount(0);
  await stage.dispatchEvent('pointerdown',{pointerType:'touch',clientX:200,clientY:300});
  await stage.dispatchEvent('pointerup',{pointerType:'touch',clientX:200,clientY:450});
  await expect(viewer).toHaveAttribute('data-group','CyberMind');
  await back.click();
  await expect(viewer).toHaveAttribute('data-group','HeatCore');
  expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog[open]'))).toBe(true);
  await viewer.locator('.technology-viewer__close').click();
  await expect(page.locator('[data-technology-open]').first()).toBeFocused();
});

test('pending group and slide changes preserve displayed state and cannot overwrite later navigation', async ({ page }) => {
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/technology/cybermind/02.png',async route=>{await gate;await route.continue();});
  await page.goto('/en');await page.locator('[data-technology-open]').first().click();
  const viewer=page.locator('#technology-viewer'), stage=viewer.locator('.technology-viewer__stage');
  await viewer.locator('.technology-viewer__next-group').click();
  await expect(viewer).toHaveAttribute('data-group','CyberMind');
  await viewer.locator('.technology-viewer__dots button').nth(1).click();
  await expect(stage.locator('img')).toHaveAttribute('src','/art/technology/cybermind/01.png');
  await expect(viewer.locator('.technology-viewer__dots button').first()).toHaveAttribute('aria-current','true');
  await expect(viewer).toHaveAccessibleName('CyberMind Technology');
  await page.keyboard.press('ArrowUp');
  await expect(viewer).toHaveAttribute('data-group','HeatCore');
  release();
  await viewer.locator('.technology-viewer__next-group').click();
  await expect(viewer).toHaveAttribute('data-group','CyberMind');
  await expect(stage.locator('img')).toHaveAttribute('src','/art/technology/cybermind/01.png');
  await viewer.locator('.technology-viewer__dots button').nth(1).click();
  await expect(stage.locator('img')).toHaveAttribute('src','/art/technology/cybermind/02.png');
});

test('failed first CyberMind warm and group selection retry without skipping the group', async ({ page }) => {
  let requests=0;
  await page.route('**/technology/cybermind/01.png',async route=>{requests++;if(requests<=3)await route.abort();else await route.continue();});
  await page.goto('/en');await expect.poll(()=>requests).toBe(1);await page.waitForTimeout(150);
  await page.locator('[data-technology-open]').first().click();await expect.poll(()=>requests).toBe(2);await page.waitForTimeout(150);
  const viewer=page.locator('#technology-viewer');
  await viewer.locator('.technology-viewer__next-group').click();await expect.poll(()=>requests).toBe(3);await page.waitForTimeout(150);
  await expect(viewer).toHaveAttribute('data-group','HeatCore');
  await expect(viewer.locator('.technology-viewer__dots button')).toHaveCount(4);
  await viewer.locator('.technology-viewer__next-group').click();await expect.poll(()=>requests).toBe(4);
  await expect(viewer).toHaveAttribute('data-group','CyberMind');
  await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src','/art/technology/cybermind/01.png');
});

test('pending group navigation cannot announce an unavailable group or hijack visible slide controls', async ({ page }) => {
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/technology/cybermind/01.png',async route=>{await gate;await route.continue();});
  await page.goto('/en');await page.locator('[data-technology-open]').first().click();
  const viewer=page.locator('#technology-viewer'), next=viewer.locator('.technology-viewer__next-group');
  await next.click();await next.click();
  await expect(viewer).toHaveAttribute('data-group','HeatCore');
  await expect(viewer.getByRole('status')).toHaveCount(0);
  await expect(viewer.locator('.technology-viewer__dots button')).toHaveCount(4);
  await page.keyboard.press('ArrowUp');
  await next.click();
  await viewer.locator('.technology-viewer__next-image').click();
  await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src','/art/technology/03.png');
  release();
  await next.click();await expect(viewer).toHaveAttribute('data-group','CyberMind');
  const stage=viewer.locator('.technology-viewer__stage');
  await stage.dispatchEvent('pointerdown',{pointerType:'touch',clientX:200,clientY:500});
  await stage.dispatchEvent('pointerup',{pointerType:'touch',clientX:200,clientY:350});
  await expect(viewer).toHaveAttribute('data-group','HeatCore');
  await expect(stage.locator('img')).toHaveAttribute('src','/art/technology/03.png');
});
