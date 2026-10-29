import { expectOriginalUnavailable } from './original-film-support';
import { test, expect } from '@playwright/test';
import { silenceTestMedia } from './silent-media';
test.use({serviceWorkers:'block'});test.setTimeout(90000);
test('inline picture and transport occupy separate bands even in short windows',async({page},info)=>{
  test.skip(!['iphone-17-pro-webkit','iphone-17-pro-max-webkit','desktop-chromium'].includes(info.project.name),'Selected geometry owners');
  await silenceTestMedia(page);
  const mobile=info.project.name.includes('iphone');
  const sizes=mobile?(info.project.name.includes('max')?[[440,956]]:[[390,844],[390,650],[320,650],[280,650]]):[[1280,600],[1024,501],[390,650]];
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});await page.goto('/en');await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();
    for(const film of width===390?[0,1,2,3,4,5,6]:[0]){
      await page.locator('.film-gallery__item').nth(film).click();await page.locator('.film-gallery__hero').click();
      await expect(page.locator('#film-player')).toHaveAttribute('data-controls','ready',{timeout:30000});
      if (await expectOriginalUnavailable(page)) { await page.locator('.film-player__close').click(); await page.locator('#film-play').click(); continue; }
      await expect.poll(()=>page.locator('video').evaluate(el=>(el as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2);
      await page.locator('video').evaluate(async el=>{const v=el as HTMLVideoElement;await v.play();await new Promise<void>(resolve=>v.requestVideoFrameCallback(()=>resolve()));v.pause();});
      await page.locator('#film-player').evaluate(el=>el.removeAttribute('userinactive'));
      await expect.poll(()=>page.locator('.film-player__top').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
      const v=await page.locator('video').boundingBox(),bar=await page.locator('.film-transport').boundingBox(),top=await page.locator('.film-player__top').boundingBox();
      expect(top!.y+top!.height).toBeLessThanOrEqual(v!.y+1);expect(v!.y+v!.height).toBeLessThanOrEqual(bar!.y+1);
      expect(bar!.y+bar!.height).toBeLessThanOrEqual(height+1);expect(top!.y).toBeGreaterThanOrEqual(-1);
      await expect(page.locator('video')).toHaveCSS('object-fit','contain');
      if(width<=440){expect(v!.width).toBe(width);expect(v!.height).toBeCloseTo(width*9/16,0);}
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
      if([0,2,6].includes(film)) await page.screenshot({path:`screenshots/video/theme/${info.project.name}-${width}x${height}-film${film+1}-bands.png`});
      await page.locator('.film-player__close').click();await expect(page.locator('video')).not.toHaveAttribute('src');await page.locator('#film-play').click();
    }
  }
});
