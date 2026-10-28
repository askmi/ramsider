import { test, expect } from '@playwright/test';
import { silenceTestMedia } from './silent-media';
test.use({ serviceWorkers:'block' });
test('playlist posters retain their natural aspect ratios',async({page},info)=>{
 test.skip(!info.project.name.includes('iphone'),'WebKit phone profiles'); await silenceTestMedia(page);
 await page.goto('/en');await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();await page.locator('.film-gallery__hero').click();await expect(page.locator('#film-player')).toHaveAttribute('data-controls','ready');await expect.poll(()=>page.locator('video').evaluate(v=>(v as HTMLVideoElement).currentTime),{timeout:30000}).toBeGreaterThan(.2);
 await page.locator('video').evaluate(v=>(v as HTMLVideoElement).pause());await page.locator('.film-player__list-toggle').click();const close=await page.locator('.film-playlist__close').boundingBox();expect(close!.width).toBeGreaterThanOrEqual(44);expect(close!.height).toBeGreaterThanOrEqual(44);const items=page.locator('.film-playlist__item');await expect(items).toHaveCount(7);
 for(const img of await items.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(e=>(e as HTMLImageElement).decode());const dimensions=await img.evaluate(e=>{const i=e as HTMLImageElement,r=i.getBoundingClientRect();return {w:r.width,h:r.height,nw:i.naturalWidth,nh:i.naturalHeight}});expect(dimensions.w).toBeGreaterThan(0);expect(Math.abs(dimensions.h-dimensions.w*dimensions.nh/dimensions.nw)).toBeLessThan(1);}
});
