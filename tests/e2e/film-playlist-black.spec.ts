import {revealFilmTop} from './film-reveal-top';
import {test,expect,type Page} from '@playwright/test';
import sharp from 'sharp';
import {mkdir} from 'node:fs/promises';
import {silenceTestMedia} from './silent-media';
import {emulateCustomFullscreenLayout} from './fullscreen-layout-adapter';

test.use({serviceWorkers:'block'});test.setTimeout(90000);
async function seek(page:Page,time:number){
 await page.locator('video').evaluate((v:HTMLVideoElement,t)=>{v.pause();v.currentTime=t;},time);
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>!v.seeking&&v.readyState>=2&&v.videoWidth>0)).toBe(true);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function pixel(page:Page,x:number,y:number){const data=await sharp(await page.screenshot({clip:{x:Math.floor(x),y:Math.floor(y),width:2,height:2},scale:'css'})).removeAlpha().raw().toBuffer();return [...data.subarray(0,3)];}
test('playlist stays translucent black over actual white and dark decoded video',async({page},info)=>{
 await silenceTestMedia(page);if(info.project.name.includes('iphone'))await emulateCustomFullscreenLayout(page);
 await mkdir('screenshots/video/startup-fix',{recursive:true});await page.goto('/en');await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();await page.locator('.film-gallery__hero').click();await expect(page.locator('#film-player')).toHaveAttribute('data-controls','ready',{timeout:20000});
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);
 for(const fullscreen of[false,true]){if(fullscreen)await page.locator('.film-fullscreen').click();
 for(const [name,time]of[['white',56],['dark',7]]as const){await seek(page,time);const host=(await page.locator('#film-player').boundingBox())!;const video=(await page.locator('video').boundingBox())!;const x=host.x+host.width-8,y=video.y+video.height*.55;
 const under=await pixel(page,x,y);if(name==='white')expect(Math.min(...under)).toBeGreaterThan(230);
 await page.locator('.film-player__list-toggle').click();const over=await pixel(page,x,y);expect(Math.max(...over)).toBeLessThan(30);if(name==='white')expect(Math.min(...over)).toBeGreaterThan(5);
 await expect(page.locator('#film-playlist')).toBeVisible();await page.screenshot({path:`screenshots/video/startup-fix/${info.project.name}-${name}-${fullscreen?'fullscreen':'inline'}-playlist.png`});await page.keyboard.press('Escape');}
 if(fullscreen)await page.locator('.film-fullscreen').click();}await revealFilmTop(page);await page.locator('.film-player__close').click();
});
