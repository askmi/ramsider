import {expect,test,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {certificates} from '../../lib/certificates';
import {locales} from '../../lib/i18n';

const evidence='screenshots/certificates';
mkdirSync(evidence,{recursive:true});
test.setTimeout(120000);
async function landing(page:Page,locale='en') {
 await page.goto(`/${locale}`);
 await page.locator('#documents').scrollIntoViewIfNeeded();
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.page-media-overlay')).toHaveCount(0,{timeout:30000});
 await page.waitForFunction(()=>[...document.querySelectorAll<HTMLImageElement>('.doc-thumb')].every(image=>image.complete&&image.naturalWidth));
}
const viewer=(page:Page)=>page.locator('#certificate-viewer');
async function ready(page:Page) {await expect(viewer(page).locator('.certificate-document')).toHaveAttribute('aria-busy','false',{timeout:30000});await expect(viewer(page).locator('canvas')).toBeVisible();}
const trigger=(id:string)=>id==='all'?'#documents-all':`#document-${id}`;

test('six exact destinations defer all PDF code and render complete documents',async({page},info)=>{
 const requests:string[]=[];const errors:string[]=[];const scripts:Promise<void>[]=[];let engineFetched=false;
 page.on('response',response=>{if(response.request().resourceType()==='script')scripts.push(response.text().then(body=>{if(body.includes('pdf.worker.min.mjs'))engineFetched=true;}).catch(()=>{}));});
 page.on('request',request=>requests.push(new URL(request.url()).pathname));page.on('pageerror',error=>errors.push(error.message));
 await landing(page);
 expect(await page.evaluate(()=>innerWidth)).toBe(info.project.use.viewport!.width);
 expect(await page.evaluate(()=>devicePixelRatio)).toBe(info.project.use.deviceScaleFactor??1);
 expect(await page.locator('meta[name=viewport]').getAttribute('content')).toContain('width=device-width');
 await page.locator('#document-electrical').focus();await page.locator('#document-electrical').hover();
 await page.waitForTimeout(500);
 await Promise.all(scripts);expect(engineFetched).toBe(false);
 expect(requests.filter(path=>path.startsWith('/certificates/')||path.startsWith('/pdfjs/'))).toEqual([]);
 await page.locator('#document-electrical').evaluate(e=>(e as HTMLElement).blur());
 await page.screenshot({path:`${evidence}/${info.project.name}-landing.png`});
 for(const [id,source] of Object.entries(certificates)) {
  await expect(page.locator(trigger(id))).toHaveAttribute('href',source.href);
  let release!:()=>void;const hold=new Promise<void>(resolve=>{release=resolve;});
  await page.route(`**${source.href}`,async route=>{await hold;await route.continue().catch(()=>{});});
  try {
   await page.locator(trigger(id)).click();await expect(viewer(page)).toBeVisible();
   await expect(viewer(page).locator('.media-loading')).toBeVisible();await expect(viewer(page).locator('.media-loading__spinner')).toBeVisible();
   if(id==='electrical')await page.screenshot({path:`${evidence}/${info.project.name}-loading.png`});
   release();await ready(page);
   await expect(viewer(page).locator('output')).toHaveText(`Page 1 / ${source.pages}`);
   await expect(viewer(page).locator('.certificate-original')).toHaveAttribute('href',source.href);
   const geometry=await viewer(page).locator('canvas').evaluate((element)=>{const canvas=element as HTMLCanvasElement;return ({width:canvas.getBoundingClientRect().width,frame:canvas.parentElement!.clientWidth,height:canvas.getBoundingClientRect().height,pixels:canvas.width*canvas.height,ink:(()=>{const d=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;let ink=0;for(let i=0;i<d.length;i+=64)if(d[i]<200)ink++;return ink;})()});});
   expect(geometry.width).toBeCloseTo(geometry.frame,0);expect(geometry.ink).toBeGreaterThan(1000);
   if(id==='electrical')expect(geometry.height).toBeGreaterThan(geometry.width);
   await page.screenshot({path:`${evidence}/${info.project.name}-${id}-ready.png`});
   for(let n=2;n<=source.pages;n++){await viewer(page).getByRole('button',{name:'Next Page',exact:true}).click();await ready(page);await expect(viewer(page).locator('output')).toHaveText(`Page ${n} / ${source.pages}`);}
   if(source.pages>1){await page.screenshot({path:`${evidence}/${info.project.name}-${id}-last.png`});await expect(viewer(page).getByRole('button',{name:'Next Page',exact:true})).toBeDisabled();await viewer(page).getByRole('button',{name:'Previous Page',exact:true}).click();await ready(page);}
   await viewer(page).getByRole('button',{name:'Zoom:',exact:false}).click();await ready(page);expect(await viewer(page).locator('canvas').evaluate(e=>e.getBoundingClientRect().width/e.parentElement!.clientWidth)).toBeCloseTo(1.5,1);
   await viewer(page).getByRole('button',{name:'Rotate Page',exact:true}).click();await ready(page);
   await page.keyboard.press('Escape');await expect(viewer(page)).not.toBeVisible();await expect(page.locator(trigger(id))).toBeFocused();
  }finally{release();await page.unroute(`**${source.href}`);}
 }
 expect(errors).toEqual([]);
});

test('failure retry cancellation rapid reopen and keyboard containment',async({page},info)=>{
 await landing(page);let fail=true;
 await page.route('**/certificates/rohs.pdf',async route=>fail?route.fulfill({status:503,body:'unavailable'}):route.continue());
 await page.locator('#document-rohs').click();await expect(viewer(page).getByText('The document could not load.',{exact:true})).toBeVisible();
 await page.screenshot({path:`${evidence}/${info.project.name}-error.png`});
 fail=false;await viewer(page).getByRole('button',{name:'Retry',exact:true}).click();await ready(page);
 for(let n=0;n<12;n++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('#certificate-viewer'))).toBe(true);}
 await page.keyboard.press('Escape');
 for(let n=0;n<4;n++){await page.locator('#document-rohs').click();await expect(viewer(page)).toBeVisible();await viewer(page).getByRole('button',{name:'Close',exact:true}).click();await expect(viewer(page)).not.toBeVisible();}
 let release!:()=>void;const hold=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/certificates/emc.pdf',async route=>{await hold;await route.continue().catch(()=>{});});
 await page.locator('#document-emc').click();await expect(viewer(page).locator('.media-loading')).toBeVisible();await viewer(page).getByRole('button',{name:'Close',exact:true}).click();
 await page.locator('#document-uae').click();release();await ready(page);await expect(viewer(page).locator('#certificate-title')).toHaveText('UAE Conformity');await expect(viewer(page).locator('output')).toHaveText('Page 1 / 3');
 await page.keyboard.press('Escape');
});

test('all locales and responsive viewport controls stay accessible',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','One full locale/adaptation matrix; six-doc rendering runs on every profile.');
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const language of locales){
  await landing(page,language);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#document-rohs').click();await ready(page);
  expect(await viewer(page).locator('button,a').evaluateAll(elements=>elements.every(element=>element.getBoundingClientRect().height>=44))).toBe(true);
  expect(await viewer(page).evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  if(language==='ar'){await expect(viewer(page)).toHaveAttribute('dir','rtl');await page.screenshot({path:`${evidence}/ar-pro-ready.png`});}
  await page.keyboard.press('Escape');
 }
 for(const size of [{width:375,height:812},{width:402,height:560},{width:768,height:1024},{width:1440,height:900}]){
  await page.setViewportSize(size);await landing(page);await page.locator('#document-rohs').click();await ready(page);
  expect(await viewer(page).evaluate(e=>e.getBoundingClientRect().width)).toBeCloseTo(Math.min(size.width,941),0);
  expect(await viewer(page).locator('.certificate-scroll').evaluate(e=>e.clientHeight)).toBeGreaterThan(100);
  await viewer(page).locator('.certificate-scroll').evaluate(e=>e.scrollTo(0,e.scrollHeight));
  await page.screenshot({path:`${evidence}/adapt-${size.width}-${size.height}.png`});
  await page.keyboard.press('Escape');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('deferred renderer failure and PDF deadline can recover',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','One controlled fault-injection matrix.');
 await page.emulateMedia({reducedMotion:'reduce'});
 let fail=true;
 await page.route('**/_next/static/chunks/*.js',async route=>{const response=await route.fetch();if(fail&&(await response.text()).includes('pdf.worker.min.mjs'))await route.abort('failed');else await route.fulfill({response});});
 await landing(page);await page.locator('#document-emc').click();
 await expect(viewer(page).getByText('The document could not load.',{exact:true})).toBeVisible();
 await expect(viewer(page).locator('.certificate-debug')).toContainText('renderer.import.');
 fail=false;await viewer(page).getByRole('button',{name:'Retry',exact:true}).click();await ready(page);await page.keyboard.press('Escape');
 let release!:()=>void;const hold=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/certificates/rohs.pdf',async route=>{await hold;await route.continue().catch(()=>{});});
 await page.clock.install();await page.locator('#document-rohs').click();await expect(viewer(page).locator('.media-loading')).toBeVisible();
 expect(await viewer(page).locator('.media-loading__spinner').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 await page.clock.fastForward(31000);await expect(viewer(page).getByText('The document could not load.',{exact:true})).toBeVisible();
 await expect(viewer(page).locator('.certificate-debug')).toContainText('pdf.fetch.timeout');
 release();await page.unroute('**/certificates/rohs.pdf');await viewer(page).getByRole('button',{name:'Retry',exact:true}).click();await ready(page);await page.keyboard.press('Escape');
});

test('six original PDF links remain usable without JavaScript',async({browser},info)=>{
 test.skip(info.project.name!=='desktop-chromium','One native fallback check.');
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();const requested:string[]=[];page.on('request',r=>requested.push(r.url()));
 await page.goto(`${test.info().project.use.baseURL??process.env.BASE_URL??'http://127.0.0.1:3000'}/en`);
 for(const [id,source]of Object.entries(certificates)){
  await expect(page.locator(trigger(id))).toHaveAttribute('href',source.href);
  const response=await context.request.get(new URL(source.href,page.url()).href);expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('application/pdf');expect((await response.body()).subarray(0,5).toString()).toBe('%PDF-');
 }
 expect(requested.filter(url=>url.includes('/certificates/'))).toEqual([]);
 await context.close();
});


test('worker initialization recovery and repeated keyboard navigation',async({page},info)=>{
 test.skip(!['iphone-17-pro-webkit','desktop-chromium'].includes(info.project.name),'Two distinct engines for controlled worker and focus regression.');
 let fail=true;
 await page.route('**/pdfjs/pdf.worker.min.mjs',async route=>fail?route.abort('failed'):route.continue());
 await landing(page);await page.locator('#document-uae').click();await expect(viewer(page).getByText('The document could not load.',{exact:true})).toBeVisible({timeout:30000});
 await expect(viewer(page).locator('.certificate-debug')).toContainText('pdf.open/worker');
 fail=false;await viewer(page).getByRole('button',{name:'Retry',exact:true}).click();await ready(page);
 const next=viewer(page).getByRole('button',{name:'Next Page',exact:true});await next.focus();
 for(let n=2;n<=3;n++){await page.keyboard.press('Enter');await ready(page);await expect(next).toBeFocused();await expect(viewer(page).locator('output')).toHaveText(`Page ${n} / 3`);}
 const zoom=viewer(page).getByRole('button',{name:'Zoom:',exact:false});await zoom.focus();await page.keyboard.press('Enter');await ready(page);await expect(zoom).toBeFocused();
 const rotate=viewer(page).getByRole('button',{name:'Rotate Page',exact:true});await rotate.focus();await page.keyboard.press('Enter');await ready(page);await expect(rotate).toBeFocused();await page.keyboard.press('Escape');
});
