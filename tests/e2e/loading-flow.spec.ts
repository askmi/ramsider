import {test,expect,type Page} from '@playwright/test';
import previews from '../../lib/media-previews.json' with {type:'json'};
import {mkdirSync,readFileSync} from 'node:fs';
import {createServer} from 'node:http';
// Art holds must reach Playwright even after the film's unrelated SW claims the page.
test.use({serviceWorkers:'block'});
const releases=new Set<()=>void>();test.afterEach(()=>{releases.forEach(release=>release());releases.clear();});
const shot='screenshots/loading-flow';mkdirSync(shot,{recursive:true});
async function hold(page:Page){
 let release!:()=>void;const wait=new Promise<void>(resolve=>{release=resolve;});releases.add(release);let active=0,max=0;const urls:string[]=[];
 await page.route('**/art/**/*.webp',async route=>{const req=route.request();if(req.resourceType()==='fetch'){active++;max=Math.max(max,active);urls.push(req.url());await wait;try{await route.continue();}catch{}active--;}else await route.continue();});
 return {release,get active(){return active;},get max(){return max;},urls};
}
async function open(page:Page,name:string){await page.locator(`[data-${name}-open]`).first().evaluate((element:HTMLElement)=>element.click());await expect(page.locator(`#${name}-viewer`)).toBeVisible();}
test('all substantial blocks and every optional slide have initial HTML previews',async({request})=>{
 const html=await (await request.get('/en')).text();
 for(const [src,entry] of Object.entries(previews)){expect(html,src).toContain(entry.src);}
 expect(html).toContain('rel="preload" as="image" href="/art/00.webp"');
 expect(html).not.toContain('media-loading__track');
});
test('visible preview survives stalled originals; global queue bounded; optional section independent',async({page},info)=>{
 const held=await hold(page);await page.goto('/en');await page.waitForTimeout(800);
 await expect(page.locator('.art img').first()).toHaveAttribute('data-preview','ready');
 const tile=page.locator('img[data-original="/art/01.webp"]');const tileBefore=await tile.boundingBox();expect(Math.abs(tileBefore!.height-tileBefore!.width*2802/941)).toBeLessThan(1);
 await expect(page.locator('.media-orbit')).toHaveCount(0);
 expect(held.max).toBeLessThanOrEqual(3);
 await open(page,'wellness');const hero=page.locator('.wellness-photo img').first();await expect(hero).toHaveAttribute('data-preview','ready');await expect(hero).toHaveAttribute('src',/^data:image/);await expect.poll(()=>page.locator('.wellness-photo img[data-preview=ready]').count()).toBe(4);await page.waitForTimeout(100);
 await page.screenshot({path:`${shot}/held-wellness-${info.project.name}.png`});
 const scroll=page.locator('.wellness-scroll');await scroll.focus();await scroll.press('ArrowDown');await page.waitForTimeout(350);
 const slowed=await scroll.evaluate(e=>e.scrollTop);expect(slowed).toBeGreaterThan(0);expect(slowed).toBeLessThan(55);
 await scroll.press('ArrowUp');await page.waitForTimeout(100);expect(await scroll.evaluate(e=>e.scrollTop)).toBeLessThan(slowed);
 await page.locator('.wellness-close').click();await expect(page.locator('#wellness-viewer')).not.toBeVisible();
 held.release();await expect(hero).toHaveAttribute('data-media-ready','',{timeout:30000});
 expect(held.max).toBeLessThanOrEqual(3);await expect(tile).toHaveAttribute('data-media-ready','');expect(Math.abs((await tile.boundingBox())!.height-tileBefore!.height)).toBeLessThan(1);
});
test('technical preview commits before original and navigation stays usable',async({page},info)=>{
 const held=await hold(page);await page.goto('/en');await open(page,'technology');
 const viewer=page.locator('#technology-viewer');await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('src',/^data:image/);
 await expect(viewer.locator('.media-orbit')).toHaveCount(0);
 await page.waitForTimeout(500);await viewer.getByRole('button',{name:'Next Slide',exact:true}).click();await expect(viewer).toHaveAttribute('data-photo-index','1');
 await page.screenshot({path:`${shot}/held-technology-${info.project.name}.png`});
 await viewer.getByRole('button',{name:'Close technology viewer'}).click();held.release();await expect(viewer).not.toBeVisible();
});
test('missing preview uses milk disc, bounded forward input, honest progress, recovery',async({page},info)=>{
 const held=await hold(page);
 await page.goto('/en');await open(page,'wellness');
 await page.locator('.wellness-photo img').first().evaluate((image:HTMLImageElement)=>{image.src='data:image/webp;base64,AA==';});
 await expect(page.locator('#wellness-viewer .media-orbit')).toBeVisible();
 const circle=page.locator('#wellness-viewer .media-orbit');await expect(circle).not.toHaveAttribute('aria-valuenow');
 const scroller=page.locator('.wellness-scroll');await scroller.focus();await scroller.press('PageDown');await page.waitForTimeout(250);expect(await scroller.evaluate(e=>e.scrollTop)).toBe(0);
 await page.screenshot({path:`${shot}/spinner-${info.project.name}.png`});
 // Exercise progress presentation independently of transport chunk coalescing.
 await page.locator('.wellness-photo img').first().evaluate(image=>{(image as HTMLElement).dataset.mediaProgress='50';document.dispatchEvent(new Event('media-state'));});
  await expect(circle).toHaveAttribute('aria-valuenow','50');
  await expect.poll(()=>circle.locator('.media-orbit__scale').evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).a)).toBeCloseTo(.5,3);
 held.release();await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-media-ready','',{timeout:30000});await expect(circle).toHaveCount(0);
});
test('error retains preview and Retry succeeds, close/reopen cached original',async({page})=>{
 let fail=true;await page.route('**/art/wellness/01-ritual_uno_white_v3.webp',route=>fail?route.abort():route.continue());
 await page.goto('/en');await open(page,'wellness');await expect(page.locator('#wellness-viewer').getByRole('button',{name:'Retry',exact:true})).toBeVisible();
 await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-preview','ready');fail=false;
 await page.locator('#wellness-viewer').getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-media-ready','',{timeout:30000});
 await page.locator('.wellness-close').click();await open(page,'wellness');await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-media-ready','');
});
test('ready geometry, sections, all locale overflow, reduced motion and assembled page',async({page},info)=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/en');await expect(page.locator('.art img').first()).toHaveAttribute('data-media-ready','');
 await page.screenshot({path:`${shot}/ready-main-${info.project.name}.png`});
 for(const name of ['wellness','charcoal','technology']){await open(page,name);await expect(page.locator(`#${name}-viewer img[data-media]`).first()).toHaveAttribute('data-media-ready','',{timeout:30000});await page.screenshot({path:`${shot}/ready-${name}-${info.project.name}.png`});await page.locator(`#${name}-viewer`).evaluate((e:HTMLDialogElement)=>e.close());}
 await expect(page.locator('html')).toHaveAttribute('data-story-media-ready','',{timeout:60000});
 await page.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));await page.waitForTimeout(150);await page.screenshot({path:`${shot}/ready-footer-${info.project.name}.png`});
 expect(errors).toEqual([]);
 for(const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']){await page.goto('/'+locale);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();if(locale==='ar')await expect(page.locator('html')).toHaveAttribute('dir','rtl');}
});

for(const unknown of [false,true])test(`actual streamed bytes ${unknown?'without length stay indeterminate':'with length shrink radius'}`,async({page},info)=>{
 test.setTimeout(45000);
 const source='/art/wellness/01-ritual_uno_white_v3.webp',bytes=readFileSync('public'+source);
 let finishUnknown=false,requested=false;
 const server=createServer((_request,response)=>{
  response.setHeader('Access-Control-Allow-Origin','*');response.setHeader('Content-Type','image/webp');if(!unknown)response.setHeader('Content-Length',bytes.length);
  let offset=0;const timer=setInterval(()=>{if(unknown&&offset>=65536&&!finishUnknown)return;if(offset>=bytes.length){clearInterval(timer);response.end();return;}const end=Math.min(bytes.length,offset+32768);response.write(bytes.subarray(offset,end));offset=end;},90);response.on('close',()=>clearInterval(timer));
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw new Error('No stream port');
 try{
  await page.route('**'+source,route=>{requested=true;return route.continue({url:`http://127.0.0.1:${address.port}/image`});});
  await page.goto('/en');await open(page,'wellness');await expect.poll(()=>requested).toBe(true);
  await page.locator('.wellness-photo img').first().evaluate((image:HTMLImageElement)=>{image.src='data:image/webp;base64,AA==';});
  const orbit=page.locator('#wellness-viewer .media-orbit');await expect(orbit).toBeVisible();
  if(unknown){await page.waitForTimeout(500);await expect(orbit).not.toHaveAttribute('aria-valuenow');finishUnknown=true;}
  else{await expect.poll(async()=>Number(await orbit.getAttribute('aria-valuenow'))).toBeGreaterThan(15);const first=Number(await orbit.getAttribute('aria-valuenow'));await page.waitForTimeout(600);expect(Number(await orbit.getAttribute('aria-valuenow'))).toBeGreaterThan(first);await page.screenshot({path:`${shot}/streamed-progress-${info.project.name}.png`});}
  await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-media-ready','',{timeout:15000});await expect(orbit).toHaveCount(0);
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
test('native wheel resistance is reversible; missing preview bounds user input without rewinding external positions',async({page,browserName},info)=>{
 test.skip(browserName==='webkit'&&!!info.project.use.isMobile,'Mobile WebKit runner has no native mouse wheel; touch verified separately.');
 const held=await hold(page);await page.goto('/en');await open(page,'wellness');const scroller=page.locator('.wellness-scroll');await scroller.hover();
 await page.mouse.wheel(0,400);await page.waitForTimeout(450);const y=await scroller.evaluate(e=>e.scrollTop);expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(350);
 await page.mouse.wheel(0,-400);await page.waitForTimeout(180);expect(await scroller.evaluate(e=>e.scrollTop)).toBeLessThan(y);
 await page.locator('.wellness-photo img').first().evaluate((e:HTMLImageElement)=>e.src='data:image/webp;base64,AA==');await page.waitForTimeout(150);await scroller.focus();await scroller.press('PageDown');await page.waitForTimeout(150);expect(await scroller.evaluate(e=>e.scrollTop)).toBe(0);
 const external=await scroller.evaluate(e=>{e.scrollTop=5000;return e.scrollTop;});await page.waitForTimeout(150);expect(await scroller.evaluate(e=>e.scrollTop)).toBe(external);
 expect(browserName).toBeTruthy();held.release();
});
test('no JavaScript retains readable native original artwork',async({browser},info)=>{
 const context=await browser.newContext({javaScriptEnabled:false,viewport:info.project.use.viewport});const page=await context.newPage();await page.goto('/en');expect(await page.locator('.canvas').innerText()).toContain('A New Category');await expect(page.locator('.media-orbit')).toHaveCount(0);await page.screenshot({path:`${shot}/nojs-${info.project.name}.png`});await context.close();
});

test('touch resistance and reverse on mobile, native Chromium or WebKit event contract',async({page,browserName})=>{
 const held=await hold(page);await page.setViewportSize({width:402,height:874});await page.goto('/en');await open(page,'wellness');const scroll=page.locator('.wellness-scroll');
 if(browserName==='chromium'){
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:600}]});for(let y=580;y>=300;y-=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y}]});}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);
 }else{
  await scroll.evaluate(element=>{const send=(name:string,y:number|null)=>{const event=new Event(name,{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:y===null?[]:[{identifier:1,target:element,clientX:180,clientY:y}]});element.dispatchEvent(event);};send('touchstart',600);for(let y=580;y>=300;y-=20)send('touchmove',y);send('touchend',null);});await page.waitForTimeout(300);
 }
 const y=await scroll.evaluate(e=>e.scrollTop);expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(280);await scroll.focus();await scroll.press('ArrowUp');await page.waitForTimeout(120);expect(await scroll.evaluate(e=>e.scrollTop)).toBeLessThan(y);held.release();
});

test('technology height fit stays stable while preview sharpens',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:402,height:600});const held=await hold(page);await page.goto('/en');await open(page,'technology');const image=page.locator('#technology-viewer .technology-viewer__photo img');await expect(image).toHaveAttribute('data-preview','ready');
 const scroll=page.locator('.technology-viewer__scroll');await scroll.evaluate(e=>e.scrollTop=180);await page.waitForTimeout(150);const before=await scroll.evaluate(e=>e.scrollTop);expect(before).toBe(0);expect(await scroll.evaluate(e=>e.scrollHeight-e.clientHeight)).toBeLessThanOrEqual(1);const box=await image.boundingBox();held.release();await expect(image).toHaveAttribute('data-media-ready','',{timeout:30000});expect(Math.abs(await scroll.evaluate(e=>e.scrollTop)-before)).toBeLessThan(2);const sharpened=await image.boundingBox();expect(sharpened!.height).toBeCloseTo(box!.height,0);expect(sharpened!.width).toBeCloseTo(box!.width,0);expect(errors).toEqual([]);
});
test('early eager hero failure stays recoverable after hydration',async({page})=>{
 let failed=true;await page.route('**/art/00.webp',route=>failed?route.abort():route.continue());await page.goto('/en');await expect(page.locator('.art img').first()).toHaveAttribute('data-media-error','');await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeVisible();failed=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('.art img').first()).toHaveAttribute('data-media-ready','');
});

test('failed original stays retryable without hidden observer retries',async({page})=>{
 let requests=0;const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await page.route('**/art/wellness/01-ritual_uno_white_v3.webp',route=>{requests++;return route.abort();});await page.goto('/en');await open(page,'wellness');await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-media-error','');const scroll=page.locator('.wellness-scroll');await scroll.evaluate(e=>e.scrollTop=2500);await page.waitForTimeout(120);await scroll.evaluate(e=>e.scrollTop=0);await page.waitForTimeout(300);expect(requests).toBe(1);expect(errors).toEqual([]);await expect(page.locator('#wellness-viewer').getByRole('button',{name:'Retry',exact:true})).toBeVisible();
});

test('a missing/error charcoal strip gets feedback despite earlier usable pending preview',async({page},info)=>{
 let release!:()=>void;const wait=new Promise<void>(resolve=>release=resolve);releases.add(release);await page.route('**/art/charcoal/1-0.webp',async route=>{await wait;try{await route.continue();}catch{}});await page.route('**/art/charcoal/1-1.webp',route=>route.abort());await page.goto('/en');await open(page,'charcoal');const images=page.locator('#charcoal-viewer img[data-media]');await expect(images.first()).toHaveAttribute('data-preview','ready');await expect(images.nth(1)).toHaveAttribute('data-media-error','');await images.nth(1).evaluate((image:HTMLImageElement)=>image.src='data:image/webp;base64,AA==');await expect(page.locator('#charcoal-viewer').getByRole('button',{name:'Retry',exact:true})).toBeVisible();await page.screenshot({path:`${shot}/charcoal-composite-error-${info.project.name}.png`});release();
});
test('new missing technical preview keeps its own spinner over the retained previous preview',async({page})=>{
 const held=await hold(page);await page.goto('/en');await open(page,'technology');await expect(page.locator('#technology-viewer .technology-viewer__photo img')).toHaveAttribute('data-preview','ready');
 await page.locator('[data-section-previews]').evaluate(script=>{const data=JSON.parse(script.textContent!);data['/art/technology/slides/noble-02.webp'].src='data:image/webp;base64,AA==';script.textContent=JSON.stringify(data);});await page.waitForTimeout(500);await page.locator('#technology-viewer').getByRole('button',{name:'Next Slide',exact:true}).click();await expect(page.locator('#technology-viewer .media-orbit')).toBeVisible();expect(await page.locator('#technology-viewer .media-orbit').evaluate(e=>getComputedStyle(e).visibility)).toBe('visible');await page.locator('#technology-viewer').getByRole('button',{name:'Close technology viewer'}).click();held.release();
});
test('nested navigation scrolling is not captured by the pending page governor',async({page,browserName},info)=>{
 test.skip(browserName==='webkit'&&!!info.project.use.isMobile,'Native wheel unsupported on mobile WebKit; desktop native input covers this path.');const held=await hold(page);await page.setViewportSize({width:402,height:500});await page.goto('/en');await page.locator('#navigation-toggle').click();const nav=page.locator('.menu nav');await nav.hover();const before=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,300);await page.waitForTimeout(200);await expect(page.locator('.menu')).toHaveAttribute('open','');expect(await page.evaluate(()=>scrollY)).toBe(before);expect(await nav.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);held.release();
});

test('pending preview keeps reversible technology wheel navigation at the photo boundary',async({page,browserName},info)=>{
 test.skip(browserName==='webkit'&&!!info.project.use.isMobile,'Native mobile WebKit wheel unavailable; keyboard/touch covered.');const held=await hold(page);await page.setViewportSize({width:402,height:874});await page.goto('/en');await open(page,'technology');await expect(page.locator('#technology-viewer .technology-viewer__photo img')).toHaveAttribute('data-preview','ready');await page.locator('.technology-viewer__scroll').hover();await page.mouse.wheel(0,80);await expect(page.locator('#technology-viewer')).toHaveAttribute('data-group','HeatCore');await page.waitForTimeout(500);await page.mouse.wheel(0,-80);await expect(page.locator('#technology-viewer')).toHaveAttribute('data-group','NobleCraft');held.release();
});

test('section click before framework hydration is replayed after handlers attach',async({page})=>{
 let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);releases.add(release);await page.route('**/_next/**/*.js',async route=>{await held;try{await route.continue();}catch{}});await page.goto('/en',{waitUntil:'commit'});await page.locator('[data-wellness-open]').first().evaluate((e:HTMLElement)=>e.click());expect(await page.locator('html').getAttribute('data-media-hydrated')).toBeNull();release();await expect(page.locator('#wellness-viewer')).toBeVisible();await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-preview','ready');
});

test('new distant transfers wait while the visible original is active',async({page})=>{
 await page.setViewportSize({width:402,height:874});
 const gates=new Map<string,()=>void>(),started:string[]=[];let unheld=false;
 const releaseAll=()=>{unheld=true;gates.forEach(resolve=>resolve());};releases.add(releaseAll);
 await page.route('**/art/**/*.webp',async route=>{if(route.request().resourceType()==='fetch'){const path=new URL(route.request().url()).pathname;started.push(path);if(!unheld)await new Promise<void>(resolve=>gates.set(path,resolve));}try{await route.continue();}catch{}});
 await page.goto('/en');await expect.poll(()=>started.includes('/art/02.webp')).toBe(true);await open(page,'wellness');const hero='/art/wellness/01-ritual_uno_white_v3.webp';await expect.poll(()=>started.includes(hero)).toBe(true);
 gates.get('/art/01.webp')!();gates.get('/art/02.webp')!();
 await expect(page.locator('img[data-original="/art/01.webp"]')).toHaveAttribute('data-media-ready','');
 await expect(page.locator('img[data-original="/art/02.webp"]')).toHaveAttribute('data-media-ready','');
 await page.waitForTimeout(300);expect(started).not.toContain('/art/03.webp');gates.get(hero)!();await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-media-ready','');
 releaseAll();await expect.poll(()=>started.includes('/art/03.webp')).toBe(true);
});
