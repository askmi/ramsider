import { webkit } from '@playwright/test';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
const lum=rgb=>rgb.map(v=>{const s=v/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const browser=await webkit.launch(),results=[];
const baseURL=process.env.BASE_URL??'http://127.0.0.1:3070';
const evidenceDir=process.env.CHARCOAL_EVIDENCE_DIR??'docs/evidence/charcoal';
const titleLocales=process.env.CHARCOAL_TITLE_LOCALES==='1';
const compact=process.env.CHARCOAL_COMPACT==='1';
const profiles=compact?[['compact',375,812]]:[['pro',402,874],['max',440,956]];
const selectors=['.charcoal-section--1 h2','.charcoal-section--2 h2','.charcoal-section--3 h2','.charcoal-section--4 h2','.charcoal-section--4 p'];
const targets=titleLocales?['en','ru','de','fr','es','it','tr','ar','zh','ja','ko'].map(locale=>({locale,profile:'pro',width:402,height:874,selector:'.charcoal-section--4 h2'})):profiles.flatMap(([profile,width,height])=>selectors.map(selector=>({locale:'en',profile,width,height,selector})));
for(const {locale,profile,width,height,selector}of targets){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 await page.goto(`${baseURL}/${locale}`);await page.locator('#fire-learn').scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.page-media-overlay'));await page.locator('#fire-learn').click();await page.waitForFunction(()=>document.querySelectorAll('.charcoal-art[data-charcoal-ready=true]').length===12);await page.evaluate(()=>document.fonts.ready);
 const element=page.locator(selector);await element.scrollIntoViewIfNeeded();
 const color=await element.evaluate(e=>getComputedStyle(e).color.match(/\d+/g).slice(0,3).map(Number));
 await page.locator('.charcoal-copy h2,.charcoal-copy p').evaluateAll(es=>es.forEach(e=>e.style.visibility='hidden'));
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const background=await sharp(await page.screenshot({scale:'css'})).removeAlpha().raw().toBuffer();
 await page.evaluate(selector=>{
  const hideEdges=document.createElement('style');hideEdges.textContent='.charcoal-viewer::before,.charcoal-viewer::after{display:none}';document.head.append(hideEdges);
  document.querySelectorAll('.charcoal-art-host,.charcoal-viewer__close').forEach(e=>e.style.visibility='hidden');
  document.querySelectorAll('.charcoal-section').forEach(e=>{e.style.backgroundColor='#000';e.style.backgroundImage='none';});
  const target=document.querySelector(selector);target.style.visibility='visible';target.style.color='#fff';target.style.textShadow='none';target.style.borderColor='transparent';
 },selector);
 const mask=await sharp(await page.screenshot({scale:'css'})).removeAlpha().raw().toBuffer();
 let minimum=100,samples=0;const contrasts=[];
 for(let i=0;i<mask.length;i+=3)if(mask[i]>235&&mask[i+1]>235&&mask[i+2]>235){const bg=lum([...background.subarray(i,i+3)]),fg=lum(color),ratio=(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05);minimum=Math.min(minimum,ratio);samples++;contrasts.push(ratio);}
 contrasts.sort((a,b)=>a-b);results.push({locale,profile,selector,color,samples,minimum,p01:contrasts[Math.floor(contrasts.length*.01)]});await page.close();
}
await browser.close();await writeFile(`${evidenceDir}/${titleLocales?'contrast-fourth-locales':compact?'heading-contrast-compact':'contrast-rendered'}.json`,JSON.stringify(results,null,2)+'\n');console.log(results);if(results.some(result=>!result.samples||result.minimum<4.5))throw Error('Actual glyph contrast below4.5 or empty mask');
