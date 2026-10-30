import {revealFilmTop} from './film-reveal-top';
import {test,expect} from '@playwright/test';
import {silenceTestMedia} from './silent-media';

test.setTimeout(90000);
test.beforeEach(async({page})=>silenceTestMedia(page));
test('Evolution consumes its three warmed startup segments and reuses them after closing',async({page})=>{
 const warm:string[]=[],hits:string[]=[],original:string[]=[];
 page.on('request',r=>{if(r.headers()['x-film-preload'])warm.push(new URL(r.url()).pathname);if(r.url().includes('/evolution/original-v1/'))original.push(r.url());});
 page.on('response',r=>{if(r.url().includes('/evolution/und-v1/')&&r.headers()['x-film-cache']==='hit')hits.push(new URL(r.url()).pathname);});
 await page.goto('/en');await expect(page.locator('video')).toHaveAttribute('data-preload','ready',{timeout:45000});
 const prefix='/films/evolution/und-v1/';
 const segments=[0,1,2].map(i=>prefix+`360p/segment-0000${i}.m4s`);
 expect(warm.filter(p=>p.startsWith(prefix)&&p.endsWith('.m4s'))).toEqual(segments);
 const before=await page.evaluate(async()=>({keys:(await(await caches.open('film-start-v1')).keys()).map(r=>new URL(r.url).pathname),paused:document.querySelector('video')!.paused,time:document.querySelector('video')!.currentTime}));
 expect(before.keys).toHaveLength(42);expect(before.paused).toBe(true);expect(before.time).toBe(0);
 const initial=warm.length;
 await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();await page.locator('.film-gallery__item').nth(2).click();await page.locator('.film-gallery__hero').click();
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:20000}).toBeGreaterThan(6.2);
 for(const segment of segments)expect(hits).toContain(segment);
 await revealFilmTop(page);await page.locator('.film-player__close').click();await expect(page.locator('video')).toHaveAttribute('data-preload','ready',{timeout:20000});expect(warm).toHaveLength(initial);expect(original).toEqual([]);
 await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();await page.locator('.film-gallery__hero').click();await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:20000}).toBeGreaterThan(.3);await revealFilmTop(page);await page.locator('.film-player__close').click();
});
