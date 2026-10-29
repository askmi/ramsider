import { test, expect } from '@playwright/test';
import { silenceTestMedia } from './silent-media';
import { emulateCustomFullscreenLayout } from './fullscreen-layout-adapter';

test.setTimeout(90000);
test.use({ serviceWorkers: 'block' });
test('Evolution preserves both original edges in portrait, landscape and fullscreen', async ({ page }, info) => {
  await silenceTestMedia(page);
  const mobile = info.project.name.includes('iphone');
  if (mobile) await emulateCustomFullscreenLayout(page);
  await page.goto('/en'); await page.locator('#film-play').scrollIntoViewIfNeeded(); await page.locator('#film-play').click();
  await page.locator('.film-gallery__item').nth(2).click(); await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready', { timeout: 30000 });
  await expect(page.locator('video')).toHaveAttribute('data-src', '/films/evolution/und-v1/master.m3u8');
  const sizes = mobile ? (info.project.name.includes('max') ? [[440,956],[956,440]] : [[402,874],[874,402],[390,844],[844,390]]) : [[390,844],[844,390],[1440,900]];
  for (const [width,height] of sizes) {
    await page.setViewportSize({width,height});
    for (const fullscreen of [false,true]) {
      if (fullscreen) await page.locator('.film-fullscreen').click();
      for (const seconds of [10,30,59,109]) {
        await page.locator('video').evaluate(async (el, seconds) => {
          const v=el as HTMLVideoElement; await v.play();
          if (Math.abs(v.currentTime-seconds)>.05) await new Promise<void>((resolve,reject)=>{
            const timer=setTimeout(()=>reject(Error('Seek timeout')),15000);
            v.addEventListener('seeked',()=>{clearTimeout(timer);resolve();},{once:true});v.currentTime=seconds;
          });
          await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Frame timeout')),10000);v.requestVideoFrameCallback(()=>{clearTimeout(timer);resolve();});});v.pause();
        },seconds);
        const geometry=await page.locator('video').evaluate(el=>{
          const v=el as HTMLVideoElement,r=v.getBoundingClientRect(),host=v.closest('#film-player')!.getBoundingClientRect();
          const scale=Math.min(r.width/v.videoWidth,r.height/v.videoHeight),left=r.x+(r.width-v.videoWidth*scale)/2;
          return {fit:getComputedStyle(v).objectFit,transform:getComputedStyle(v).transform,left,right:left+v.videoWidth*scale,hostLeft:host.left,hostRight:host.right,ratio:v.videoWidth/v.videoHeight,muted:v.muted,volume:v.volume};
        });
        expect(geometry.fit).toBe('contain');expect(geometry.transform).toBe('none');expect(geometry.ratio).toBeCloseTo(16/9,2);
        expect(geometry.left).toBeGreaterThanOrEqual(geometry.hostLeft-1);expect(geometry.right).toBeLessThanOrEqual(geometry.hostRight+1);
        expect(geometry.muted).toBe(true);expect(geometry.volume).toBe(0);
        await page.screenshot({path:`screenshots/video/original-width/${info.project.name}-${width}-${fullscreen?'fullscreen':'inline'}-${seconds}.png`});
      }
      if (fullscreen) await page.locator('.film-fullscreen').click();
    }
  }
  await page.locator('.film-player__close').click();await expect(page.locator('video')).not.toHaveAttribute('src');
});
