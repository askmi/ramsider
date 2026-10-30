import {revealFilmTop} from './film-reveal-top';
import {test,expect,type Page} from '@playwright/test';
import {silenceTestMedia} from './silent-media';
import {emulateCustomFullscreenLayout} from './fullscreen-layout-adapter';
import {mkdir,writeFile} from 'node:fs/promises';

test.use({serviceWorkers:'block'});
test.setTimeout(120000);
test.beforeEach(async({page},info)=>{await silenceTestMedia(page);if(info.project.name.includes('iphone'))await emulateCustomFullscreenLayout(page);});
async function open(page:Page,locale='en'){
 await page.goto('/'+locale);await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();await page.locator('.film-gallery__item').nth(2).click();await page.locator('.film-gallery__hero').click();
 await expect(page.locator('video')).toHaveAttribute('data-delivery','hls');await expect(page.locator('video')).toHaveAttribute('data-src','/films/evolution/und-v1/master.m3u8');
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);
 await expect(page.locator('#film-player')).toHaveAttribute('data-controls','ready',{timeout:20000});
}
async function seek(page:Page,time:number){
 await page.locator('video').evaluate((v:HTMLVideoElement,t)=>{v.pause();v.currentTime=t;},time);
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>!v.seeking&&v.readyState>=2&&v.videoWidth>0),{timeout:20000}).toBe(true);
}
test('Evolution HLS preserves decoded framing, fullscreen and complete end access',async({page},info)=>{
 await mkdir('screenshots/video/startup-fix',{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
 const sizes=info.project.name.includes('iphone')?(info.project.name.includes('max')?[[440,956],[956,440]]:[[402,874],[874,402],[390,664]]):[[1440,900],[844,390]];
 for(const [width,height]of sizes){await page.setViewportSize({width,height});await page.locator('.film-fullscreen').click();for(const time of[10,109]){
  await seek(page,time);const g=await page.locator('video').evaluate((v:HTMLVideoElement)=>{const r=v.getBoundingClientRect();return{w:r.width,h:r.height,left:r.left,right:r.right,viewport:innerWidth,ratio:v.videoWidth/v.videoHeight,muted:v.muted,volume:v.volume};});
  expect(g.ratio).toBeCloseTo(16/9,2);expect(g.h).toBeCloseTo(g.w*9/16,0);expect(Math.abs(g.left)).toBeLessThanOrEqual(1);expect(Math.abs(g.right-g.viewport)).toBeLessThanOrEqual(1);expect(g.muted).toBe(true);expect(g.volume).toBe(0);
  await page.screenshot({path:`screenshots/video/startup-fix/${info.project.name}-${width}-${time}-evolution.png`});
 }await page.locator('.film-fullscreen').click();}
 await revealFilmTop(page);await page.locator('.film-player__close').click();await expect(page.locator('video')).not.toHaveAttribute('src');expect(errors).toEqual([]);
});
test('Evolution HLS supports RTL, quality, speed, replay, adjacent films and reopen',async({page},info)=>{
 await open(page,'ar');await expect(page.locator('#product-film')).toHaveAttribute('dir','rtl');await page.locator('.film-options__trigger').click();await expect(page.locator('.film-settings')).toBeVisible();await page.keyboard.press('Escape');
 await page.locator('.film-options__trigger').click();await page.locator('.film-menu-quality').click();await page.locator('#film-quality-options media-chrome-menu-item[value="1080"]').click();
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.videoHeight),{timeout:20000}).toBe(1080);
 await page.locator('.film-options__trigger').click();await page.locator('.film-menu-quality').click();await page.locator('#film-quality-options media-chrome-menu-item[value="auto"]').click();
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>!v.seeking&&!v.hasAttribute('data-film-source-switch')&&v.readyState>=2&&Number.isFinite(v.duration)),{timeout:20000}).toBe(true);
 await page.locator('video').evaluate((v:HTMLVideoElement)=>v.playbackRate=1.25);await seek(page,112);await page.locator('video').evaluate((v:HTMLVideoElement)=>v.play());const observations:unknown[]=[];try{await expect.poll(async()=>{const s=await page.locator('video').evaluate((v:HTMLVideoElement)=>({time:v.currentTime,duration:v.duration,ended:v.ended,paused:v.paused,ready:v.readyState,seeking:v.seeking,src:v.currentSrc,delivery:v.dataset.playback,pending:v.dataset.filmSourceSwitch,error:v.error?.code}));observations.push(s);return s.ended;},{timeout:15000}).toBe(true);}finally{await mkdir('screenshots/video/startup-fix',{recursive:true});await writeFile(`screenshots/video/startup-fix/${info.project.name}-evolution-end.json`,JSON.stringify(observations,null,2));}await expect(page.locator('#product-film')).toHaveAttribute('data-view','ended');
 await page.locator('.film-ended__replay').click();await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);
 await page.locator('.film-next').click();await expect(page.locator('video')).toHaveAttribute('data-src',/our-style/);await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);
 await page.locator('.film-previous').click();await expect(page.locator('video')).toHaveAttribute('data-src',/evolution\/und-v1/);await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);
 await revealFilmTop(page);await page.locator('.film-player__close').click();await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();await page.locator('.film-gallery__hero').click();await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);
 await revealFilmTop(page);await page.locator('.film-player__close').click();
});
