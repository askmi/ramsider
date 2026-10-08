import {webkit,chromium} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
const phase=process.env.PHASE??'before',base=process.env.BASE_URL??'http://127.0.0.1:3030';
const out='docs/evidence/technology-viewer/canvas-width',header='docs/evidence/technology-viewer/compact-header';
const css=await readFile(`${header}/candidate.css`,'utf8');
const rows=[];
async function paint(page){await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>[...document.querySelectorAll('.technology-viewer__photo img')].every(i=>i.complete&&i.naturalWidth===941));await page.evaluate(()=>new Promise(resolve=>{let n=0;function frame(){if(++n===10)resolve();else requestAnimationFrame(frame)}requestAnimationFrame(frame)}));}
for(const [engine,width,height,mobile] of [[webkit,402,874,true],[webkit,440,956,true],[chromium,1440,900,false]]){
 const browser=await engine.launch(),page=await browser.newPage({viewport:{width,height},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`${base}/en`);await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));
 const trigger=page.locator('[data-technology-open]').first();await trigger.scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.page-media-overlay')&&!document.querySelector('.page-media-content[inert]'));await trigger.click();
 for(let group=0;group<2;group++){
  await page.locator('.technology-viewer__dots button').nth(group).click();await page.waitForFunction(g=>document.querySelector('#technology-viewer')?.dataset.group===g&&document.querySelector('#technology-viewer')?.getAttribute('aria-busy')==='false',group?'CyberMind':'HeatCore');await paint(page);
  const geometry=await page.evaluate(()=>{const r=s=>{const a=document.querySelector(s).getBoundingClientRect();return{width:a.width,left:a.left,right:a.right,height:a.height}};return{landing:r('.canvas'),viewer:r('#technology-viewer'),photo:r('.technology-viewer__photo img'),stage:r('.technology-viewer__stage'),viewport:innerWidth,dpr:devicePixelRatio}});
  if(phase!=='before'){assert.equal(geometry.viewer.width,geometry.landing.width);assert.equal(geometry.viewer.left,geometry.landing.left);assert.equal(geometry.photo.width,geometry.landing.width);assert(Math.abs(geometry.photo.height-geometry.photo.width*1672/941)<1)}
  await page.screenshot({path:`${out}/${phase}-${width}-${group}.png`});rows.push({width,height,group,geometry,errors});
  if(phase==='after'){
   const style=await page.addStyleTag({content:css});await paint(page);await page.screenshot({path:`${header}/candidate-${width}-${group}.png`});await style.evaluate(el=>el.remove());await paint(page);
  }
 }
 if(phase!=='before'){
 await page.locator('.technology-viewer__close').click();await page.waitForFunction(()=>[...document.querySelectorAll('img[data-media]')].every(i=>i.hasAttribute('data-media-ready')));
 for(const [name,selector]of [['hero','h1'],['technology','#technology-experience'],['faq','#faq']]){await page.locator(selector).first().scrollIntoViewIfNeeded();await paint(page);await page.screenshot({path:`${out}/assembly-${width}-${name}.png`});}
 }
 await browser.close();
}
await writeFile(`${out}/${phase}.json`,JSON.stringify(rows,null,2));
if(phase==='after')for(const w of [402,440]){
 const a=await sharp(`${out}/before-${w}-0.png`).raw().toBuffer(),b=await sharp(`${out}/after-${w}-0.png`).raw().toBuffer();assert(a.equals(b),`mobile pixels changed ${w}`);
 const dpr=3,h=300;await sharp({create:{width:w*2,height:h,channels:3,background:'#fff'}}).composite(await Promise.all([`${out}/after-${w}-0.png`,`${header}/candidate-${w}-0.png`].map(async(path,i)=>({input:await sharp(path).extract({left:0,top:0,width:w*dpr,height:h*dpr}).resize(w,h).png().toBuffer(),left:i*w,top:0})))).png().toFile(`${header}/comparison-${w}.png`);
}
console.log(JSON.stringify(rows));
