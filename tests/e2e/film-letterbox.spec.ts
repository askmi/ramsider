import { emulateCustomFullscreenLayout } from './fullscreen-layout-adapter';
test.beforeEach(async ({ page }, info) => { if (info.project.name.includes('iphone')) await emulateCustomFullscreenLayout(page); });
import { test, expect } from '@playwright/test';
import { silenceTestMedia } from './silent-media';
test.use({ serviceWorkers: 'block' });
test.setTimeout(120000);
test.beforeEach(async ({page})=>silenceTestMedia(page));
for (const mode of ['inline'] as const) test(`letterbox reveals controls without toggling video: ${mode}`,async ({page},info)=>{
  test.skip(!info.project.name.includes('iphone'), 'Touch WebKit profiles');
  await page.goto('/en'); await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  const player=page.locator('#film-player'),video=page.locator('video'); await expect(player).toHaveAttribute('data-controls','ready'); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).currentTime),{timeout:30000}).toBeGreaterThan(.2);
  await expect.poll(()=>page.locator('.film-player__top').evaluate(e=>Number(getComputedStyle(e).opacity)),{timeout:10000}).toBe(0);
  const points=await video.evaluate(el=>{const v=el as HTMLVideoElement,r=v.getBoundingClientRect(),s=Math.min(r.width/v.videoWidth,r.height/v.videoHeight),h=v.videoHeight*s,w=v.videoWidth*s;return {x:r.left+r.width/2,blackY:r.top+(r.height-h)/4,pictureY:r.top+r.height/2,verticalGap:r.height-h,horizontalGap:r.width-w};});
  expect(points.verticalGap).toBeGreaterThan(8); const before=await video.evaluate(v=>(v as HTMLVideoElement).currentTime);
  await page.touchscreen.tap(points.x,points.blackY); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(false); await expect.poll(()=>page.locator('.film-player__top').evaluate(e=>Number(getComputedStyle(e).opacity)),{timeout:5000}).toBe(1); expect(await video.evaluate(v=>(v as HTMLVideoElement).currentTime)).toBeGreaterThanOrEqual(before);
  await page.touchscreen.tap(points.x,points.pictureY); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(true); await page.touchscreen.tap(points.x,points.blackY); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(true); await page.touchscreen.tap(points.x,points.pictureY); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(false);
});
for (const mode of ['landscape', 'fullscreen'] as const) test(`${mode} cover frame edge toggles playback`, async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Touch WebKit profiles; custom fullscreen uses explicit layout adapter');
  if (mode === 'landscape') await page.setViewportSize(info.project.name.includes('max') ? { width: 956, height: 440 } : { width: 874, height: 402 });
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  if (mode === 'fullscreen') {
    await page.locator('.film-fullscreen').click();
    await expect(page.locator('#film-player')).toHaveAttribute('data-element-fullscreen', 'true');
  }
  await expect(video).toHaveCSS('object-fit', 'cover');
  await expect.poll(() => page.locator('.film-player__top').evaluate(e => Number(getComputedStyle(e).opacity)), { timeout: 10000 }).toBe(0);
  const point = await video.evaluate(el => {
    const v = el as HTMLVideoElement, r = v.getBoundingClientRect(), contain = Math.min(r.width / v.videoWidth, r.height / v.videoHeight);
    // This point used to be in the contain letterbox; cover now paints it.
    return r.height > v.videoHeight * contain + 8
      ? { x: r.left + r.width / 2, y: r.top + (r.height - v.videoHeight * contain) / 4 }
      : { x: r.left + (r.width - v.videoWidth * contain) / 4, y: r.top + r.height / 2 };
  });
  await page.touchscreen.tap(point.x, point.y);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(true);
  await page.touchscreen.tap(point.x, point.y);
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).paused)).toBe(false);
});
