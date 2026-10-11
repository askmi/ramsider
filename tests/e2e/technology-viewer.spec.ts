import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openTechnology} from './helpers/technology';
import {airShieldCopy} from '../../lib/airshield-descriptions';
import {capsuleCodeCopy} from '../../lib/capsulecode-descriptions';
import {locales} from '../../lib/i18n';

test('CapsuleCode third group: three proportional photos, exact icon axes, reversible navigation',async({page},info)=>{
 await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer');
 const ready=()=>expect(viewer).toHaveAttribute('aria-busy','false');await ready();
 for(let i=0;i<2;i++){await viewer.locator('footer button').last().click();await ready();}
 await expect(viewer).toHaveAttribute('data-group','CapsuleCode');
 await expect(viewer.locator('footer button').last()).toBeEnabled();
 const results=[];
 for(let i=0;i<3;i++){
  if(i){await viewer.locator('header button').nth(1).click();await ready();}
  await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const data=await viewer.evaluate(e=>{
   const article=e.querySelector('article')!,img=e.querySelector('article img') as HTMLImageElement,box=article.getBoundingClientRect();
   return {width:innerWidth,dpr:devicePixelRatio,photoWidth:img.getBoundingClientRect().width,photoHeight:img.getBoundingClientRect().height,ratioHeight:box.width*img.naturalHeight/img.naturalWidth,
    captions:[...e.querySelectorAll('[data-description-block^="capsule-icon-"]')].map(e=>({x:parseFloat(e.getAttribute('x')!)+90,align:getComputedStyle(e.firstElementChild!).textAlign})),
    overflow:[...e.querySelectorAll('.technology-viewer__capsule .technology-description__box')].filter(e=>e.firstElementChild!.scrollHeight>e.clientHeight+1||e.firstElementChild!.scrollWidth>e.clientWidth+1).length};
  });
  expect(Math.abs(data.photoHeight-data.ratioHeight)).toBeLessThan(1);expect(data.photoWidth).toBeCloseTo(Math.min(data.width,941),0);expect(data.overflow).toBe(0);
  expect(data.captions.map(c=>c.x)).toEqual(i===0?[]:i===1?[107,300,516,735]:[105,288,506,733]);for(const c of data.captions)expect(c.align).toBe('center');
  await viewer.locator('article').screenshot({path:`/tmp/tech03-${info.project.name}-${i+1}-article.png`});await page.screenshot({path:`/tmp/tech03-${info.project.name}-${i+1}.png`});results.push(data);
 }
 await page.keyboard.press('ArrowLeft');await ready();await expect(viewer).toHaveAttribute('data-photo-index','1');
 await viewer.locator('footer button').first().click();await ready();await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('data-photo-index','0');
 await viewer.locator('footer button').last().click();await ready();await expect(viewer).toHaveAttribute('data-group','CapsuleCode');await expect(viewer).toHaveAttribute('data-photo-index','0');
 await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();
 await page.screenshot({path:`/tmp/tech03-${info.project.name}-assembled.png`});
 await (await import('node:fs/promises')).writeFile(`/tmp/tech03-${info.project.name}-geometry.json`,JSON.stringify(results,null,2));
});

test('CapsuleCode translations fit in every locale and Arabic direction is preserved',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','one mobile locale matrix');
 for(const locale of locales){
  expect(capsuleCodeCopy[locale]).toHaveLength(3);
  await page.goto(`/${locale}`);await openTechnology(page);const v=page.locator('#technology-viewer');await expect(v).toHaveAttribute('aria-busy','false');
  for(let i=0;i<2;i++){await v.locator('footer button').last().click();await expect(v).toHaveAttribute('aria-busy','false');}
  for(let i=0;i<3;i++){
   if(i){await v.locator('header button').nth(1).click();await expect(v).toHaveAttribute('aria-busy','false');}
   await page.evaluate(()=>document.fonts.ready);
   expect(await v.locator('.technology-viewer__capsule .technology-description__box').evaluateAll(boxes=>boxes.filter(e=>e.firstElementChild!.scrollHeight>e.clientHeight+1||e.firstElementChild!.scrollWidth>e.clientWidth+1).length)).toBe(0);
   await expect(v.locator('[data-description-block="capsule-body"] > div')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
   if(locale==='ar'||locale==='de')await page.screenshot({path:`/tmp/tech03-${locale}-${i+1}.png`});
  }
 }
});

test('AirShield fourth group: source geometry, icon axes, OpenSans and every locale',async({page},info)=>{
 const matrix=info.project.name==='iphone-17-pro-webkit'?locales:['en'] as const;
 for(const locale of matrix){
  await page.goto(`/${locale}`);await openTechnology(page);const v=page.locator('#technology-viewer');
  const ready=()=>expect(v).toHaveAttribute('aria-busy','false');await ready();
  for(let i=0;i<3;i++){await v.locator('footer button').last().click();await ready();}
  await expect(v).toHaveAttribute('data-group','AirShield');await expect(v.locator('footer button').last()).toBeDisabled();
  for(let i=0;i<2;i++){
   if(i){await v.locator('header button').nth(1).click();await ready();}
   await page.evaluate(()=>document.fonts.ready);
   const data=await v.evaluate(e=>{const img=e.querySelector('article img') as HTMLImageElement,b=img.getBoundingClientRect();return {
    width:innerWidth,height:b.height,expected:b.width*1522/941,overflow:document.documentElement.scrollWidth>innerWidth,
    axes:[...e.querySelectorAll('[data-description-block^="air-icon-"]')].map(e=>({x:Number(e.getAttribute('x'))+120,align:getComputedStyle(e.firstElementChild!).textAlign})),
    fonts:[...e.querySelectorAll('.technology-viewer__airshield .technology-description__box')].map(e=>getComputedStyle(e).fontFamily),
    clipped:[...e.querySelectorAll('.technology-viewer__airshield .technology-description__box')].filter(e=>e.firstElementChild!.scrollHeight>e.clientHeight+1||e.firstElementChild!.scrollWidth>e.clientWidth+1).length};});
   expect(Math.abs(data.height-data.expected)).toBeLessThan(1);expect(data.overflow).toBe(false);expect(data.clipped).toBe(0);
   expect(data.axes.map(a=>a.x)).toEqual(i?[137.5,469.5,801.5]:[]);for(const a of data.axes)expect(a.align).toBe('center');for(const f of data.fonts)expect(f).toContain('OpenSans');
   await expect(v.locator('[data-description-block="air-body"] > div')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
   expect(airShieldCopy[locale]).toHaveLength(2);
   if(i)for(const id of ['air-eyebrow','air-headline','air-body'])await expect(v.locator(`[data-description-block="${id}"]`)).toHaveAttribute('width','520');
   if(['en','ar','de'].includes(locale)){await page.screenshot({path:`/tmp/tech04-${info.project.name}-${locale}-${i+1}.png`});await v.locator('article').screenshot({path:`/tmp/tech04-${info.project.name}-${locale}-${i+1}-article.png`});}
  }
  await page.keyboard.press('ArrowRight');await expect(v).toHaveAttribute('data-photo-index','1');
  await v.locator('footer button').first().click();await ready();await expect(v).toHaveAttribute('data-group','CapsuleCode');
  await v.locator('footer button').last().click();await ready();await expect(v).toHaveAttribute('data-photo-index','0');
  await page.keyboard.press('Escape');await expect(v).not.toBeVisible();
 }
});

test('six delivered photos exactly match current source PNGs',async()=>{
 const files=JSON.parse(await readFile('docs/evidence/technology-discrete/assets.json','utf8'));
 for(const file of files){const a=await readFile(file.source),b=await readFile(file.output);expect(a.equals(b)).toBe(true);expect(createHash('sha256').update(b).digest('hex')).toBe(file.sha256);}
});

test('photos move horizontally; technologies move vertically; source ratio and thin bars hold',async({page})=>{
 for(const locale of ['en','ar']){
  await page.goto(`/${locale}`);await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
  await expect(viewer).toHaveAttribute('data-group','NobleCraft');await expect(viewer.locator('article')).toHaveCount(1);
  const check=async()=>{
   const box=await viewer.locator('.technology-viewer__content').boundingBox();const image=await viewer.locator(".technology-viewer__photo img").boundingBox();expect(image!.height).toBeCloseTo(box!.height,0);const canvas=await page.locator(".canvas").boundingBox();expect(box!.width).toBeCloseTo(canvas!.width,0);const frame=await viewer.boundingBox();expect(frame!.x).toBeCloseTo(canvas!.x,0);expect(Math.abs(box!.height-box!.width*1522/941)).toBeLessThan(1);
   await expect(viewer.locator('.technology-viewer__toolbar--top')).toHaveCSS('height','48px');await expect(viewer.locator('.technology-viewer__toolbar--bottom')).toHaveCSS('height','48px');
  };
  await check();await page.keyboard.press('ArrowRight');await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');
  await page.keyboard.press('ArrowRight');await expect(viewer).toHaveAttribute('data-photo-index','1');
  await viewer.locator('.technology-viewer__toolbar--bottom button').last().click();await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('data-photo-index','0');await expect(viewer).toHaveAttribute('aria-busy','false');await check();
  for(let i=1;i<4;i++){await page.keyboard.press('ArrowRight');await expect(viewer).toHaveAttribute('data-photo-index',String(i));await expect(viewer).toHaveAttribute('aria-busy','false');if(i===2)await expect(viewer.locator('[data-description-block^="phone-"],[data-description-block^="diagram-"]')).toHaveCount(0);}
  await viewer.locator('.technology-viewer__toolbar--bottom button').first().click();await expect(viewer).toHaveAttribute('data-group','NobleCraft');await expect(viewer).toHaveAttribute('aria-busy','false');
  await viewer.locator('.technology-viewer__toolbar--bottom button').last().click();await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');
  await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();
 }
});

test('pending photo retains old frame; retry and close remain usable',async({page})=>{
 let valid=false;await page.route('**/art/technology/slides/noble-02.png',route=>valid?route.continue():route.fulfill({status:503,body:'failed'}));
 await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
 await page.keyboard.press('ArrowRight');await expect(viewer.getByRole('button',{name:'Retry',exact:true})).toBeVisible();await expect(viewer).toHaveAttribute('data-photo-index','0');await expect(viewer.locator('article')).toHaveCount(1);
 valid=true;await viewer.getByRole('button',{name:'Retry',exact:true}).click();await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();
});

test('native trackpad uses the new horizontal axis, and vertical input changes a fitting technology',async({browser,baseURL},info)=>{
 test.skip(info.project.name!=='desktop-chromium','one native desktop profile is sufficient');
 const context=await browser.newContext({viewport:{width:402,height:874}}),page=await context.newPage();await page.goto(`${baseURL}/en`);await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');await viewer.locator('.technology-viewer__photo img').hover({position:{x:200,y:250}});
 await page.clock.install();await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+1000);
 await page.mouse.wheel(0,2);await page.mouse.wheel(-120,4);await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');await expect(viewer).toHaveAttribute('data-group','NobleCraft');
 await page.clock.runFor(220);await page.mouse.wheel(0,120);await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');await page.clock.resume();await context.close();
});

test("keyboard pans a tall photo before changing technologies",async({page})=>{
 await page.setViewportSize({width:1024,height:650});await page.goto("/en");await openTechnology(page);const viewer=page.locator("#technology-viewer"),scroll=viewer.locator(".technology-viewer__scroll");await expect(viewer).toHaveAttribute("aria-busy","false");await scroll.focus();await page.keyboard.press("ArrowDown");await expect.poll(()=>scroll.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await expect(viewer).toHaveAttribute("data-group","NobleCraft");await scroll.evaluate(e=>{e.scrollTop=e.scrollHeight});await page.keyboard.press("ArrowDown");await expect(viewer).toHaveAttribute("data-group","HeatCore");
});

test('native light touch swipes navigate both axes; tall photos retain vertical pan',async({browser,baseURL},info)=>{
 test.skip(info.project.name!=='desktop-chromium','native Chromium touch driver');
 const context=await browser.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true,deviceScaleFactor:3}),page=await context.newPage(),client=await context.newCDPSession(page);
 await page.goto(`${baseURL}/en`);await openTechnology(page);const viewer=page.locator('#technology-viewer'),scroll=viewer.locator('.technology-viewer__scroll');await expect(viewer).toHaveAttribute('aria-busy','false');
 const swipe=async(dx:number,dy:number,cancel=false)=>{for(let i=0;i<=4;i++)await client.send('Input.dispatchTouchEvent',{type:i?'touchMove':'touchStart',touchPoints:[{x:200+dx*i/4,y:350+dy*i/4}]});await client.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});};
 await expect(scroll).toHaveCSS('touch-action','pinch-zoom');
 await swipe(-32,0);await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(32,0);await expect(viewer).toHaveAttribute('data-photo-index','0');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(0,-32);await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(0,-32);await expect(viewer).toHaveAttribute('data-group','CapsuleCode');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(-32,0);await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(32,0);await expect(viewer).toHaveAttribute('data-photo-index','0');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(0,-32);await expect(viewer).toHaveAttribute('data-group','AirShield');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(-32,0);await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(32,0);await expect(viewer).toHaveAttribute('data-photo-index','0');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(0,-32);await expect(viewer).toHaveAttribute('data-group','AirShield');
 await swipe(0,32);await expect(viewer).toHaveAttribute('data-group','CapsuleCode');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(0,32);await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(0,32);await expect(viewer).toHaveAttribute('data-group','NobleCraft');await expect(viewer).toHaveAttribute('aria-busy','false');
 await swipe(-32,0,true);await expect(viewer).toHaveAttribute('data-photo-index','0');
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:350},{x:220,y:350}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:148,y:350},{x:188,y:350}]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(viewer).toHaveAttribute('data-photo-index','0');
 await page.setViewportSize({width:1024,height:650});await expect(scroll).toHaveCSS('touch-action','pan-y pinch-zoom');await swipe(0,-120);await expect.poll(()=>scroll.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await expect(viewer).toHaveAttribute('data-group','NobleCraft');
 await swipe(-32,0);await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');
 await page.setViewportSize({width:1024,height:1800});await expect(scroll).toHaveCSS('touch-action','pinch-zoom');await context.close();
});

test('pointer close restores focus without a frame; keyboard focus stays visible',async({page},info)=>{
 await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer'),trigger=page.locator('#technology-experience');await expect(viewer).toHaveAttribute('aria-busy','false');await viewer.locator('.technology-viewer__close').click();await expect(viewer).not.toBeVisible();await expect(trigger).toBeFocused();await expect(trigger).toHaveCSS('outline-style','none');await trigger.screenshot({path:`/tmp/ramsider-focus-${info.project.name}.png`});
 await page.keyboard.press('Enter');await expect(viewer).toBeVisible();await expect(viewer).toHaveAttribute('aria-busy','false');await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();await expect(trigger).toBeFocused();await expect(trigger).toHaveCSS('outline-style','solid');
});
