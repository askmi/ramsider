import { test, expect } from '@playwright/test';
import { silenceTestMedia } from './silent-media';
test.use({ serviceWorkers: 'block' });
test.setTimeout(120000);
test.beforeEach(async ({page})=>silenceTestMedia(page));
for (const mode of ['inline','fullscreen'] as const) test(`letterbox reveals controls without toggling video: ${mode}`,async ({page},info)=>{
  test.skip(!info.project.name.includes('iphone'), 'Touch WebKit profiles');
  await page.goto('/en'); await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  const player=page.locator('#film-player'),video=page.locator('video'); await expect(player).toHaveAttribute('data-controls','ready'); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).currentTime),{timeout:30000}).toBeGreaterThan(.2);
  if(mode==='fullscreen') { await page.locator('.film-fullscreen').click(); await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement)||document.querySelector('#film-player')?.getAttribute('data-full-window')==='true')).toBe(true); }
  await expect.poll(()=>page.locator('.film-player__top').evaluate(e=>Number(getComputedStyle(e).opacity)),{timeout:10000}).toBe(0);
  const points=await video.evaluate(el=>{const v=el as HTMLVideoElement,r=v.getBoundingClientRect(),s=Math.min(r.width/v.videoWidth,r.height/v.videoHeight),h=v.videoHeight*s,w=v.videoWidth*s;return {x:r.left+r.width/2,blackY:r.top+(r.height-h)/4,pictureY:r.top+r.height/2,verticalGap:r.height-h,horizontalGap:r.width-w};});
  expect(points.verticalGap).toBeGreaterThan(8); const before=await video.evaluate(v=>(v as HTMLVideoElement).currentTime);
  await page.touchscreen.tap(points.x,points.blackY); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(false); await expect.poll(()=>page.locator('.film-player__top').evaluate(e=>Number(getComputedStyle(e).opacity)),{timeout:5000}).toBe(1); expect(await video.evaluate(v=>(v as HTMLVideoElement).currentTime)).toBeGreaterThanOrEqual(before);
  await page.touchscreen.tap(points.x,points.pictureY); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(true); await page.touchscreen.tap(points.x,points.blackY); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(true); await page.touchscreen.tap(points.x,points.pictureY); await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(false);
});
test('landscape side letterbox reveals controls without pausing',async ({page},info)=>{
 test.skip(!info.project.name.includes('iphone'),'Touch WebKit profiles');
 const w=info.project.name.includes('max')?956:874,h=info.project.name.includes('max')?440:402; await page.setViewportSize({width:w,height:h});
 await page.goto('/en'); await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click(); const video=page.locator('video');
 await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).currentTime),{timeout:30000}).toBeGreaterThan(.2); await expect.poll(()=>page.locator('.film-player__top').evaluate(e=>Number(getComputedStyle(e).opacity)),{timeout:10000}).toBe(0);
 const p=await video.evaluate(el=>{const v=el as HTMLVideoElement,r=v.getBoundingClientRect(),s=Math.min(r.width/v.videoWidth,r.height/v.videoHeight),width=v.videoWidth*s;return {x:r.left+(r.width-width)/4,y:r.top+r.height/2,gap:r.width-width};}); expect(p.gap).toBeGreaterThan(8);await page.touchscreen.tap(p.x,p.y);await expect.poll(()=>video.evaluate(v=>(v as HTMLVideoElement).paused)).toBe(false);await expect.poll(()=>page.locator('.film-player__top').evaluate(e=>Number(getComputedStyle(e).opacity))).toBe(1);
});
