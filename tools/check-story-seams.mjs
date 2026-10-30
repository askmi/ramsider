import {webkit,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
const plan=JSON.parse(readFileSync('docs/evidence/loading-flow/feed-seam-map.json','utf8'));
const base=process.env.BASE_URL||'http://127.0.0.1:3190';
const out='screenshots/feed-seams/browser';await mkdir(out,{recursive:true});
const results=[];const browser=await webkit.launch();
for(const [name,width,height,device] of [['pro',402,874,'iPhone 17 Pro'],['max',440,956,'iPhone 17 Pro Max']]){
 for(const mode of ['ready','even-error','odd-error','all-error']){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:devices[device].userAgent,serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/art/story-v2-*.webp',route=>{
   const match=route.request().url().match(/story-v2-(\d+)\.webp/);const index=Number(match?.[1]);
   return index>0 && (mode==='all-error'||(mode==='even-error'&&index%2===0)||(mode==='odd-error'&&index%2===1)) ? route.abort() : route.continue();
  });
  await page.goto(base+'/en',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'),null,{timeout:30000});
  await page.waitForFunction(()=>[...document.querySelectorAll('.art img[data-media],.tail-art img[data-media]')].every(i=>i.hasAttribute('data-media-ready')||i.hasAttribute('data-media-error')),null,{timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  // Diagnostic captures reveal the seam underneath the real error UI; the UI remains unchanged in production.
  if (process.env.CLEAR_OVERLAY) await page.addStyleTag({content:'.page-media-overlay{visibility:hidden!important}'});
  const geometry=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,doc:document.documentElement.scrollWidth,meta:document.querySelector('meta[name=viewport]')?.getAttribute('content')}));
  if(geometry.width!==width||geometry.dpr!==3||geometry.doc>width)throw Error(JSON.stringify(geometry));
  for(const seam of plan.cut_review){
   const y=seam.y;const tail=y>=28207;
   await page.evaluate(({y,tail})=>{const root=document.querySelector(tail?'.tail-art':'.art');const pos=root.getBoundingClientRect().top+scrollY+(y-(tail?28207:0))*root.getBoundingClientRect().width/941;scrollTo({top:pos-innerHeight/2,behavior:'instant'});},{y,tail});
   await page.waitForTimeout(60);
   await page.screenshot({path:`${out}/${name}-${mode}-${y}${process.env.CLEAR_OVERLAY ? "-clear" : ""}.png`});
  }
  const states=await page.locator('.art img[data-media],.tail-art img[data-media]').evaluateAll(imgs=>imgs.map(i=>({src:i.dataset.original,ready:i.hasAttribute('data-media-ready'),error:i.hasAttribute('data-media-error'),preview:i.dataset.preview})));
  results.push({name,mode,geometry,states,errors});console.log(name,mode,'seams',plan.cut_review.length,'errors',errors.length);
  await context.close();
 }
}
await browser.close();await writeFile(`${out}/results${process.env.CLEAR_OVERLAY ? "-clear" : ""}.json`,JSON.stringify(results,null,2));
