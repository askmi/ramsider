import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { openTechnology } from './helpers/technology';

const evidence = 'docs/evidence/technology-viewer/width-analysis';

test('every technology photo fills the frame width without distortion and its bottom stays reachable', async ({ page }, info) => {
  test.setTimeout(120_000);
  await mkdir(evidence, { recursive: true });
  await page.goto('/en');
  await openTechnology(page);
  const viewer = page.locator('#technology-viewer');
  const scroller = viewer.locator('.technology-viewer__scroll');
  await expect(viewer).toHaveAttribute('aria-busy', 'false');
  await page.evaluate(() => document.fonts.ready);
  const results = [];
  const baseline = info.project.use.viewport!;
  for (const size of [baseline, { width: 390, height: 664 }, { width: 615, height: 849 }, { width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 320, height: 568 }, { width: 390, height: 732 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    for (let group = 0; group < 2; group++) {
      if (group === 0 && await viewer.getAttribute('data-group') === 'CyberMind') await viewer.locator('.technology-viewer__previous-group').click();
      if (group === 1) await viewer.locator('.technology-viewer__next-group').click();
      await expect(viewer).toHaveAttribute('data-group', group ? 'CyberMind' : 'HeatCore');
      for (let slide = 0; slide < (group ? 2 : 4); slide++) {
        await viewer.locator('.technology-viewer__dots button').nth(slide).click();
        await expect(viewer).toHaveAttribute('aria-busy', 'false');
        await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-source', group ? `/art/technology/cybermind/0${slide + 1}.png` : `/art/technology/0${slide + 2}.png`);
        // Same-slide selection is a no-op; bring its top into view explicitly for this geometry probe.
        await scroller.focus();
        await page.keyboard.press('Home');
        const top = await viewer.evaluate(element => {
          const rect = (selector: string) => { const r = element.querySelector(selector)!.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height, bottom: r.bottom }; };
          const scroll = element.querySelector('.technology-viewer__scroll')!;
          return { width: innerWidth, dpr: devicePixelRatio, frame: rect('.technology-viewer__frame'), cutout: rect('.technology-viewer__stage'), plane: rect('.technology-viewer__content'), photo: rect('.technology-viewer__photo img'), title: rect('.technology-viewer__title'), copy: rect('.technology-viewer__descriptions'), scroll: { top: scroll.scrollTop, height: scroll.scrollHeight, client: scroll.clientHeight }, documentX: scrollX, documentY: scrollY };
        });
        expect(top.width).toBe(size.width);
        if (info.project.use.isMobile) expect(top.dpr).toBe(3);
        expect(top.frame.left).toBe(0);
        expect(top.frame.width).toBe(size.width);
        expect(top.photo.width).toBeCloseTo(top.cutout.width, 1);
        expect(top.photo.left).toBeCloseTo(top.cutout.left, 1);
        expect(top.photo.width / top.photo.height).toBeCloseTo(941 / 1672, 4);
        for (const layer of [top.photo, top.title, top.copy]) {
          expect(layer.left).toBeCloseTo(top.plane.left, 1);
          expect(layer.top).toBeCloseTo(top.plane.top, 1);
          expect(layer.width).toBeCloseTo(top.plane.width, 1);
          expect(layer.height).toBeCloseTo(top.plane.height, 1);
        }
        const capture = (size === baseline && info.project.use.isMobile) || (size.width === 390 && size.height === 664 && info.project.name === 'iphone-17-pro-webkit');
        if (capture) await page.screenshot({ path: `${evidence}/${info.project.name}-${size.width}x${size.height}-g${group}-s${slide}-top.png` });
        await page.keyboard.press('End');
        const bottom = await scroller.evaluate(element => ({ top: element.scrollTop, max: element.scrollHeight - element.clientHeight, width: element.scrollWidth, clientWidth: element.clientWidth, photoBottom: element.querySelector('img')!.getBoundingClientRect().bottom, viewportBottom: element.getBoundingClientRect().bottom, y: scrollY }));
        expect(bottom.top).toBeCloseTo(bottom.max, 0);
        expect(bottom.width).toBeLessThanOrEqual(bottom.clientWidth);
        expect(bottom.photoBottom).toBeLessThanOrEqual(bottom.viewportBottom + 1);
        expect(bottom.y).toBe(top.documentY);
        if (capture && bottom.max > 0) await page.screenshot({ path: `${evidence}/${info.project.name}-${size.width}x${size.height}-g${group}-s${slide}-bottom.png` });
        results.push({ size, group, slide, top, bottom });
      }
    }
  }
  await writeFile(`${evidence}/${info.project.name}-width-matrix.json`, JSON.stringify(results, null, 2) + '\n');
});

test('inner scroll freezes at pending and failed frames, then resets after decoded commit', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 664 });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let failed = true;
  await page.route('**/art/technology/03.png', async route => { await gate; if (failed) await route.fulfill({ status: 503 }); else await route.continue(); });
  try {
    await page.goto('/en');
    await openTechnology(page);
    const viewer = page.locator('#technology-viewer');
    const scroller = viewer.locator('.technology-viewer__scroll');
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    await scroller.focus();
    await page.keyboard.press('End');
    const frozen = await scroller.evaluate(element => element.scrollTop);
    expect(frozen).toBeGreaterThan(100);
    const pageY = await page.evaluate(() => scrollY);
    await viewer.locator('.technology-viewer__next-image').click();
    await expect(viewer).toHaveAttribute('aria-busy', 'true');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('PageDown');
    if (!info.project.use.isMobile) { await scroller.hover(); await page.mouse.wheel(0, -600); }
    await scroller.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 200, clientY: 450 });
    await scroller.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 200, clientY: 300 });
    // Simulate an already queued scroll at the loading boundary, separately from native input.
    await scroller.evaluate(element => { element.scrollTop = 0; });
    await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeCloseTo(frozen, 0);
    await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-source', '/art/technology/02.png');
    await page.screenshot({ path: `${evidence}/${info.project.name}-pending-inner-scroll.png` });
    release();
    await expect(viewer.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
    await page.keyboard.press('End');
    expect(await scroller.evaluate(element => element.scrollTop)).toBeCloseTo(frozen, 0);
    failed = false;
    await viewer.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-source', '/art/technology/03.png');
    expect(await scroller.evaluate(element => element.scrollTop)).toBe(0);
    expect(await page.evaluate(() => scrollY)).toBe(pageY);
    await scroller.focus();
    await page.keyboard.press('ArrowDown');
    expect(await scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowDown');
    await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
    await viewer.locator('.technology-viewer__next-group').click();
    await expect(viewer).toHaveAttribute('data-group', 'CyberMind');
    expect(await scroller.evaluate(element => element.scrollTop)).toBe(0);
    await scroller.focus();
    await page.keyboard.press('End');
    await viewer.locator('.technology-viewer__close').click();
    await openTechnology(page);
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    expect(await scroller.evaluate(element => element.scrollTop)).toBe(0);
  } finally { release(); }
});

test('native desktop wheel pans the picture without moving the page or changing technology', async ({ page }, info) => {
  test.skip(!!info.project.use.isMobile, 'Native mobile touch is checked with the Chromium touch protocol separately; mobile keyboard is checked above.');
  await page.setViewportSize({ width: 615, height: 849 });
  await page.goto('/en');
  await openTechnology(page);
  const viewer = page.locator('#technology-viewer');
  const scroller = viewer.locator('.technology-viewer__scroll');
  await expect(viewer).toHaveAttribute('aria-busy', 'false');
  const y = await page.evaluate(() => scrollY);
  await scroller.hover();
  await page.mouse.wheel(0, 200);
  await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(100);
  await page.mouse.wheel(0, 3000);
  await expect.poll(() => scroller.evaluate(element => Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop))).toBeLessThan(1);
  await page.mouse.wheel(0, 200);
  await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
  expect(await page.evaluate(() => scrollY)).toBe(y);
  await page.mouse.wheel(0, -3000);
  await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBe(0);
});

test('native touch pans vertically, swipes horizontally and freezes during download', async ({ browser }, info) => {
  test.skip(info.project.use.browserName !== 'chromium', 'Chromium native touch protocol; WebKit/Firefox have no matching public swipe API.');
  const context = await browser.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/technology/03.png', async route => { await gate; await route.continue(); });
  try {
    await page.goto(`${process.env.BASE_URL ?? 'http://127.0.0.1:3000'}/en`);
    await openTechnology(page);
    const viewer = page.locator('#technology-viewer');
    const scroller = viewer.locator('.technology-viewer__scroll');
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    const y = await page.evaluate(() => scrollY);
    const touch = await context.newCDPSession(page);
    const swipe = async (start: [number, number], end: [number, number]) => {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start[0], y: start[1] }] });
      for (let step = 1; step <= 10; step++) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start[0] + (end[0] - start[0]) * step / 10, y: start[1] + (end[1] - start[1]) * step / 10 }] });
        await page.waitForTimeout(16); // Real gesture duration; lets the browser recognize native panning.
      }
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    await swipe([220, 440], [220, 290]);
    await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(80);
    await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
    expect(await page.evaluate(() => scrollY)).toBe(y);
    await page.screenshot({ path: `${evidence}/native-touch-scrolled.png` });
    await swipe([300, 350], [70, 350]);
    await expect(viewer).toHaveAttribute('aria-busy', 'true');
    const frozen = await scroller.evaluate(element => element.scrollTop);
    await swipe([220, 440], [220, 290]);
    expect(await scroller.evaluate(element => element.scrollTop)).toBeCloseTo(frozen, 0);
    expect(await page.evaluate(() => scrollY)).toBe(y);
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-source', '/art/technology/02.png');
    await page.screenshot({ path: `${evidence}/native-touch-pending.png` });
    release();
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-source', '/art/technology/03.png');
    expect(await scroller.evaluate(element => element.scrollTop)).toBe(0);
    await swipe([80, 350], [300, 350]);
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-source', '/art/technology/02.png');
    await swipe([80, 350], [300, 350]);
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-source', '/art/technology/02.png');
    await page.screenshot({ path: `${evidence}/native-touch-ready.png` });
    await viewer.locator('.technology-viewer__close').click();
    await page.goto(`${process.env.BASE_URL ?? 'http://127.0.0.1:3000'}/ar`);
    await openTechnology(page);
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    await swipe([80, 350], [300, 350]);
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-source', '/art/technology/03.png');
    await swipe([300, 350], [80, 350]);
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-source', '/art/technology/02.png');
    await swipe([220, 440], [220, 290]);
    await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(80);
    await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
    await page.screenshot({ path: `${evidence}/native-touch-arabic.png` });
  } finally { release(); await context.close(); }
});

test('all six full-width compositions keep translated text usable in eleven locales', async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 664 });
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    await page.goto(`/${locale}`);
    await openTechnology(page);
    const viewer = page.locator('#technology-viewer');
    const scroller = viewer.locator('.technology-viewer__scroll');
    await expect(scroller).toHaveAccessibleName(/.+/);
    for (let group = 0; group < 2; group++) {
      if (group === 1) await viewer.locator('.technology-viewer__next-group').click();
      await expect(viewer).toHaveAttribute('data-group', group ? 'CyberMind' : 'HeatCore');
      for (let slide = 0; slide < (group ? 2 : 4); slide++) {
        await viewer.locator('.technology-viewer__dots button').nth(slide).click();
        await expect(viewer).toHaveAttribute('aria-busy', 'false');
        await page.evaluate(() => document.fonts.ready);
        const blocks = await viewer.locator('.technology-description__box').evaluateAll(elements => elements.map(element => ({ width: element.firstElementChild?.scrollWidth ?? 0, maxWidth: element.clientWidth, height: element.firstElementChild?.scrollHeight ?? 0, maxHeight: element.clientHeight })));
        for (const block of blocks) {
          expect(block.width).toBeLessThanOrEqual(block.maxWidth + 1);
          expect(block.height).toBeLessThanOrEqual(block.maxHeight + 1);
        }
        if (locale === 'ar') await expect(viewer.locator('.technology-description__box').first()).toHaveAttribute('dir', 'rtl');
        await scroller.focus();
        await page.keyboard.press('End');
        expect(await scroller.evaluate(element => Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop))).toBeLessThan(1);
        if (locale === 'ar' && info.project.name === 'iphone-17-pro-webkit') await page.screenshot({ path: `${evidence}/arabic-short-g${group}-s${slide}-bottom.png` });
      }
    }
    await viewer.locator('.technology-viewer__close').click();
  }
});
