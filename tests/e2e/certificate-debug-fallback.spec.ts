import {expect,test,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {CERTIFICATE_DEBUG_REVISION} from '../../lib/certificate-debug';
const out='screenshots/certificate-diagnostics';mkdirSync(out,{recursive:true});
test.setTimeout(120000);
async function open(page:Page){await page.goto('/en');await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));await page.locator('#document-electrical').scrollIntoViewIfNeeded();await expect(page.locator('.page-media-overlay')).toHaveCount(0,{timeout:30000});await page.locator('#document-electrical').click();}
async function errorDetails(page:Page,reason:string){const viewer=page.locator('#certificate-viewer');await expect(viewer.locator('.certificate-debug')).toBeVisible();await expect(viewer.locator('.certificate-debug strong')).toContainText(CERTIFICATE_DEBUG_REVISION);await expect(viewer.locator('.certificate-error-debug')).toBeVisible();await expect(viewer.locator('.certificate-error-debug')).toContainText(CERTIFICATE_DEBUG_REVISION);await expect(viewer.locator('.certificate-error-debug')).toContainText(reason);const retry=viewer.getByRole('button',{name:'Retry',exact:true});await expect(retry).toBeVisible();const button=await retry.boundingBox(),details=await viewer.locator('.certificate-error-debug').boundingBox();expect(details!.y).toBeGreaterThanOrEqual(button!.y+button!.height);await expect(viewer.locator('.certificate-original')).toBeVisible();await expect(viewer.getByRole('button',{name:'Close',exact:true})).toBeVisible();}

test('diagnostic initialization failure still shows DEBUG and actual HTTP reason by Retry',async({page},info)=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get(){throw new Error('controlled device probe unavailable');}});});
 let fail=true;await page.route('**/certificates/electrical-safety.pdf',r=>fail?r.fulfill({status:503,body:'unavailable'}):r.continue());
 await open(page);await errorDetails(page,'pdf.fetch: Error: HTTP 503');await expect(page.locator('.certificate-debug')).toContainText('ERROR debug.initialize: Error: controlled device probe unavailable');
 await page.screenshot({path:`${out}/${info.project.name}-fallback-http.png`});
 fail=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('.certificate-document')).toHaveAttribute('aria-busy','false',{timeout:30000});await expect(page.locator('.certificate-debug')).toContainText(CERTIFICATE_DEBUG_REVISION);await expect(page.locator('#certificate-viewer canvas')).toBeVisible();await page.keyboard.press('Escape');
});

test('page render runtime failures always retain DEBUG and colocated reason',async({page},info)=>{
 test.skip(info.project.name==='desktop-chromium','Both required mobile profiles cover fault rendering');
 for(const mode of ['page','render','runtime']){
  let injected=false,fail=true;
  await page.route('**/_next/static/chunks/*.js',async route=>{
   const response=await route.fetch();let body=await response.text();
   if(fail&&body.includes('PDF render exceeded 30000 ms')){
    const pattern=mode==='page'?/await [\w$]+\.getPage\([\w$]+\)/:mode==='render'?/[\w$]+\.render\(\{canvas:/:/function(?: [\w$]+)?\(\{source:[^}]+\}\)\{/;
    if(pattern.test(body)){injected=true;body=body.replace(pattern,match=>mode==='page'?'await Promise.reject(new Error("controlled page failure"))':mode==='render'?'(()=>{throw new Error("controlled render failure")})({canvas:':match+'throw new Error("controlled runtime failure");');}
   }
   await route.fulfill({response,body});
  });
  await open(page);await expect.poll(()=>injected).toBe(true);await errorDetails(page,`controlled ${mode} failure`);await page.screenshot({path:`${out}/${info.project.name}-${mode}-debug.png`});
  fail=false;
  if(mode==='runtime')await page.getByRole('button',{name:'Retry',exact:true}).click();
  else{await page.keyboard.press('Escape');await open(page);}
  await expect(page.locator('.certificate-document')).toHaveAttribute('aria-busy','false',{timeout:30000});await expect(page.locator('#certificate-viewer canvas')).toBeVisible();await page.keyboard.press('Escape');await page.unroute('**/_next/static/chunks/*.js');
 }
});

test('throwing diagnostic timing observer cannot prevent HTTP or timeout Retry',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','One optional-observer failure matrix');
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const original=performance.getEntriesByType.bind(performance);performance.getEntriesByType=(kind)=>{if(kind==='resource')throw new Error('controlled diagnostic observer failure');return original(kind);};performance.getEntriesByName=()=>{throw new Error('controlled diagnostic lookup failure');};});
 let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);let mode='http';
 await page.route('**/certificates/electrical-safety.pdf',async route=>{if(mode==='http')await route.fulfill({status:503,body:'unavailable'});else if(mode==='ok')await route.continue();else{await held;await route.continue().catch(()=>{});}});
 await open(page);await errorDetails(page,'HTTP 503');mode='ok';await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.locator('.certificate-document')).toHaveAttribute('aria-busy','false',{timeout:30000});await expect(page.locator('#certificate-viewer canvas')).toBeVisible();await expect(page.locator('.certificate-debug')).toContainText('debug.resourceTiming.unavailable');await page.keyboard.press('Escape');
 mode='timeout';await page.clock.install();await open(page);await expect(page.locator('.certificate-debug')).toContainText('Waiting: pdf.fetch');await page.clock.fastForward(31000);await errorDetails(page,'pdf.fetch.timeout');release();await page.keyboard.press('Escape');expect(errors).toEqual([]);
});

test('renderer import and render deadlines show DEBUG beside Retry',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','One deterministic clock/deadline matrix');
 let injected=false;
 await page.route('**/_next/static/chunks/*.js',async route=>{const response=await route.fetch();let body=await response.text();const pattern=/[\w$]+\.render\(\{canvas:/;if(body.includes('PDF render exceeded 30000 ms')&&pattern.test(body)){injected=true;body=body.replace(pattern,'(()=>({promise:new Promise(()=>{}),cancel(){}}))({canvas:');}await route.fulfill({response,body});});
 await page.clock.install();await open(page);await expect(page.locator('.certificate-debug')).toContainText('Waiting: pdf.render',{timeout:30000});expect(injected).toBe(true);await page.clock.fastForward(31000);await errorDetails(page,'pdf.render.timeout');await page.keyboard.press('Escape');await page.unroute('**/_next/static/chunks/*.js');
 let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);
 await page.route('**/_next/static/chunks/*.js',async route=>{const response=await route.fetch();if((await response.text()).includes('PDF render exceeded 30000 ms')){await held;}await route.fulfill({response}).catch(()=>{});});
 await open(page);await expect(page.locator('.certificate-debug')).toContainText('Waiting: renderer.import');await page.clock.fastForward(31000);await errorDetails(page,'renderer.import.timeout');await page.screenshot({path:`${out}/import-deadline-debug.png`});release();await page.keyboard.press('Escape');
});

test('short error viewport keeps DEBUG above the error card and Retry reachable',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','One short/landscape adaptation matrix');
 await page.route('**/certificates/electrical-safety.pdf',r=>r.fulfill({status:503,body:'unavailable'}));
 for(const size of [{width:320,height:320},{width:402,height:360},{width:844,height:390}]){
  await page.setViewportSize(size);await open(page);await errorDetails(page,'HTTP 503');
  const panel=await page.locator('.certificate-debug').boundingBox(),card=await page.locator('#certificate-viewer .media-loading').boundingBox();
  expect(card!.y).toBeGreaterThanOrEqual(panel!.y+panel!.height-1);
  await page.getByRole('button',{name:'Retry',exact:true}).click();await errorDetails(page,'HTTP 503');
  await page.screenshot({path:`${out}/error-short-${size.width}-${size.height}.png`});await page.keyboard.press('Escape');
 }
});
