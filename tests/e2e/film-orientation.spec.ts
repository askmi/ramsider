import { expect, test } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

test.setTimeout(90000);

test('mobile fullscreen requests landscape and releases it across exits, denial and late completion', async ({ browser, baseURL }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Uses a Chromium mobile context and native fullscreen');
  const context = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  try {
    await silenceTestMedia(context);
    await context.addInitScript(() => {
      const state = { locks: [] as string[], unlocks: 0, mode: 'resolve', pending: [] as (() => void)[] };
      Object.assign(window, { orientationTest: state });
      Object.defineProperty(screen.orientation, 'lock', { configurable: true, value: (direction: string) => {
        state.locks.push(direction);
        if (state.mode === 'reject') return Promise.reject(new Error('denied'));
        if (state.mode === 'pending') return new Promise<void>(resolve => { state.pending.push(resolve); });
        return Promise.resolve();
      } });
      Object.defineProperty(screen.orientation, 'unlock', { configurable: true, value: () => { state.unlocks++; } });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const state = () => page.evaluate(() => (window as unknown as { orientationTest: { locks: string[]; unlocks: number } }).orientationTest);
    const setMode = (mode: string) => page.evaluate(value => { (window as unknown as { orientationTest: { mode: string } }).orientationTest.mode = value; }, mode);
    const resolveOld = () => page.evaluate(() => { (window as unknown as { orientationTest: { pending: (() => void)[] } }).orientationTest.pending.shift()?.(); });
    await page.goto(`${baseURL}/en`);
    await page.waitForLoadState('networkidle');
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click();
    await page.locator('.film-gallery__hero').click();
    await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
    const fullscreen = page.locator('.film-fullscreen');

    await fullscreen.click();
    await expect.poll(async () => (await state()).locks).toEqual(['landscape']);
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
    await page.evaluate(() => document.exitFullscreen()); // Browser Back / external fullscreen exit.
    await expect.poll(async () => (await state()).unlocks).toBe(1);

    await setMode('reject');
    await fullscreen.click();
    await expect.poll(async () => (await state()).locks.length).toBe(2);
    await expect.poll(async () => (await state()).unlocks).toBe(2);
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
    await page.evaluate(() => document.exitFullscreen());

    await setMode('pending');
    await fullscreen.click();
    await expect.poll(async () => (await state()).locks.length).toBe(3);
    await page.evaluate(() => document.exitFullscreen());
    await expect.poll(async () => (await state()).unlocks).toBe(3);
    await fullscreen.click();
    await expect.poll(async () => (await state()).locks.length).toBe(4);
    await resolveOld();
    await page.waitForTimeout(50);
    expect((await state()).unlocks).toBe(3); // Old completion must not unlock the new session.
    await resolveOld();
    await page.evaluate(() => document.exitFullscreen());
    await expect.poll(async () => (await state()).unlocks).toBe(4);
    await fullscreen.click();
    await expect.poll(async () => (await state()).locks.length).toBe(5);
    await page.locator('.film-player__close').click();
    await expect.poll(async () => (await state()).unlocks).toBe(5);
    await resolveOld();
    await expect.poll(async () => (await state()).unlocks).toBe(6); // Late lock is released after close.
    expect((await state()).locks).toEqual(['landscape', 'landscape', 'landscape', 'landscape', 'landscape']);
  } finally { await context.close(); }
});
