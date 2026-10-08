import {webkit} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='docs/evidence/technology-viewer/compact-header',css=await readFile(`${out}/candidate.css`,'utf8');
const browser=await webkit.launch(),rows=[];
for(const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']){
 const page=await browser.newPage({viewport:{width:402,height:874},deviceScaleFactor:3,isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${process.env.BASE_URL??'http://127.0.0.1:3031'}/${locale}`);await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));if(process.env.LIVE_HEADER!=='1')await page.addStyleTag({content:css});const trigger=page.locator('[data-technology-open]').first();await trigger.scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.page-media-overlay')&&!document.querySelector('.page-media-content[inert]'));await trigger.click();
 for(const width of (locale==='en'?[402,440,320,375,844,768,1440]:[402,320])){
  await page.setViewportSize({width,height:width===440?956:width===844?390:874});
  for(let group=0;group<2;group++){
   await page.locator('.technology-viewer__dots button').nth(group).click();await page.waitForFunction(g=>document.querySelector('#technology-viewer')?.dataset.group===g&&document.querySelector('#technology-viewer')?.getAttribute('aria-busy')==='false',group?'CyberMind':'HeatCore');await page.evaluate(()=>document.fonts.ready);
   const g=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};const d=document.querySelector('#technology-viewer'),nav=d.querySelector('.technology-viewer__next-image');return{dialog:rect(d),stage:rect(d.querySelector('.technology-viewer__stage')),hits:[...d.querySelectorAll('.technology-viewer__next-image,.technology-viewer__dots button,.technology-viewer__close')].map(rect),label:rect(nav.querySelector('span')),text:nav.textContent,font:getComputedStyle(nav).fontSize}});
   assert.equal(g.stage.y,64);for(const h of g.hits){assert(h.width>=44&&h.height>=44);assert(h.x>=g.dialog.x&&h.right<=g.dialog.right+.01);assert(h.bottom<=64)}
   assert(g.label.height<=44&&g.label.y>=10&&g.label.bottom<=54,`${locale}/${width} label clips: ${JSON.stringify(g)}`);
   for(let i=0;i<g.hits.length;i++)for(let j=i+1;j<g.hits.length;j++){const a=g.hits[i],b=g.hits[j];assert(!(a.x<b.right&&b.x<a.right&&a.y<b.bottom&&b.y<a.bottom),'targets overlap')}
   rows.push({locale,width,group,...g});
   if(locale==='ar'&&width===402){await page.evaluate(()=>new Promise(r=>{let n=0;const f=()=>++n===10?r():requestAnimationFrame(f);requestAnimationFrame(f)}));await page.screenshot({path:`${out}/${process.env.LIVE_HEADER==='1'?'approved-arabic':'arabic'}-${group}.png`})}
  }
 }
 await page.setViewportSize({width:402,height:874});await page.locator('.technology-viewer__next-image').click();await page.waitForFunction(()=>document.querySelector('#technology-viewer').dataset.group==='HeatCore');await page.keyboard.press('End');assert(await page.locator('.technology-viewer__scroll').evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop))<1);await page.keyboard.press('Home');
 for(let i=0;i<6;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.querySelector('#technology-viewer').contains(document.activeElement)))}
 for(let i=0;i<6;i++){await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>document.querySelector('#technology-viewer').contains(document.activeElement)))}
 await page.locator('.technology-viewer__close').click();assert(await trigger.evaluate(e=>e===document.activeElement));assert.equal(errors.length,0);await page.close();
}
await writeFile(`${out}/${process.env.LIVE_HEADER==='1'?'approved-checks':'checks'}.json`,JSON.stringify(rows,null,2));console.log(`${rows.length} label/geometry cases PASS, 11 locale navigation/keyboard/Close cycles PASS`);await browser.close();
