import { expect, test, type CDPSession } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

test.setTimeout(120000);

async function drag(session: CDPSession, x: number, y: number, dx: number) {
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 0 }] });
  for (let step = 1; step <= 10; step++) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * step / 10, y, id: 0 }] });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('continuous mobile touch swipes seek picture and timeline without toggling play', async ({ browser, baseURL }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Chromium CDP touch input is only available in Chromium');
  const context = await browser.newContext({ viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  try {
    await silenceTestMedia(context);
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    await page.goto(`${baseURL}/en`);
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click();
    await page.locator('.film-gallery__hero').click();
    const video = page.locator('video'), player = page.locator('#film-player');
    await expect(player).toHaveAttribute('data-controls', 'ready');
    await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
    const bounds = (await video.boundingBox())!;
    await page.touchscreen.tap(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
    const before = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
    await drag(session, bounds.x + bounds.width * .3, bounds.y + bounds.height / 2, bounds.width * .3);
    const forward = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
    expect(forward).toBeGreaterThan(before + 1);
    expect(await video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
    await drag(session, bounds.x + bounds.width * .7, bounds.y + bounds.height / 2, -bounds.width * .2);
    const backward = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
    expect(backward).toBeLessThan(forward - 1);
    expect(await video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
    const seek = (await page.locator('.film-seek').boundingBox())!;
    await drag(session, seek.x + seek.width * .25, seek.y + seek.height / 2, seek.width * .5);
    await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 10000 }).toBeGreaterThan(backward + 1);
    expect(await video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
    await page.locator('.film-fullscreen').click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement) || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
    const fullBounds = (await video.boundingBox())!;
    const fullBefore = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
    await drag(session, fullBounds.x + fullBounds.width * .7, fullBounds.y + fullBounds.height / 2, -fullBounds.width * .2);
    const fullBackward = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
    expect(fullBackward).toBeLessThan(fullBefore - 1);
    expect(await video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
    await drag(session, fullBounds.x + fullBounds.width * .3, fullBounds.y + fullBounds.height / 2, fullBounds.width * .2);
    expect(await video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThan(fullBackward + 1);
    expect(await video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
    await video.evaluate(v => { (v as HTMLVideoElement).currentTime = .2; });
    await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeLessThan(1);
    await drag(session, fullBounds.x + fullBounds.width * .7, fullBounds.y + fullBounds.height / 2, -fullBounds.width * .5);
    const atStart = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
    expect(atStart).toBeCloseTo(0, 1);
    await video.evaluate(v => { const media = v as HTMLVideoElement; media.currentTime = media.duration - 2; });
    await drag(session, fullBounds.x + fullBounds.width * .3, fullBounds.y + fullBounds.height / 2, fullBounds.width * .5);
    const atEnd = await video.evaluate(v => ({ time: (v as HTMLVideoElement).currentTime, duration: (v as HTMLVideoElement).duration, ended: (v as HTMLVideoElement).ended }));
    expect(atEnd.time).toBeCloseTo(atEnd.duration, 1);
    console.log('Fullscreen boundary seeks:', JSON.stringify({ atStart, atEnd }));
  } finally { await context.close(); }
});
