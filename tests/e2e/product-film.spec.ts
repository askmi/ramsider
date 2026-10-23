import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

import { readFileSync } from 'node:fs';
const registry = JSON.parse(readFileSync('config/product-films.json','utf8')) as { assets: Array<{ id: string; audioLocale: string; active: boolean; directory: string; files: Array<{path:string;bytes:number}> }> };

test.setTimeout(120000);
const root = 'screenshots/video/hls';
const activeAsset = registry.assets.find(asset => asset.id === 'uno-introduction' && asset.audioLocale === 'en' && asset.active)!;
const base = `/films/${activeAsset.directory}`;
const src = `${base}/master.m3u8`;
async function visit(page: Page, locale = 'en') {
  await page.goto(`/${locale}`);
  await page.evaluate(() => document.fonts.ready);
  // Decode the actual main originals, rather than accepting the tiny previews.
  await expect(page.locator('.art img')).not.toHaveCount(0);
  await expect.poll(() => page.locator('.art img:not([data-media-ready])').count(), { timeout: 40000 }).toBe(0);
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await expect(page.locator('#film-play')).toBeInViewport();
  await page.locator('.art img').evaluateAll(async images => {
    for (const image of images) {
      const box = image.getBoundingClientRect();
      if (box.bottom > 0 && box.top < innerHeight) await (image as HTMLImageElement).decode();
    }
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  });
  // Mobile WebKit paints its scrolled composited artwork after the scroll task.
  await page.waitForTimeout(250);
}
async function playing(page: Page) {
  await expect.poll(() => page.$eval('video', v => v.readyState >= 2 && !v.paused && v.currentTime > .2), { timeout: 20000 }).toBe(true);
}

test('complete HLS package delivery and small fallback ranges', async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One HTTP delivery owner');
  const asset = activeAsset;
  const master = await request.get(src);
  expect(master.status()).toBe(200);
  expect(master.headers()['content-type']).toContain('application/vnd.apple.mpegurl');
  expect(await master.text()).toContain('#EXT-X-STREAM-INF:');
  for (const file of asset.files) {
    const head = await request.head(`${base}/${file.path}`);
    expect(head.status(), file.path).toBe(200);
    expect(Number(head.headers()['content-length']), file.path).toBe(file.bytes);
    expect(head.headers()['cache-control']).toContain('immutable');
  }
  const head = await request.head(`${base}/fallback.mp4`);
  expect(Number(head.headers()['content-length'])).toBeLessThan(25000000);
  const partial = await request.get(`${base}/fallback.mp4`,{headers:{Range:'bytes=0-1023'}});
  expect(partial.status()).toBe(206);expect((await partial.body()).length).toBe(1024);
});

test('both film controls play, seek, pause and release with modal focus restoration', async ({ page }, info) => {
  await mkdir(root,{recursive:true});
  const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const mediaRequests: string[]=[];page.on('request',r=>{if(r.url().includes('/films/'))mediaRequests.push(r.url());});
  await visit(page);
  const viewport=page.viewportSize()!;
  if(info.project.name.includes('iphone')) expect(await page.evaluate(()=>[innerWidth,devicePixelRatio])).toEqual([viewport.width,3]);
  expect(mediaRequests).toHaveLength(0);expect(await page.locator('video').getAttribute('src')).toBeNull();
  await page.screenshot({path:`${root}/closed-${info.project.name}.png`,scale:'css'});
  for (const id of ['film-play','film-label']) {
    const trigger=page.locator(`#${id}`);await trigger.focus();const before=await page.evaluate(()=>scrollY);
    await trigger.press('Enter');await expect(page.locator('#product-film')).toBeVisible();await playing(page);
    expect(await page.$eval('video', v=>v.videoWidth>=256&&v.videoHeight>=144&&v.controls&&v.hasAttribute('playsinline'))).toBe(true);
    expect(mediaRequests.length).toBeGreaterThan(0);
    await page.$eval('video', v=>v.pause());
    const paused=await page.$eval('video', v=>v.currentTime);await page.waitForTimeout(150);
    expect(await page.$eval('video', v=>v.currentTime)).toBeCloseTo(paused,1);
    await page.$eval('video', v=>{v.currentTime=30;});
    await expect.poll(()=>page.$eval('video', v=>!v.seeking&&v.currentTime>=29.9&&v.readyState>=2),{timeout:20000}).toBe(true);
    await page.screenshot({path:`${root}/open-${id}-${info.project.name}.png`,scale:'css'});
    await page.$eval('video', v=>v.play());await playing(page);
    // Native modal contains keyboard focus (browser controls may expose shadow descendants).
    for(let i=0;i<5;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('#product-film'))).toBe(true);}
    await page.keyboard.press('Shift+Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('#product-film'))).toBe(true);
    if(id==='film-play')await page.keyboard.press('Escape');else await page.locator('.product-film__close').click();
    await expect(page.locator('#product-film')).not.toBeVisible();await expect(trigger).toBeFocused();
    await expect.poll(()=>page.$eval('video', v=>({paused:v.paused,src:v.getAttribute('src'),network:v.networkState,ready:v.readyState,time:v.currentTime}))).toEqual({paused:true,src:null,network:0,ready:0,time:0});
    expect(Math.abs(await page.evaluate(()=>scrollY)-before)).toBeLessThan(2);
  }
  expect(errors).toEqual([]);
});

test('slow load stays closable; actual source error offers successful retry',async({page},info)=>{
  await visit(page);let held=true;
  await page.route('**/films/**',async route=>{if(held)await route.abort();else await route.continue();});
  await page.locator('#film-play').click();await expect(page.locator('.product-film__notes button')).toBeVisible();
  await page.screenshot({path:`${root}/error-${info.project.name}.png`,scale:'css'});
  held=false;await page.locator('.product-film__notes button').click();await playing(page);
  await page.locator('.product-film__close').click();
  let release!:()=>void;const gate=new Promise<void>(r=>release=r);
  await page.unroute('**/films/**');
  await page.route('**/films/**',async route=>{await gate;await route.abort().catch(()=>{});});
  await page.locator('#film-label').click();await expect(page.locator('[role=status]').filter({hasText:'Loading Video'})).toBeVisible();
  await page.screenshot({path:`${root}/loading-${info.project.name}.png`,scale:'css'});
  await page.locator('.product-film__close').click();release();await expect(page.locator('video')).not.toHaveAttribute('src');
});

test('native fullscreen API in supporting desktop browser and landscape fit',async({page},info)=>{
  test.skip(info.project.name!=='desktop-chromium','Desktop Chromium supports fullscreen in this automation host; physical iOS separately unverified');
  await visit(page);await page.locator('#film-play').click();await playing(page);
  // User-gesture fullscreen with the same standard API used by native controls.
  await page.$eval('video', v=>v.addEventListener('click',()=>void v.requestFullscreen(),{once:true}));
  await page.locator('video').click();await expect.poll(()=>page.evaluate(()=>document.fullscreenElement?.tagName)).toBe('VIDEO');
  await page.$eval('video',v=>v.play());await playing(page);
  await expect.poll(()=>page.$eval('video',v=>v.videoHeight),{timeout:20000}).toBeGreaterThan(720);
  const geometry=await page.$eval('video',v=>({width:v.clientWidth,height:v.clientHeight,viewportWidth:innerWidth,viewportHeight:innerHeight,decodedHeight:v.videoHeight}));
  await writeFile(`${root}/fullscreen-geometry.json`,JSON.stringify(geometry,null,2));
  expect(geometry.width).toBe(geometry.viewportWidth);expect(geometry.height).toBe(geometry.viewportHeight);
  await page.screenshot({path:`${root}/fullscreen-chromium.png`,scale:'css'});
  await page.evaluate(()=>document.exitFullscreen());await page.locator('.product-film__close').click();
});

test('eleven localized dialogs, RTL, and representative portrait/landscape adaptation',async({page},info)=>{
  test.setTimeout(120000);
  test.skip(info.project.name!=='iphone-17-pro-webkit','One WebKit matrix owner');
  const rows: Array<Record<string, unknown>>=[];
  for(const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']){
    await visit(page,locale);await page.route('**/films/**',route=>route.abort());await page.locator('#film-play').click();
    await expect(page.locator('.product-film__notes button')).toBeVisible();
    const d=page.locator('#product-film');expect(await d.getAttribute('dir')).toBe(locale==='ar'?'rtl':'ltr');
    expect(await d.locator('h2').textContent()).toBeTruthy();expect(await d.locator('[role=status]').textContent()).toBeTruthy();
    expect(await d.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    rows.push({locale,width:page.viewportSize()!.width,title:await d.locator('h2').textContent()});
    if(locale==='ar')await page.screenshot({path:`${root}/arabic-pro.png`,scale:'css'});
    await d.locator('button').first().click();await page.unroute('**/films/**');
  }
  for(const [w,h] of [[440,956],[874,402],[956,440],[280,653],[375,812],[768,1024],[1440,900]]){
    await page.setViewportSize({width:w,height:h});await visit(page);await page.locator('#film-play').click();await playing(page);
    const dimensions=await page.$eval('video', v=>{const r=v.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,bottom:r.bottom,fit:getComputedStyle(v).objectFit};});
    expect(dimensions.width).toBeLessThanOrEqual(w);expect(dimensions.fit).toBe('contain');expect(dimensions.bottom).toBeLessThanOrEqual(h);
    expect(await page.locator('#product-film').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
    await expect(page.locator('.product-film__close')).toBeInViewport();
    await page.$eval('video', v=>v.pause());await page.screenshot({path:`${root}/adapt-${w}x${h}.png`,scale:'css'});
    await page.locator('.product-film__close').click();rows.push({viewport:{width:w,height:h},...dimensions});
  }
  await writeFile(`${root}/matrix.json`,JSON.stringify(rows,null,2));
});


test('queued close cannot release an immediately reopened film', async ({page}) => {
  await visit(page); await page.locator('#film-play').click(); await playing(page);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      (document.getElementById('product-film') as HTMLDialogElement).close();
      document.getElementById('film-label')!.click();
    });
    await page.waitForTimeout(200);
    await expect(page.locator('#product-film')).toBeVisible();
    await expect(page.locator('video')).toHaveAttribute('src', /master\.m3u8|blob:/);
    await playing(page);
    expect(await page.evaluate(() => !!document.activeElement?.closest('#product-film'))).toBe(true);
    await expect(page.locator('.product-film__notes button')).toHaveCount(0);
  }
  await page.locator('.product-film__close').click();
  await expect(page.locator('#film-label')).toBeFocused();
  await expect.poll(() => page.$eval('video', v => [v.paused,v.networkState,v.readyState])).toEqual([true,0,0]);
});


test('unavailable HLS uses bounded small-MP4 fallback and keeps native controls', async ({page}) => {
  await visit(page);
  const requested: string[]=[];page.on('request',r=>{if(r.url().includes('/films/'))requested.push(r.url());});
  await page.route('**/*.m3u8',r=>r.abort());
  await page.locator('#film-play').click();await playing(page);
  await expect(page.locator('video')).toHaveAttribute('data-playback','mp4-fallback');
  expect(requested.some(url=>url.endsWith('/fallback.mp4'))).toBe(true);
  expect(requested.some(url=>url.includes('/uno-introduction.mp4'))).toBe(false);
  await page.locator('.product-film__close').click();
  await expect.poll(()=>page.$eval('video',v=>[v.paused,v.networkState,v.readyState])).toEqual([true,0,0]);
});


test('fallback preserves a paused position without restarting audio',async({page})=>{
  await visit(page);await page.locator('#film-play').click();await playing(page);
  await page.$eval('video',v=>{v.currentTime=30;});
  await expect.poll(()=>page.$eval('video',v=>!v.seeking&&v.currentTime>=29.9&&v.readyState>=2)).toBe(true);
  await page.$eval('video',v=>{
    v.pause();Object.defineProperty(v,'error',{configurable:true,value:{code:3,message:'QA queued native error'}});
    v.dispatchEvent(new Event('error'));Reflect.deleteProperty(v,'error');
  });
  await expect(page.locator('video')).toHaveAttribute('data-playback','mp4-fallback');
  await expect.poll(()=>page.$eval('video',v=>v.readyState>=2&&v.currentTime>=29.9&&v.paused)).toBe(true);
  const time=await page.$eval('video',v=>v.currentTime);await page.waitForTimeout(300);
  expect(await page.$eval('video',v=>v.currentTime)).toBeCloseTo(time,1);
  await page.locator('.product-film__close').click();
});

test('resume intent survives an error before a resumed frame is ready',async({page})=>{
  await visit(page);await page.locator('#film-play').click();await playing(page);
  await page.$eval('video',v=>v.pause());await page.waitForTimeout(100);
  await page.$eval('video',v=>{
    // Resume and fail in the same task, before any playing event can arrive.
    void v.play().catch(()=>{});v.dispatchEvent(new Event('error'));
  });
  await expect(page.locator('video')).toHaveAttribute('data-playback','mp4-fallback');
  await playing(page);await page.locator('.product-film__close').click();
});

test('blocked autoplay gives a localized hint and manual Play succeeds',async({page,browserName})=>{
  await page.addInitScript(()=>{
    const original=HTMLMediaElement.prototype.play;let blocked=false;
    HTMLMediaElement.prototype.play=function(){
      if(!blocked&&this.tagName==='VIDEO'){blocked=true;return Promise.reject(new DOMException('QA autoplay policy','NotAllowedError'));}
      return original.call(this);
    };
  });
  await visit(page,'ru');await page.locator('#film-play').click();
  await expect(page.locator('.product-film__notes [role=status]')).toHaveText('Нажмите воспроизведение, чтобы запустить видео.');
  if(browserName==='webkit') {
    // WebKit's native media controls are outside Playwright's DOM API. Exercise
    // a fresh real user gesture without synthesizing an autoplay allowance.
    await page.$eval('video',v=>v.addEventListener('click',e=>{e.preventDefault();void v.play();},{once:true}));
    await page.locator('video').click({position:{x:100,y:50}});
  } else { await page.locator('video').focus();await page.keyboard.press('Space'); }
  await playing(page);
  await expect(page.locator('.product-film__notes [role=status]')).toHaveText('');
  await page.locator('.product-film__close').click();
});

test('pending startup suspends its watchdog in background and rearms on return',async({page},info)=>{
  test.skip(info.project.name!=='desktop-chromium','One deterministic visibility contract owner');
  await visit(page);
  let release!:()=>void;const held=new Promise<void>(r=>{release=r;});
  await page.route('**/*.m3u8',route=>route.abort());
  await page.route('**/fallback.mp4',async route=>{await held;await route.continue().catch(()=>{});});
  try{
    await page.locator('#film-play').click();
    await expect(page.locator('video')).toHaveAttribute('data-playback','mp4-fallback');
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    await page.waitForTimeout(16000);
    await expect(page.locator('.product-film__notes button')).toHaveCount(0);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
    await expect(page.locator('.product-film__notes button')).toBeVisible({timeout:18000});
    await page.locator('.product-film__close').click();
  }finally{release();}
});

test('film suspends pending artwork readers and resumes other viewers after close',async({page})=>{
  await visit(page);
  let release!:()=>void;const held=new Promise<void>(r=>{release=r;});let requests=0;
  await page.route('**/art/wellness/*.webp',async route=>{if(route.request().resourceType()==='fetch'){requests++;await held;}await route.continue().catch(()=>{});});
  try{
    await page.locator('[data-wellness-open]').first().evaluate((e:HTMLElement)=>e.click());
    await expect.poll(()=>requests).toBeGreaterThan(0);
    await page.locator('#film-play').evaluate((e:HTMLElement)=>e.click());await playing(page);
    const before=requests;release();await page.waitForTimeout(500);
    expect(requests).toBe(before);
    await expect(page.locator('.wellness-photo img').first()).not.toHaveAttribute('data-media-ready','');
    await page.locator('.product-film__close').click();
    await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-media-ready','',{timeout:30000});
    await page.locator('.wellness-close').click();
    await page.locator('[data-technology-open]').first().evaluate((e:HTMLElement)=>e.click());
    await expect(page.locator('#technology-viewer img[data-media]').first()).toHaveAttribute('data-media-ready','',{timeout:30000});
    await page.keyboard.press('Escape');
  }finally{release();}
});

test('a short segment outage recovers HLS without a permanent MP4 downgrade',async({page},info)=>{
  test.skip(info.project.name!=='desktop-chromium','One MSE engine recovery owner');
  let enabled=false,firstFailure=0,failures=0;
  await page.route('**/*.m4s',route=>{
    if(enabled&&(!firstFailure||Date.now()-firstFailure<2400)){
      firstFailure ||= Date.now();failures++;
      return route.fulfill({status:503,contentType:'text/plain',body:'QA temporary segment outage'});
    }
    return route.continue();
  });
  await visit(page);await page.locator('#film-play').click();await playing(page);
  await expect.poll(()=>page.$eval('video',v=>v.currentTime)).toBeGreaterThan(4);
  const cachedEnd=await page.$eval('video',v=>v.buffered.end(v.buffered.length-1));enabled=true;
  await expect.poll(()=>failures).toBeGreaterThan(0);
  await expect.poll(()=>page.$eval('video',v=>v.currentTime),{timeout:25000}).toBeGreaterThan(cachedEnd+2);
  await expect(page.locator('video')).toHaveAttribute('data-playback','mse-hls');
  await expect(page.locator('.product-film__notes button')).toHaveCount(0);
  await page.locator('.product-film__close').click();
});
