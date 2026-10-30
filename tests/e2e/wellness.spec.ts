import { test, expect, type Page } from '@playwright/test';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const dialog = '#wellness-viewer', scroll = '.wellness-scroll';
const root = 'design/references/RAMSIDER_Wellness_TOP/';
const photos = ['01-ritual_uno_white_v3.webp', '03-botanicals.webp', '04-capsules_v3.webp', '02-water_bouquet.webp'];
async function landing(page: Page, locale = 'en') {
  await page.goto(`/${locale}`);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-media-hydrated'));
  await page.locator('#beyond-learn').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('.page-media-overlay'));
}
async function open(page: Page, locale = 'en') {
  await landing(page, locale); await page.locator('#beyond-learn').click();
  await expect(page.locator(`${dialog}[open] .wellness-ribbon`)).toBeVisible();
}
async function decoded(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll<HTMLImageElement>('.wellness-photo img')].map(async image => {
      image.loading = 'eager'; await image.decode();
    }));
  });
  await expect(page.locator('.wellness-photo img[data-media-ready]')).toHaveCount(4,{timeout:30000});
}
async function buttonContrast(button: import('@playwright/test').Locator) {
  return button.evaluate(e => {
    const css=getComputedStyle(e);
    const luminance=(color:string)=>{
      const channels=(color.match(/[0-9.]+/g)??[]).slice(0,3).map(Number).map(n=>n/255);
      return channels.map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
    };
    const a=luminance(css.color),b=luminance(css.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
}
async function frame(page: Page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

test('exact source copy, lossless sRGB WebP delivery, every photo entry and complete reading', async ({ page }, info) => {
  test.setTimeout(120000); await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.url().includes('/art/wellness/')) requests.push(r.url()); });
  await landing(page); expect(requests).toEqual([]);
  const opener = page.locator('#beyond-learn'); await expect(opener).toHaveAttribute('aria-controls', 'wellness-viewer');
  expect(await opener.evaluate(e => e.tagName)).toBe('BUTTON');
  await opener.click(); await decoded(page);
  const modal = page.locator(dialog); await expect(modal.locator('article>section')).toHaveCount(5);
  const source = await readFile(`${root}index.html`, 'utf8');
  const sections = [...source.split('<article class="ribbon">')[1].matchAll(/<section[^>]*>([\s\S]*?)<\/section>/g)];
  for (let i = 0; i < sections.length; i++) {
    const expectedTitle = [...sections[i][1].matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/g)][0][1].replace(/<[^>]+>/g, '');
    const section = modal.locator('article>section').nth(i);
    expect(await section.locator('h1,h2').textContent()).toBe(expectedTitle);
    expect(await section.locator('.wellness-copy p').allTextContents()).toEqual([...sections[i][1].matchAll(/<p class="reveal">([\s\S]*?)<\/p>/g)].map(m => m[1]));
  }
  const width = await modal.evaluate(e => e.getBoundingClientRect().width);
  const viewport = page.viewportSize()!;
  if (info.project.name.includes('iphone')) expect(await page.evaluate(() => [innerWidth, devicePixelRatio])).toEqual([info.project.name.includes('max') ? 440 : 402, 3]);
  expect(width).toBe(Math.min(viewport.width, 640));
  await mkdir('screenshots/wellness', { recursive: true });
  const photoResults = [];
  for (let i = 0; i < photos.length; i++) {
    const image = modal.locator('img').nth(i), figure = modal.locator('.wellness-photo').nth(i);
    const response = await page.request.get(`/art/wellness/${photos[i]}`);
    expect(response.status()).toBe(200); expect(response.headers()['content-type']).toContain('image/webp');
    const body = await response.body();
    expect(createHash('sha256').update(body).digest('hex')).toBe(createHash('sha256').update(await readFile(`public/art/wellness/${photos[i]}`)).digest('hex'));
    const metadata = await sharp(body).metadata();
    expect(metadata.format).toBe('webp'); expect(metadata.icc?.length).toBeGreaterThan(0);
    const decodedPixels = await sharp(body, { ignoreIcc: true }).ensureAlpha().raw().toBuffer();
    const master = await sharp(`${root}assets/${photos[i].replace('.webp', '.png')}`, { ignoreIcc: true }).ensureAlpha().raw().toBuffer();
    expect(decodedPixels.equals(master)).toBe(true);
    const size = await image.evaluate(element => { const e=element as HTMLImageElement,b=e.getBoundingClientRect(),s=getComputedStyle(e); return {width:b.width,height:b.height,natural:[e.naturalWidth,e.naturalHeight],fit:s.objectFit,position:s.objectPosition}; });
    expect(size.natural).toEqual([1024,1536]); expect(size.width).toBeCloseTo(width, 0);expect(size.fit).toBe('cover');
    expect(size.height).toBeCloseTo(width * (i === 0 ? (viewport.width >= 600 ? 1 : 1.5) : 1.25), 0);
    const y = await figure.evaluate(e => (e as HTMLElement).offsetTop);
    // First128px entry must contain the actual image, not a flat decoded placeholder.
    await page.locator(scroll).evaluate((s, top) => s.scrollTo({top,behavior:'instant'}), Math.max(0,y-viewport.height+128)); await frame(page);
    await expect(figure.locator('img')).toHaveAttribute('data-media-ready','');
    const box = (await figure.boundingBox())!, shot = await page.screenshot({path:`screenshots/wellness/entry-${info.project.name}-${i}.png`,scale:'css'});
    const top = Math.max(0,Math.ceil(box.y)), h = Math.min(100,viewport.height-top-2);
    const pixels = await sharp(shot).extract({left:Math.ceil(box.x)+4,top,width:Math.floor(box.width)-8,height:h}).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const row = pixels.info.width*3;let changed=0;
    for(let j=row;j<pixels.data.length;j++) if(pixels.data[j]!==pixels.data[j%row]) changed++;
    expect(changed).toBeGreaterThan(pixels.info.width*3); photoResults.push({...size,firstEntryChangedChannels:changed});
    await page.locator(scroll).evaluate((s,top)=>s.scrollTo({top,behavior:'instant'}),y); await frame(page);
    await page.screenshot({path:`screenshots/wellness/photo-${info.project.name}-${i}.png`,scale:'css'});
  }
  await page.locator(scroll).evaluate(s=>s.scrollTo({top:s.scrollHeight,behavior:'instant'}));await frame(page);
  await page.screenshot({path:`screenshots/wellness/end-${info.project.name}.png`,scale:'css'});
  await expect(modal.getByRole('button',{name:'Back to UNO',exact:true})).toBeInViewport();
  const close = modal.getByRole('button',{name:'Close',exact:true});expect((await close.boundingBox())!.height).toBe(44);
  const css = await modal.locator('.wellness-eyebrow').first().evaluate(e=>({color:getComputedStyle(e).color,size:getComputedStyle(e).fontSize}));expect(css.color).toBe('rgb(143, 105, 69)');
  expect(errors).toEqual([]);
  await writeFile(`screenshots/wellness/composition-${info.project.name}.json`,JSON.stringify({viewport,width,photoResults,eyebrow:css,errors},null,2));
});

test('keyboard, page lock, three close paths and immediate repeated reopen', async ({page}) => {
  test.setTimeout(120000); await landing(page);
  await page.waitForFunction(()=>document.documentElement.hasAttribute('data-story-media-ready'));
  await page.locator('#beyond-learn').evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await frame(page);
  const saved=await page.evaluate(()=>scrollY);await page.locator('#beyond-learn').click();await decoded(page);
  const modal=page.locator(dialog), viewport=page.locator(scroll);
  await expect(modal.getByRole('button',{name:'Close',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');await expect(viewport).toBeFocused();await page.keyboard.press('End');
  await expect.poll(()=>viewport.evaluate(s=>s.scrollTop)).toBeGreaterThan(2000);
  if (!test.info().project.name.includes('iphone')) await page.mouse.wheel(0,700);
  else expect(await page.evaluate(() => { const event=new WheelEvent('wheel',{deltaY:700,bubbles:true,cancelable:true});document.body.dispatchEvent(event);return event.defaultPrevented; })).toBe(true);
  expect(Math.abs(await page.evaluate(()=>scrollY)-saved)).toBeLessThanOrEqual(1);
  await page.keyboard.press('Home');await expect.poll(()=>viewport.evaluate(s=>s.scrollTop)).toBe(0);
  await page.keyboard.press('PageDown');await expect.poll(()=>viewport.evaluate(s=>s.scrollTop)).toBeGreaterThan(100);
  await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();await expect(page.locator('#beyond-learn')).toBeFocused();
  await expect.poll(async()=>Math.abs(await page.evaluate(()=>scrollY)-saved)).toBeLessThanOrEqual(1);
  for(let i=0;i<4;i++){
    await page.locator('#beyond-learn').press('Enter');await expect(modal).toBeVisible();
    await expect.poll(()=>viewport.evaluate(s=>s.scrollTop)).toBe(0);
    await page.keyboard.press('Tab');await page.keyboard.press('End');
    await expect.poll(()=>viewport.evaluate(s=>s.scrollTop)).toBeGreaterThan(2000);
    await modal.getByRole('button',{name:'Back to UNO',exact:true}).click();await expect(modal).not.toBeVisible();
  }
  await page.locator('#beyond-learn').click();await modal.locator('.wellness-close').click();await expect(modal).not.toBeVisible();
  await page.locator('#beyond-learn').click();await modal.locator('h1').click();await expect(modal).toBeVisible();
  if(page.viewportSize()!.width>640){await page.mouse.click(20,200);await expect(modal).not.toBeVisible();}
});

test('failed photo Retry recovers lossless WebP; Close works while pending', async ({page}) => {
  test.setTimeout(120000);await page.emulateMedia({reducedMotion:'reduce'});let fail=true;const bytes=await readFile(`public/art/wellness/${photos[0]}`);
  await page.route(`**/art/wellness/${photos[0]}*`,route=> fail?route.fulfill({status:503,body:'Unavailable'}):route.fulfill({status:200,contentType:'image/webp',body:bytes}));
  await open(page);const modal=page.locator(dialog),photo=modal.locator('.wellness-photo').first();
  await expect(modal.getByRole('button',{name:'Retry',exact:true})).toBeVisible();
  expect(await buttonContrast(modal.getByRole('button',{name:'Retry',exact:true}))).toBeGreaterThanOrEqual(4.5);
  await page.screenshot({path:'screenshots/wellness/error.png',scale:'css'});
  fail=false;await modal.getByRole('button',{name:'Retry',exact:true}).click();await expect(photo.locator('img')).toHaveAttribute('data-media-ready','');
  await page.keyboard.press('Escape');await expect(modal).not.toBeVisible();
  let release!:()=>void;const wait=new Promise<void>(resolve=>release=resolve);
  await page.route(`**/art/wellness/${photos[0]}*`,async route=>{await wait;await route.fulfill({status:200,contentType:'image/webp',body:bytes}).catch(()=>{});});
  await page.locator('#beyond-learn').click();await expect(modal.locator('.wellness-close')).toBeVisible();
  await modal.locator('.wellness-close').click();await expect(modal).not.toBeVisible();release();
});

test('eleven locales and responsive geometry including Arabic and short heights', async ({page},info)=>{
  test.skip(info.project.name!=='iphone-17-pro-webkit','One complete locale/adaptation matrix; core behavior runs all profiles.');test.setTimeout(240000);
  await page.emulateMedia({reducedMotion:'reduce'});
  const results=[];
  for(const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']){
    await page.setViewportSize({width:402,height:874});await open(page,locale);await decoded(page);
    await expect(page.locator('.wellness-ribbon')).toHaveAttribute('lang',locale);
    await expect(page.locator('.wellness-ribbon')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
    if(locale==='ar'){for(let i=0;i<5;i++){const head=page.locator('.wellness-head').nth(i),y=await head.evaluate(e=>(e as HTMLElement).offsetTop);await page.locator(scroll).evaluate((s,top)=>s.scrollTo({top,behavior:'instant'}),y);await frame(page);await page.screenshot({path:`screenshots/wellness/ar-section-${i}.png`,scale:'css'});}}
    const title=await page.locator(`${dialog} h1`).textContent();if(locale!=='en')expect(title).not.toBe('What a BreathCan Bring Back.');
    for(const [width,height] of [[280,650],[402,560],[440,650],[768,1024],[1440,900]]){
      await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);
      await expect.poll(()=>page.locator(scroll).evaluate(s=>s.clientHeight)).toBe(height);await frame(page);
      const overflow=await page.locator(scroll).evaluate(s=>({width:s.clientWidth,scroll:s.scrollWidth,body:document.documentElement.scrollWidth,inner:innerWidth}));expect(overflow.scroll).toBeLessThanOrEqual(overflow.width+1);expect(overflow.body).toBeLessThanOrEqual(overflow.inner+1);
      await page.locator(scroll).evaluate(s=>s.scrollTo({top:s.scrollHeight,behavior:'instant'}));
      await expect(page.locator(`${dialog} [data-wellness-close]`)).toBeInViewport();
      if(width===402 || (locale==='ar'&&width===768)){await frame(page);await page.screenshot({path:`screenshots/wellness/adapt-${locale}-${width}.png`,scale:'css'});}
      results.push({locale,viewportWidth:width,viewportHeight:height,scrollportWidth:overflow.width,scrollWidth:overflow.scroll,bodyWidth:overflow.body,innerWidth:overflow.inner});
    }
    await page.keyboard.press('Escape');
  }
  await writeFile('screenshots/wellness/locales-adaptation.json',JSON.stringify(results,null,2));
});

test('text reveal and reduced motion react to preference changes',async({page},info)=>{
  test.skip(info.project.name!=='iphone-17-pro-webkit','Animation states sampled once, composition runs all profiles.');test.setTimeout(90000);
  await page.emulateMedia({reducedMotion:'no-preference'});await open(page);await decoded(page);
  await page.locator(scroll).evaluate(s=>s.scrollTo({top:600,behavior:'instant'}));
  await expect(page.locator('.wellness-head').first()).toHaveClass(/is-visible/);
  await expect.poll(()=>page.locator('.wellness-head').first().evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const text of await page.locator('.wellness-reveal').all()){expect(await text.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');expect(await text.evaluate(e=>getComputedStyle(e).transform)).toBe('none');}
});

test('early opening shows a preview independently of failed later landing artwork',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','Priority acceptance also runs loading-flow on all profiles.');await page.route('**/art/story-v2-14.webp*',route=>route.fulfill({status:503,body:'Unavailable'}));await page.goto('/en');await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));await page.locator('#beyond-learn').evaluate((e:HTMLElement)=>e.click());await expect(page.locator('.wellness-ribbon')).toBeVisible();await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-preview','ready');await page.locator('.wellness-close').click();
});

test('delayed next photo retains geometry and paints on release, safe-area controls stay usable',async({page},info)=>{
  test.skip(!info.project.name.includes('iphone'),'Required mobile delayed entry on both sizes.');test.setTimeout(120000);
  await page.emulateMedia({reducedMotion:'reduce'});let release!:()=>void;const waiting=new Promise<void>(resolve=>release=resolve);
  await page.route(`**/art/wellness/${photos[1]}*`,async route=>{await waiting;await route.continue().catch(()=>{});});
  await open(page);const photo=page.locator('.wellness-photo').nth(1),viewport=page.locator(scroll);
  const y=await photo.evaluate(e=>(e as HTMLElement).offsetTop);await viewport.evaluate((s,top)=>s.scrollTo({top,behavior:'instant'}),y);
  await expect(photo.locator('img')).not.toHaveAttribute('data-media-ready','');const before=(await photo.boundingBox())!;
  await expect(photo.locator('img')).toHaveAttribute('data-preview','ready');await expect(page.locator(`${dialog} .media-orbit`)).toHaveCount(0);await page.screenshot({path:`screenshots/wellness/delayed-${info.project.name}.png`,scale:'css'});
  release();await expect(photo.locator('img')).toHaveAttribute('data-media-ready','');const after=(await photo.boundingBox())!;expect(after.height).toBeCloseTo(before.height,0);expect(after.y).toBeCloseTo(before.y,0);
  await frame(page);await page.screenshot({path:`screenshots/wellness/recovered-${info.project.name}.png`,scale:'css'});
  // Synthetic inset geometry supplements, never certifies physical browser chrome.
  await page.addStyleTag({content:'.wellness-close{top:59px;right:24px}.wellness-end{padding-bottom:70px}'});
  await viewport.evaluate(s=>s.scrollTo({top:s.scrollHeight,behavior:'instant'}));await expect(page.locator('[data-wellness-close]')).toBeInViewport();
  const close=page.locator('.wellness-close'),box=(await close.boundingBox())!;expect(box.y).toBe(59);expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('button')?.className,{x:box.x+22,y:box.y+22})).toBe('wellness-close');
  await close.click();await expect(page.locator(dialog)).not.toBeVisible();
});

test('320 and 375 EN/AR preserve photo, controls and full end access',async({page},info)=>{
  test.skip(info.project.name!=='iphone-17-pro-webkit','Bounded missing phone-width acceptance, mobile WebKit DPR3.');test.setTimeout(120000);
  await page.emulateMedia({reducedMotion:'reduce'});const rows=[];
  for(const locale of ['en','ar']){
    await open(page,locale);await decoded(page);
    for(const width of [320,375]){
      await page.setViewportSize({width,height:812});await expect.poll(()=>page.locator(scroll).evaluate(s=>s.clientHeight)).toBe(812);await frame(page);
      const y=await page.locator('.wellness-head').nth(2).evaluate(e=>(e as HTMLElement).offsetTop);await page.locator(scroll).evaluate((s,top)=>s.scrollTo({top,behavior:'instant'}),y);await frame(page);
      const geometry=await page.locator(scroll).evaluate(s=>({scrollportWidth:s.clientWidth,scrollWidth:s.scrollWidth}));expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.scrollportWidth+1);
      expect((await page.locator('.wellness-photo').nth(2).boundingBox())!.width).toBeCloseTo(width,0);
      await page.screenshot({path:`screenshots/wellness/narrow-${locale}-${width}.png`,scale:'css'});
      await page.locator(scroll).evaluate(s=>s.scrollTo({top:s.scrollHeight,behavior:'instant'}));await expect(page.locator('[data-wellness-close]')).toBeInViewport();await expect(page.locator('.wellness-close')).toBeInViewport();
      await page.screenshot({path:`screenshots/wellness/narrow-end-${locale}-${width}.png`,scale:'css'});rows.push({locale,viewportWidth:width,viewportHeight:812,...geometry});
    }
    await page.locator('.wellness-close').click();
  }
  await writeFile('screenshots/wellness/narrow-geometry.json',JSON.stringify(rows,null,2));
});

// CHG0134 supersedes abort/restart gallery warming. The shared bounded, demand-prioritized,
// no-abort queue, partial native stream, early section and repeat-close contracts are exercised
// by loading-flow.spec.ts instead of keeping assertions for the removed story barrier.
