import {webkit} from '@playwright/test';
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';

// Compare unchanged body pixels against the actual PNG masters, excluding the
// previously authorized live-title mask (entire mask is above source row 176).
const browser=await webkit.launch(),results=[];
try {
 for(const width of [402,440]){
  const page=await browser.newPage({viewport:{width,height:width===402?874:956},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  for(const [n,source] of [23,26,27].entries()){
   const paths=[`design/references/tech_05/${source}.png`,`public/art/technology/slides/touch-0${n+1}.png`],shots=[];
   for(const path of paths){
    const png=await sharp(await readFile(path)).extract({left:0,top:195,width:941,height:1327}).png().toBuffer();
    await page.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}img{display:block;width:100%;height:auto}</style><img src="data:image/png;base64,${png.toString('base64')}">`);
    await page.locator('img').evaluate(i=>i.decode());shots.push(await page.screenshot());
   }
   const a=await sharp(shots[0]).ensureAlpha().raw().toBuffer(),b=await sharp(shots[1]).ensureAlpha().raw().toBuffer();let changed=0,max=0;
   for(let i=0;i<a.length;i++){if(a[i]!==b[i])changed++;max=Math.max(max,Math.abs(a[i]-b[i]))}
   results.push({width,dpr:3,slide:n+1,source:paths[0],output:paths[1],comparison:'browser-painted source PNG body vs delivered PNG body, rows195..1522; title-mask and entire RGBA roundtrip checked separately by generator',changedChannels:changed,maxChannelError:max});
   if(changed)throw Error('Browser color changed');
  }
  await page.close();
 }
} finally {await browser.close()}
await writeFile('docs/evidence/technology-discrete/touchlink-browser-color.json',JSON.stringify(results,null,2)+'\n');console.log(results.map(r=>({width:r.width,slide:r.slide,changed:r.changedChannels})));
