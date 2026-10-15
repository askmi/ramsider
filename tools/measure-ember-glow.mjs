import sharp from 'sharp';
import { readFile,writeFile } from 'node:fs/promises';
const dir='screenshots/ember/glow-correction';
const evidence=JSON.parse(await readFile('docs/evidence/ember/glow-after.json','utf8'));
const results=[];
for(const r of evidence.results){
 const scale=r.width/941;
 const areas={coal:{x:367,y:2685,w:284,h:326},lowerRight:{x:520,y:2805,w:130,h:205},top:{x:385,y:2676,w:230,h:92}};
 const metrics=[];
 for(const time of r.times){
  const source=await sharp(`${dir}/after-${r.name}-static.png`).removeAlpha().raw().toBuffer();
  const before=await sharp(`${dir}/before-${r.name}-${time}.png`).removeAlpha().raw().toBuffer();
  const after=await sharp(`${dir}/after-${r.name}-${time}.png`).removeAlpha().raw().toBuffer();
  const entry={time,areas:{}};
  for(const [key,a] of Object.entries(areas)){
   const box={left:Math.ceil(a.x*scale),top:Math.ceil(a.y*scale-r.scrollY),width:Math.floor(a.w*scale),height:Math.floor(a.h*scale)};
   let totalBefore=0,totalAfter=0,maxAfter=0,changedBefore=0,changedAfter=0,channels=0;
   const errors=[];
   for(let y=box.top;y<box.top+box.height;y++)for(let x=box.left;x<box.left+box.width;x++)for(let c=0;c<3;c++){
    const i=(y*r.width+x)*3+c,b=Math.abs(before[i]-source[i]),d=Math.abs(after[i]-source[i]);
    totalBefore+=b;totalAfter+=d;maxAfter=Math.max(maxAfter,d);channels++;if(b>3)changedBefore++;if(d>3)changedAfter++;errors.push(d);
   }
   errors.sort((a,b)=>a-b);
   entry.areas[key]={beforeMAE:totalBefore/channels,afterMAE:totalAfter/channels,p99After:errors[Math.floor(errors.length*.99)],maxAfter,changedBeforePercent:changedBefore/channels*100,changedAfterPercent:changedAfter/channels*100};
   if(time===13.7&&key==='coal'){
    const images=await Promise.all([`before-${r.name}-${time}`,`after-${r.name}-static`,`after-${r.name}-${time}`].map(f=>sharp(`${dir}/${f}.png`).extract(box).resize(box.width*3,box.height*3,{kernel:'nearest'}).png().toBuffer()));
    await sharp({create:{width:box.width*9,height:box.height*3,channels:3,background:'#eee'}}).composite(images.map((input,i)=>({input,left:i*box.width*3,top:0}))).png().toFile(`${dir}/comparison-${r.name}.png`);
   }
  }
  let outsideChanges=0;
  for(let y=0;y<r.height;y++)for(let x=0;x<r.width;x++){
   if(x>=Math.floor(r.box.x)-1&&x<=Math.ceil(r.box.x+r.box.width)+1&&y>=Math.floor(r.box.y)-1&&y<=Math.ceil(r.box.y+r.box.height)+1)continue;
   for(let c=0;c<3;c++){const i=(y*r.width+x)*3+c;if(before[i]!==after[i])outsideChanges++;}
  }
  entry.outsideCanvasChangedChannels=outsideChanges;metrics.push(entry);
 }
 results.push({name:r.name,comparisonOrder:'before | original static | corrected',metrics});
}
await writeFile('docs/evidence/ember/glow-comparison.json',JSON.stringify({results},null,2)+'\n');
console.log(JSON.stringify(results.map(r=>({name:r.name,lowerRight:r.metrics.map(m=>({time:m.time,...m.areas.lowerRight})),outside:r.metrics.map(m=>m.outsideCanvasChangedChannels)})),null,2));
