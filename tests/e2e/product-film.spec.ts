import { createHash } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';

const root = 'screenshots/video';
const src = '/films/uno-introduction.mp4';
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

test('native source ranges and exact source bytes', async ({ request }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One HTTP delivery owner');
  const head = await request.head(src);
  expect(head.status()).toBe(200); expect(head.headers()['content-type']).toContain('video/mp4');
  expect(head.headers()['content-length']).toBe('344657039'); expect(head.headers()['accept-ranges']).toBe('bytes');
  const original = await readFile('public/films/uno-introduction.mp4');
  expect(createHash('sha256').update(original).digest('hex')).toBe('71891983591abac3e44a076bf58a031ec8d6aa070a2e1acf046d3bb58c44bf25');
  for (const [start,end] of [[0,1023],[1000000,1001023],[344656015,344657038]]) {
    const r = await request.get(src, {headers:{Range:`bytes=${start}-${end}`}});
    expect(r.status()).toBe(206);expect(r.headers()['content-range']).toBe(`bytes ${start}-${end}/344657039`);
    expect((await r.body()).equals(original.subarray(start,end+1))).toBe(true);
  }
  // Next's standard static handler returns500 for an unsatisfiable range (CHG0136).
  // Normal browser seek ranges above are the scoped acceptance contract.
});

test('both film controls play, seek, pause and release with modal focus restoration', async ({ page }, info) => {
  await mkdir(root,{recursive:true});
  const errors: string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const mediaRequests: string[]=[];page.on('request',r=>{if(r.url().includes(src))mediaRequests.push(r.url());});
  await visit(page);
  const viewport=page.viewportSize()!;
  if(info.project.name.includes('iphone')) expect(await page.evaluate(()=>[innerWidth,devicePixelRatio])).toEqual([viewport.width,3]);
  expect(mediaRequests).toHaveLength(0);expect(await page.locator('video').getAttribute('src')).toBeNull();
  await page.screenshot({path:`${root}/closed-${info.project.name}.png`,scale:'css'});
  for (const id of ['film-play','film-label']) {
    const trigger=page.locator(`#${id}`);await trigger.focus();const before=await page.evaluate(()=>scrollY);
    await trigger.press('Enter');await expect(page.locator('#product-film')).toBeVisible();await playing(page);
    expect(await page.$eval('video', v=>[v.videoWidth,v.videoHeight,v.controls,v.hasAttribute('playsinline')])).toEqual([3840,2160,true,true]);
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
  await page.route(`**${src}`,async route=>{if(held)await route.abort();else await route.continue();});
  await page.locator('#film-play').click();await expect(page.locator('.product-film__notes button')).toBeVisible();
  await page.screenshot({path:`${root}/error-${info.project.name}.png`,scale:'css'});
  held=false;await page.locator('.product-film__notes button').click();await playing(page);
  await page.locator('.product-film__close').click();
  let release!:()=>void;const gate=new Promise<void>(r=>release=r);
  await page.unroute(`**${src}`);
  await page.route(`**${src}`,async route=>{await gate;await route.abort().catch(()=>{});});
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
  await page.screenshot({path:`${root}/fullscreen-chromium.png`,scale:'css'});
  await page.evaluate(()=>document.exitFullscreen());await page.locator('.product-film__close').click();
});

test('eleven localized dialogs, RTL, and representative portrait/landscape adaptation',async({page},info)=>{
  test.setTimeout(120000);
  test.skip(info.project.name!=='iphone-17-pro-webkit','One WebKit matrix owner');
  const rows: Array<Record<string, unknown>>=[];
  for(const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']){
    await visit(page,locale);await page.route(`**${src}`,route=>route.abort());await page.locator('#film-play').click();
    await expect(page.locator('.product-film__notes button')).toBeVisible();
    const d=page.locator('#product-film');expect(await d.getAttribute('dir')).toBe(locale==='ar'?'rtl':'ltr');
    expect(await d.locator('h2').textContent()).toBeTruthy();expect(await d.locator('[role=status]').textContent()).toBeTruthy();
    expect(await d.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    rows.push({locale,width:page.viewportSize()!.width,title:await d.locator('h2').textContent()});
    if(locale==='ar')await page.screenshot({path:`${root}/arabic-pro.png`,scale:'css'});
    await d.locator('button').first().click();await page.unroute(`**${src}`);
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
    await expect(page.locator('video')).toHaveAttribute('src', '/films/uno-introduction.mp4');
    await playing(page);
    expect(await page.evaluate(() => !!document.activeElement?.closest('#product-film'))).toBe(true);
    await expect(page.locator('.product-film__notes button')).toHaveCount(0);
  }
  await page.locator('.product-film__close').click();
  await expect(page.locator('#film-label')).toBeFocused();
  await expect.poll(() => page.$eval('video', v => [v.paused,v.networkState,v.readyState])).toEqual([true,0,0]);
});
