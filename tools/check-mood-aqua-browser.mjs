import {webkit} from '@playwright/test';
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const assets=JSON.parse(await readFile('docs/evidence/technology-discrete/mood-aqua-assets.json')),http=[],paint=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const a of assets){
 const original=await readFile(a.source),png=await readFile(a.output),url=`http://127.0.0.1:3057/${a.output.replace('public/','')}`,r=await fetch(url),body=Buffer.from(await r.arrayBuffer());
 if(sha(original)!==a.sourceSha256||sha(png)!==a.sha256||sha(body)!==a.sha256||r.status!==200||r.headers.get('content-type')!=='image/png'||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('PNG delivery changed');
 http.push({source:a.source,output:a.output,status:r.status,mime:r.headers.get('content-type'),sourceHashUnchanged:true,httpHashExact:true,width:a.width,height:a.height});
}
const browser=await webkit.launch();
try{
 for(const width of [402,440]){
  const page=await browser.newPage({viewport:{width,height:width===402?874:956},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  for(const a of assets){
   const shots=[];
   for(const path of [a.source,a.output]){
    // All title reconstruction lies above row176; body is untouched artwork.
    const png=await sharp(path).extract({left:0,top:195,width:a.width,height:1327}).png().toBuffer();
    await page.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}img{display:block;width:100%;height:auto}</style><img src="data:image/png;base64,${png.toString('base64')}">`);await page.locator('img').evaluate(i=>i.decode());shots.push(await page.screenshot());
   }
   const x=await sharp(shots[0]).ensureAlpha().raw().toBuffer(),y=await sharp(shots[1]).ensureAlpha().raw().toBuffer();let changed=0;for(let i=0;i<x.length;i++)if(x[i]!==y[i])changed++;
   if(changed)throw Error('Native browser painted source body changed');paint.push({width,dpr:3,output:a.output,sourceWidth:a.width,comparison:'unchanged source body rows195..1522 vs deliveredPNG',changedChannels:changed});
  }
  await page.close();
 }
}finally{await browser.close()}
await writeFile('docs/evidence/technology-discrete/mood-aqua-browser-color.json',JSON.stringify({http,paint},null,2)+'\n');console.log({http:http.length,paint:paint.length,changedChannels:0});
