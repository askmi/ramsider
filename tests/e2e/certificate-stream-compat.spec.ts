import {expect,test} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {certificates} from '../../lib/certificates';

const out='screenshots/certificate-diagnostics';mkdirSync(out,{recursive:true});
// These pages contain only scanned artwork; all other supplied pages have text.
const scannedPages:Record<string,number[]>={electrical:[1],emc:[1],telecom:[2],all:[1,2,10]};
test.setTimeout(120000);
test('all certificates extract text without ReadableStream async iteration',async({page},info)=>{
 await page.addInitScript(()=>{delete (ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator];});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/en');await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));await page.locator('#documents').scrollIntoViewIfNeeded();await expect(page.locator('.page-media-overlay')).toHaveCount(0,{timeout:30000});
 const viewer=page.locator('#certificate-viewer');
 for(const [id,source]of Object.entries(certificates)){
  await page.locator(id==='all'?'#documents-all':`#document-${id}`).click();
  for(let n=1;n<=source.pages;n++){
   await expect(viewer.locator('.certificate-debug')).toContainText(/pdf\.text\.ready\s*$/,{timeout:30000});
   if(n===1)await expect(viewer.locator('.certificate-debug')).toContainText('ReadableStream.asyncIterator=false');
   await expect(viewer.locator('.certificate-debug')).not.toContainText('ERROR');
   await expect(viewer.locator('canvas')).toBeVisible();
   // Scanned pages legitimately return empty text and omit the disclosure.
   if(scannedPages[id]?.includes(n))await expect(viewer.locator('.certificate-text')).toHaveCount(0);
   else expect((await viewer.locator('.certificate-text p').textContent())?.trim()).not.toBe('');
   if(n===1&&id==='electrical')await page.screenshot({path:`${out}/${info.project.name}-stream-ready.png`});
   if(n<source.pages){await viewer.getByRole('button',{name:'Next Page',exact:true}).click();await expect(viewer.locator('output')).toHaveText(`Page ${n+1} / ${source.pages}`);}
  }
  await page.keyboard.press('Escape');
 }
 expect(errors).toEqual([]);
});

test('customer viewport preserves readable PDF and debug after compatibility fix',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','One customer geometry check');
 await page.setViewportSize({width:390,height:650});
 await page.addInitScript(()=>{delete (ReadableStream.prototype as unknown as Record<symbol, unknown>)[Symbol.asyncIterator];});
 await page.goto('/en');await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));await page.locator('#document-electrical').scrollIntoViewIfNeeded();await expect(page.locator('.page-media-overlay')).toHaveCount(0,{timeout:30000});await page.locator('#document-electrical').click();
 const viewer=page.locator('#certificate-viewer');await expect(viewer.locator('.certificate-debug')).toContainText('pdf.text.ready',{timeout:30000});await expect(viewer.locator('canvas')).toBeVisible();
 expect(await viewer.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await page.screenshot({path:`${out}/customer-stream-ready.png`});
});
