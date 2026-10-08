import {webkit} from '@playwright/test';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import{writeFile,readFile}from'node:fs/promises';
const out='docs/evidence/technology-viewer/ribbons';
const browser=await webkit.launch();const results=[];
for(const width of [402,440]){
 const height=width===402?874:956;const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${process.env.BASE_URL ?? 'http://127.0.0.1:3030'}/en`);await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));
 const trigger=page.locator('[data-technology-open]').first();await trigger.scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.page-media-overlay')&&!document.querySelector('.page-media-content[inert]'));await trigger.click();
 const comparisons=[];const planes=[];const joins=[];
 for(let g=0;g<2;g++){
  if(g)await page.locator('.technology-viewer__dots button').last().click();await page.waitForFunction(()=>document.querySelector('#technology-viewer')?.getAttribute('aria-busy')==='false');await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`${out}/ready-${width}-${g}.png`});
  const articles=page.locator('.technology-viewer__content');const count=await articles.count();
  for(let i=0;i<count;i++){
   const path=`${out}/plane-${width}-${g}-${i}.png`;await articles.nth(i).screenshot({path});planes.push(path);
   if(width===402){
    const baseline=await sharp(await readFile(`${out}/baseline-${g}-${i}.png`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});const actual=await sharp(await readFile(path)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    if(baseline.info.width!==actual.info.width||Math.abs(baseline.info.height-actual.info.height)>3)throw Error('Source plane size mismatch beyond CSS edge rounding');
    const w=actual.info.width,h=Math.min(actual.info.height,baseline.info.height);const diff=Buffer.alloc(w*h*4);const actualBytes=actual.data.subarray(0,w*h*4),baselineBytes=baseline.data.subarray(0,w*h*4);
    // Ignore changed title, removed numbers, and intentionally blended empty edges.
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const sx=x/w*941,sy=y/h*1672;
     if(sy<300||sy>=1624||(g===0&&i===0&&sx>=52&&sx<96&&((sy>=698&&sy<738)||(sy>=827&&sy<867)||(sy>=967&&sy<1007))))baseline.data.copy(actual.data,(y*w+x)*4,(y*w+x)*4,(y*w+x)*4+4);
    }
    const changed=pixelmatch(baselineBytes,actualBytes,diff,w,h,{threshold:.15});await sharp(diff,{raw:{width:w,height:h,channels:4}}).png().toFile(`${out}/diff-body-${g}-${i}.png`);comparisons.push({group:g,index:i,changed,total:w*h,percent:changed/(w*h)*100});
   }
  }
  const geometry=await page.evaluate(()=>[...document.querySelectorAll('.technology-viewer__content')].map(el=>({src:el.dataset.photo,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,offset:el.offsetTop})));
  for(let i=1;i<count;i++){
   const join=geometry[i].offset;await page.locator('.technology-viewer__scroll').evaluate((el,top)=>el.scrollTop=top,Math.max(0,join-230));await page.screenshot({path:`${out}/join-${width}-${g}-${i}.png`});joins.push({group:g,index:i,...geometry[i]});
  }
  await page.locator('.technology-viewer__scroll').evaluate(el=>el.scrollTop=el.scrollHeight);await page.screenshot({path:`${out}/bottom-${width}-${g}.png`});
 }
 const thumbs=await Promise.all(planes.map(async path=>({input:await sharp(path).resize({width:201}).png().toBuffer(),left:planes.indexOf(path)*201,top:0})));
 await sharp({create:{width:1206,height:358,channels:3,background:'#fff'}}).composite(thumbs).png().toFile(`${out}/contact-${width}.png`);
 await page.locator('.technology-viewer__close').click();
 await page.waitForFunction(()=>[...document.querySelectorAll('img[data-media]')].every(image=>image.hasAttribute('data-media-ready')));
 await page.evaluate(()=>document.fonts.ready);
 const assembly=[];
 for(const [name,selector] of [['hero','h1'],['technology','#technology-experience'],['documents','#documents'],['faq','#faq']]){
  const section=page.locator(selector).first();await section.scrollIntoViewIfNeeded();
  await page.evaluate(()=>new Promise(resolve=>{let frames=0;const paint=()=>++frames===10?resolve():requestAnimationFrame(paint);requestAnimationFrame(paint);}));
  await page.screenshot({path:`${out}/assembly-${width}-${name}.png`});
  assembly.push({name,selector,scrollY:await page.evaluate(()=>scrollY)});
 }
 await trigger.scrollIntoViewIfNeeded();await trigger.click();await page.waitForFunction(()=>document.querySelector('#technology-viewer')?.getAttribute('aria-busy')==='false');
 await page.screenshot({path:`${out}/preview-${width}.png`});
 results.push({width,height,dpr:await page.evaluate(()=>devicePixelRatio),innerWidth:await page.evaluate(()=>innerWidth),errors,comparisons,joins,assembly});await page.close();
}
await writeFile(`${out}/visual.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(x=>({width:x.width,errors:x.errors,comparisons:x.comparisons}))));await browser.close();
