import {webkit,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const base=process.env.BASE_URL||'http://127.0.0.1:3190',out=process.env.OUT_DIR||'screenshots/additional-ribbons/partial';await mkdir(out,{recursive:true});
const cuts=[1800,1650,1400,1600],modes=['ready','upper-preview','lower-preview','both-preview'];const browser=await webkit.launch();const rows=[];
const profiles=process.env.PROFILES==='wide'?[['tablet',768,1024],['desktop',1440,900]]:[['pro',402,874],['max',440,956]];
await Promise.all(profiles.map(async([name,width,height])=>{
 for(const kind of (process.env.SEAMS==='section'?['section']:['internal','section']))for(let index=0;index<(kind==='internal'?4:3);index++)for(const mode of modes){
  const upper=`/art/charcoal/v2-${index+1}-${kind==='internal'?0:1}.webp`,lower=`/art/charcoal/v2-${kind==='internal'?index+1:index+2}-${kind==='internal'?1:0}.webp`;
  const heldPaths=[...(mode.includes('upper')||mode==='both-preview'?[upper]:[]),...(mode.includes('lower')||mode==='both-preview'?[lower]:[])];
  let release;const held=new Promise(r=>release=r);const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:width>500?1:3,isMobile:width<=500,hasTouch:width<=500,userAgent:devices['iPhone 17 Pro'].userAgent,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/art/charcoal/*.webp',async route=>{if(heldPaths.includes(new URL(route.request().url()).pathname))await held;try{await route.continue();}catch{}});
  try{
   await page.goto(base+'/en',{waitUntil:'domcontentloaded'});await page.locator('[data-charcoal-open]').first().evaluate(e=>e.click());await page.locator('#charcoal-viewer').waitFor({state:'visible'});await page.evaluate(()=>document.fonts.ready);
   const scroll=page.locator('.charcoal-viewer__scroll');const target=await page.locator(`.charcoal-section--${kind==='internal'?index+1:index+2}`).evaluate((e,o)=>({y:e.offsetTop+(o.kind==='internal'?o.cut*e.getBoundingClientRect().width/1080:0),width:e.getBoundingClientRect().width}),{kind,cut:cuts[index]});
   if(!(target.width>0&&Number.isFinite(target.y)))throw Error('Missing visible seam geometry');
   await scroll.evaluate((e,y)=>e.scrollTop=Math.max(0,y-250),target.y);
   await page.waitForFunction(held=>[...document.querySelectorAll('#charcoal-viewer img[data-media]')].filter(i=>{const b=i.getBoundingClientRect();return b.bottom>0&&b.top<innerHeight;}).every(i=>held.includes(i.dataset.original)?i.dataset.preview==='ready':i.hasAttribute('data-media-ready')),heldPaths,{timeout:30000});await page.waitForTimeout(100);
   const actual=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,overflow:document.querySelector('#charcoal-viewer').scrollWidth>innerWidth}));if(actual.width!==width||actual.dpr!==(width>500?1:3)||actual.overflow)throw Error(JSON.stringify(actual));
   const y=target.y-await scroll.evaluate(e=>e.scrollTop);const file=`${out}/${name}-${kind}-${index}-${mode}.png`;const png=await page.screenshot({path:file});const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});const dpr=actual.dpr;const left=await page.locator('.charcoal-ribbon').evaluate(e=>e.getBoundingClientRect().left);if(info.width!==width*dpr)throw Error('PNG scale');
   const means=[];for(let row=Math.round(y*dpr)-4*dpr;row<Math.round(y*dpr)+4*dpr;row++){let sum=0,count=0;for(let x=Math.round((left+10)*dpr);x<Math.round((left+18)*dpr);x++){for(let c=0;c<3;c++){sum+=data[(row*info.width+x)*info.channels+c];count++;}}means.push(sum/count);}
   const step=Math.max(...means.slice(1).map((v,i)=>Math.abs(v-means[i])));if(!Number.isFinite(step)||step>12)throw Error(`Sharp background line ${name}/${kind}/${index}/${mode}: ${step}`);if(errors.length)throw Error(errors.join(';'));
   let wholeWidthStep=null;if(kind==='section'){const full=[];for(let row=Math.round(y*dpr)-4*dpr;row<Math.round(y*dpr)+4*dpr;row++){let sum=0,count=0;for(let x=Math.round((left+10)*dpr);x<Math.round((left+target.width-10)*dpr);x++){for(let c=0;c<3;c++){sum+=data[(row*info.width+x)*info.channels+c];count++;}}full.push(sum/count);}wholeWidthStep=Math.max(...full.slice(1).map((v,i)=>Math.abs(v-full[i])));if(!Number.isFinite(wholeWidthStep)||(mode!=='ready'&&wholeWidthStep>3.5))throw Error(`Section fringe ${name}/${index}/${mode}: ${wholeWidthStep}`);}
   rows.push({name,kind,index,mode,heldPaths,target,actual,maxRowStep:step,wholeWidthStep,file,errors});console.log(name,kind,index,mode,step.toFixed(3));
  }finally{release();await context.close();}
 }
}));await browser.close();await writeFile(`${out}/results.json`,JSON.stringify(rows,null,2)+'\n');console.log('PASS',rows.length);
