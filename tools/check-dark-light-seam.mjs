import {webkit,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const out='screenshots/feed-seams/dark-light';await mkdir(out,{recursive:true});
const browser=await webkit.launch();const results=[];
for(const [name,width,height,device] of [['pro',402,874,'iPhone 17 Pro'],['max',440,956,'iPhone 17 Pro Max']])for(const [mode,heldIndexes] of [['ready',[]],['upper-preview',[12]],['lower-preview',[13]],['both-preview',[12,13]]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:devices[device].userAgent,serviceWorkers:'block',reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let release;const held=new Promise(resolve=>{release=resolve;});
 await page.route('**/art/story-v3-*.webp',async route=>{const index=Number(route.request().url().match(/story-v3-(\d+)/)?.[1]);if(heldIndexes.includes(index))await held;try{await route.continue();}catch{}});
 try{
  await page.goto((process.env.BASE_URL||'http://127.0.0.1:3190')+'/en',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));await page.evaluate(()=>document.fonts.ready);
  const geometry=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,overflow:document.documentElement.scrollWidth>innerWidth}));if(geometry.width!==width||geometry.dpr!==3||geometry.overflow)throw Error(JSON.stringify(geometry));
  let edge;
  for(const y of [26620,28970,29264,30720]){
   await page.evaluate(y=>{const tail=y>=28207,box=document.querySelector(tail?'.tail-art':'.art').getBoundingClientRect();scrollTo({top:box.top+scrollY+(y-(tail?28207:0))*box.width/941-innerHeight/2,behavior:'instant'});},y);await page.waitForFunction(indexes=>[...document.querySelectorAll('.art img[data-media],.tail-art img[data-media]')].filter(i=>{const r=i.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}).every(i=>{const index=Number(i.dataset.original?.match(/story-v3-(\d+)/)?.[1]);return indexes.includes(index)?i.dataset.preview==='ready':i.hasAttribute('data-media-ready');}),heldIndexes,{timeout:30000});await page.waitForTimeout(60);
   const screenshot=await page.screenshot({path:`${out}/${name}-${mode}-${y}.png`});
   if(y===29264){const {data,info}=await sharp(screenshot).removeAlpha().raw().toBuffer({resolveWithObject:true});if(info.width!==width*3)throw Error('Unexpected PNG scale');const means=[];for(let row=height*3/2-45;row<height*3/2+45;row++){let total=0;for(let x=30;x<90;x++)total+=data[(row*info.width+x)*info.channels];means.push(total/60);}edge=Math.max(...means.slice(1).map((v,i)=>Math.abs(v-means[i])));if(heldIndexes.includes(13)&&edge>=15)throw Error(`${name}/${mode}: sharp edge ${edge}`);if(!heldIndexes.includes(13)&&edge<=25)throw Error(`${name}/${mode}: ready source boundary missing ${edge}`);}
  }
  if(errors.length)throw Error(errors.join("; "));
  results.push({name,mode,heldIndexes,geometry,edgeMaxRowStep:edge,errors});console.log(name,mode,'edge',edge.toFixed(2),'errors',errors.length);
 }finally{release();await context.close();}
}
await browser.close();await writeFile(`${out}/browser-results.json`,JSON.stringify(results,null,2)+'\n');
