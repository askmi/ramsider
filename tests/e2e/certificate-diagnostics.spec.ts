import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {locales} from '../../lib/i18n';
import {CERTIFICATE_DEBUG_REVISION} from '../../lib/certificate-debug';
const out='screenshots/certificate-diagnostics';mkdirSync(out,{recursive:true});
test.setTimeout(120000);
async function open(page:import('@playwright/test').Page,locale='en') {await page.goto('/'+locale);await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));await page.locator('#document-electrical').scrollIntoViewIfNeeded();await expect(page.locator('.page-media-overlay')).toHaveCount(0,{timeout:30000});await page.locator('#document-electrical').click();}
test('debug always shows factual PDF size/speed/device and captures HTTP/parse failure with fresh Retry',async({page},info)=>{
 let mode='http';
 await page.route('**/certificates/electrical-safety.pdf',async route=>mode==='http'?route.fulfill({status:503,body:'unavailable'}):mode==='corrupt'?route.fulfill({contentType:'application/pdf',body:'invalid PDF bytes'}):route.continue());
 await open(page);const debug=page.locator('.certificate-debug'),viewer=page.locator('#certificate-viewer');
 await expect(debug).toContainText('ERROR pdf.fetch: Error: HTTP 503');await expect(debug).toContainText('CPU threads:');await expect(debug).toContainText('VPN: unavailable');await expect(debug).toContainText('HTTP 503');
 await expect(debug).toContainText(CERTIFICATE_DEBUG_REVISION);await expect(viewer.locator('.certificate-error-debug')).toContainText('HTTP 503');
 await expect(viewer.getByRole('button',{name:'Close',exact:true})).toBeVisible();await page.screenshot({path:`${out}/${info.project.name}-http.png`});
 mode='corrupt';await viewer.getByRole('button',{name:'Retry',exact:true}).click();await expect(debug).toContainText('InvalidPDFException');expect(await debug.innerText()).not.toContain('HTTP 503');await expect(debug).toContainText('17 B');
 await expect(viewer.locator('.certificate-error-debug')).toContainText('InvalidPDFException');
 mode='ok';await viewer.getByRole('button',{name:'Retry',exact:true}).click();await expect(viewer.locator('.certificate-document')).toHaveAttribute('aria-busy','false',{timeout:30000});await expect(debug).toBeVisible();await expect(debug).toContainText('140,057 B');await expect(debug).toContainText('Render:');await expect(debug).toContainText(/Mbps delivery|internet speed unavailable/);expect(await debug.innerText()).not.toContain('InvalidPDFException');expect(await debug.innerText()).not.toContain('ERROR');
 expect(await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio}))).toEqual({width:info.project.use.viewport!.width,dpr:info.project.use.deviceScaleFactor??1});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`${out}/${info.project.name}-ready.png`});
 await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();
});
test('debug error remains usable in all locales/RTL and compact widths',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','One adaptation matrix');
 await page.route('**/certificates/electrical-safety.pdf',r=>r.fulfill({status:403,body:'blocked'}));
 for(const locale of locales){await open(page,locale);const debug=page.locator('.certificate-debug');await expect(debug).toContainText('HTTP 403');await expect(debug.locator('strong')).toContainText('DEBUG');await page.locator('#certificate-viewer button').first().click();}
 for(const width of [320,402,768,1440]){await page.setViewportSize({width,height:560});await open(page,'ar');await expect(page.locator('#certificate-viewer')).toHaveAttribute('dir','rtl');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const panel=page.locator('.certificate-debug');expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.screenshot({path:`${out}/ar-${width}.png`});await page.locator('#certificate-viewer button').first().click();}
});

test('slow pending PDF displays current phase and live elapsed time before a timeout',async({page},info)=>{
 test.skip(info.project.name==='desktop-chromium','Both mobile profiles cover live waiting state');let release!:()=>void;const hold=new Promise<void>(resolve=>release=resolve);
 await page.route('**/certificates/electrical-safety.pdf',async route=>{await hold;await route.continue().catch(()=>{});});await page.clock.install();await open(page);const debug=page.locator('.certificate-debug');await expect(debug).toContainText('Waiting: pdf.fetch');await page.clock.fastForward(6000);await expect(debug).toContainText(/phase [6-9]\.\d s/);await page.screenshot({path:`${out}/${info.project.name}-waiting.png`});release();await expect(page.locator('.certificate-document')).toHaveAttribute('aria-busy','false',{timeout:30000});await expect(debug).toContainText('140,057 B');await expect(debug).not.toContainText('Waiting:');await page.keyboard.press('Escape');
});
