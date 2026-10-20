import {expect,test,type Page} from '@playwright/test';
import {mkdirSync,readFileSync} from 'node:fs';
import {certificates} from '../../lib/certificates';
import {locales} from '../../lib/i18n';

const evidence='screenshots/certificates-direct';
mkdirSync(evidence,{recursive:true});
const trigger=(id:string)=>id==='all'?'#documents-all':`#document-${id}`;
async function landing(page:Page,locale='en') {
 await page.goto(`/${locale}`);
 await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));
 await page.locator('#documents').scrollIntoViewIfNeeded();
 await page.evaluate(()=>document.fonts.ready);
 await expect(page.locator('.page-media-overlay')).toHaveCount(0,{timeout:30000});
 await page.waitForFunction(()=>[...document.querySelectorAll<HTMLImageElement>('.doc-thumb')].every(i=>i.complete&&i.naturalWidth));
}

test('six delivered PDF files match approved derivatives and remain viewable PDFs',async({request})=>{
 for(const source of Object.values(certificates)) {
  const response=await request.get(source.href);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect(response.headers()['content-disposition']??'').not.toContain('attachment');
  const bytes=await response.body();expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  expect(bytes.equals(readFileSync(`public${source.href}`))).toBe(true);
 }
 expect((await request.get('/pdfjs/pdf.worker.min.mjs')).status()).toBe(404);
});

test('native PDF navigation replaces interception and defers file requests',async({page,context},info)=>{
 const requests:string[]=[];const errors:string[]=[];
 page.on('request',r=>requests.push(new URL(r.url()).pathname));page.on('pageerror',e=>errors.push(e.message));
 await landing(page);
 expect(await page.evaluate(()=>innerWidth)).toBe(info.project.use.viewport!.width);
 expect(await page.evaluate(()=>devicePixelRatio)).toBe(info.project.use.deviceScaleFactor??1);
 await expect(page.locator('meta[name=viewport]')).toHaveAttribute('content',/width=device-width/);
 await page.locator('#document-electrical').focus();await page.locator('#document-electrical').hover();
 await page.waitForTimeout(300);
 expect(requests.filter(p=>p.startsWith('/certificates/')||p.startsWith('/pdfjs/'))).toEqual([]);
 // Headless WebKit has no OS PDF UI. Observe a genuine document navigation,
 // then abort its transport; the separate HTTP test verifies the real PDF body.
 await context.route('**/certificates/*.pdf',route=>route.abort());
 for(const [id,source]of Object.entries(certificates)){
  const link=page.locator(trigger(id));await expect(link).toHaveAttribute('href',source.href);
  await expect(link).toHaveAttribute('target','_blank');await expect(link).toHaveAttribute('rel','noopener noreferrer');
  expect(await link.getAttribute('aria-haspopup')).toBeNull();expect(await link.getAttribute('aria-controls')).toBeNull();
  const navigation=context.waitForEvent('request',r=>new URL(r.url()).pathname===source.href);
  await link.click();expect((await navigation).isNavigationRequest()).toBe(true);
  await expect(page).toHaveURL(/\/en$/);await expect(page.locator('dialog[open]')).toHaveCount(0);
  for(const popup of context.pages())if(popup!==page)await popup.close();
 }
 const link=page.locator('#document-electrical');await link.focus();
 const navigation=context.waitForEvent('request',r=>r.url().endsWith(certificates.electrical.href));
 await page.keyboard.press('Enter');expect((await navigation).isNavigationRequest()).toBe(true);
 for(const popup of context.pages())if(popup!==page)await popup.close();
 if(!info.project.use.isMobile){
  const modified=context.waitForEvent('request',r=>r.url().endsWith(certificates.electrical.href));
  await link.click({button:'middle'});expect((await modified).isNavigationRequest()).toBe(true);
 }
 await expect(page.locator('#certificate-viewer,.certificate-debug,.certificate-document')).toHaveCount(0);
 expect(errors).toEqual([]);
});

test('unchanged certificate composition and assembled page',async({page},info)=>{
 await landing(page);const width=info.project.use.viewport!.width;
 if(width<=440){
  await expect.poll(async()=>{
   await expect(page.locator('.page-media-overlay')).toHaveCount(0);
   await page.evaluate(w=>scrollTo({top:22960*w/941,behavior:'instant'}),width);
   await page.waitForTimeout(150);
   return page.evaluate(w=>Math.abs(scrollY-22960*w/941),width);
  }).toBeLessThan(1);
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await page.screenshot({path:`${evidence}/after-${width}.png`});
 }
 for(const [name,fraction]of [['top',0],['middle',.5],['bottom',1]]as const){
  await page.evaluate(f=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*f,behavior:'instant'}),fraction);
  await expect(page.locator('.page-media-overlay')).toHaveCount(0,{timeout:30000});
  await page.screenshot({path:`${evidence}/${info.project.name}-${name}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('all locales and responsive native links including Arabic RTL',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','Locale matrix once on baseline WebKit');
 test.setTimeout(120000);
 for(const locale of locales){
  await landing(page,locale);await expect(page.locator('.doc-card a')).toHaveCount(6);
  for(const [id,source]of Object.entries(certificates))await expect(page.locator(trigger(id))).toHaveAttribute('href',source.href);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 for(const width of [320,375,402,440,768,1440]){
  await page.setViewportSize({width,height:956});await landing(page,'ar');
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  for(const link of await page.locator('.doc-card a').all()){
   const bounds=await link.boundingBox();expect(bounds!.width).toBeGreaterThanOrEqual(44);expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`${evidence}/ar-${width}.png`});
 }
});

test('PDF links navigate with JavaScript disabled',async({browser,baseURL})=>{
 const context=await browser.newContext({javaScriptEnabled:false,baseURL});const page=await context.newPage();
 try {
  await page.goto('/en');
  await context.route('**/certificates/*.pdf',route=>route.abort());
  for(const [id,source]of Object.entries(certificates)){
   const request=context.waitForEvent('request',r=>r.url().endsWith(source.href));await page.locator(trigger(id)).click();
   expect((await request).isNavigationRequest()).toBe(true);
   for(const popup of context.pages())if(popup!==page)await popup.close();
  }
  await expect(page.locator('#certificate-viewer')).toHaveCount(0);
 } finally {await context.close();}
});
