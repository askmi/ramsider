import { webkit } from '@playwright/test';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { readFile, writeFile } from 'node:fs/promises';
const browser=await webkit.launch();
const results=[];
for(const [name,width,height]of [['pro',402,874],['max',440,956]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const page=await context.newPage();page.setDefaultTimeout(120000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3070/en');await page.evaluate(()=>document.fonts.ready);
 await page.locator('#fire-learn').scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.page-media-overlay'));
 await page.screenshot({path:`screenshots/charcoal/${name}-landing.png`,scale:'css'});
 await page.locator('#fire-learn').click();await page.waitForFunction(()=>document.querySelectorAll('.charcoal-art[data-media-ready]').length===8);
 await page.evaluate(()=>document.fonts.ready);
 const comparisons=[];
 const blocks=await page.locator('.charcoal-section').evaluateAll(es=>es.map(e=>({top:e.offsetTop,height:e.getBoundingClientRect().height})));
 for(let i=0;i<4;i++){
  await page.locator('.charcoal-viewer__scroll').evaluate((e,top)=>e.scrollTop=top,blocks[i].top);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const capture=await page.screenshot({path:`screenshots/charcoal/${name}-block-${i+1}.png`,scale:'css'});
  const rect=await page.locator(`.charcoal-section--${i+1} .charcoal-art-host`).evaluate(e=>e.getBoundingClientRect().toJSON());
  const copyTop=await page.locator(`.charcoal-section--${i+1} h2`).evaluate(e=>e.getBoundingClientRect().top);
  const reference=await context.newPage();
  const originalTile=await sharp('design/references/charcoal-original.png').extract({left:0,top:[0,2250,4500,6400][i],width:1080,height:[2250,2250,1900,2150][i]}).png().toBuffer();
  await reference.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#efe4d3}img{position:absolute;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:auto}</style><img src="data:image/png;base64,${originalTile.toString('base64')}">`);
  await reference.locator('img').evaluate(e=>e.decode());
  await reference.screenshot({path:`screenshots/charcoal/${name}-reference-${i+1}.png`,scale:'css'});
  // New portrait is an authorized change; use final prepared PNG for its paint proof.
  if(i===0){await reference.locator('img').evaluate((e,src)=>{e.src=src},`data:image/png;base64,${(await readFile('screenshots/charcoal/clean-1.png')).toString('base64')}`);await reference.locator('img').evaluate(e=>e.decode());}
  const expected=await reference.screenshot({scale:'css'});
  const roi={left:0,top:Math.ceil(Math.max(80,rect.top)),width,height:Math.floor(Math.min(height,copyTop-15))-Math.ceil(Math.max(80,rect.top))};
  const a=await sharp(capture).extract(roi).ensureAlpha().raw().toBuffer(),b=await sharp(expected).extract(roi).ensureAlpha().raw().toBuffer(),diff=Buffer.alloc(a.length);
  const count=pixelmatch(a,b,diff,roi.width,roi.height,{threshold:.12});
  await sharp(diff,{raw:{width:roi.width,height:roi.height,channels:4}}).png().toFile(`screenshots/charcoal/${name}-art-diff-${i+1}.png`);
  comparisons.push({block:i+1,roi,differentPixels:count,percent:count/(roi.width*roi.height)*100,reference:i===0?'prepared portrait artwork':'unaltered original source illustration'});
  await reference.close();
 }
 for(let i=1;i<4;i++){await page.locator('.charcoal-viewer__scroll').evaluate((e,y)=>e.scrollTop=y,blocks[i].top-150);await page.screenshot({path:`screenshots/charcoal/${name}-join-${i}.png`,scale:'css'});}
 await page.locator('.charcoal-viewer__scroll').evaluate(e=>e.scrollTop=e.scrollHeight);
 await page.screenshot({path:`screenshots/charcoal/${name}-bottom.png`,scale:'css'});
 const geometry=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,dialog:document.querySelector('#charcoal-viewer').getBoundingClientRect().toJSON(),scrollHeight:document.querySelector('.charcoal-viewer__scroll').scrollHeight,blocks:[...document.querySelectorAll('.charcoal-section')].map(e=>({box:e.getBoundingClientRect().toJSON(),text:[...e.querySelectorAll('h2,p')].map(t=>({text:t.textContent,box:t.getBoundingClientRect().toJSON(),font:getComputedStyle(t).fontSize,fontFamily:getComputedStyle(t).fontFamily})),image:e.querySelector('.charcoal-art-host').getBoundingClientRect().toJSON(),naturalWidth:e.querySelector('img').naturalWidth,naturalHeight:[...e.querySelectorAll('img')].reduce((sum,img)=>sum+img.naturalHeight,0),tiles:[...e.querySelectorAll('img')].map(img=>({width:img.naturalWidth,height:img.naturalHeight,rect:img.getBoundingClientRect().toJSON()}))}))}));
 results.push({name,errors,geometry,blocks,comparisons});await context.close();
}
await browser.close();await writeFile('docs/evidence/charcoal/visual-final.json',JSON.stringify(results,null,2)+'\n');console.log(results.map(r=>({name:r.name,width:r.geometry.width,blocks:r.blocks,comparisons:r.comparisons,errors:r.errors})));
