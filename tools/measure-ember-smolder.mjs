import sharp from 'sharp';
import { readFile,writeFile } from 'node:fs/promises';
const dir='screenshots/ember/visible-smolder';
const result=[];
for(const phase of ['before','after']){
 const evidence=JSON.parse(await readFile(`docs/evidence/ember/smolder-${phase}.json`,'utf8'));
 for(const r of evidence.results){
  const scale=r.width/941;
  const region={left:Math.ceil(520*scale),top:Math.ceil(2805*scale-r.scrollY),width:Math.floor(130*scale),height:Math.floor(205*scale)};
  const frames=await Promise.all(r.times.map(time=>sharp(`${dir}/${phase}-${r.name}-${time}.png`).extract(region).removeAlpha().raw().toBuffer()));
  const ranges=[];
  for(let i=0;i<frames[0].length;i+=3){
   const light=frames.map(f=>.2126*f[i]+.7152*f[i+1]+.0722*f[i+2]);
   ranges.push(Math.max(...light)-Math.min(...light));
  }
  ranges.sort((a,b)=>a-b);
  const changed=ranges.filter(v=>v>12).length;
  result.push({phase,name:r.name,cssRegion:region,pixels:ranges.length,pixelsWithLuminanceRangeAbove12:changed,p99LuminanceRange:ranges[Math.floor(ranges.length*.99)],coalOnlyMotionPass:changed>40});
  const coal={left:Math.ceil(367*scale),top:Math.ceil(2685*scale-r.scrollY),width:Math.floor(284*scale),height:Math.floor(326*scale)};
  const original=await sharp(`${dir}/${phase}-${r.name}-static.png`).extract(coal).removeAlpha().raw().toBuffer();
  let largestPositiveLight=0,brightPixelsAbove20=0;
  for(const time of r.times){
   const actual=await sharp(`${dir}/${phase}-${r.name}-${time}.png`).extract(coal).removeAlpha().raw().toBuffer();
   for(let i=0;i<actual.length;i+=3){
    const delta=.2126*(actual[i]-original[i])+.7152*(actual[i+1]-original[i+1])+.0722*(actual[i+2]-original[i+2]);
    largestPositiveLight=Math.max(largestPositiveLight,delta);
    if(delta>20)brightPixelsAbove20++;
   }
  }
  Object.assign(result.at(-1),{largestPositiveLuminanceVsStatic:largestPositiveLight,brightPixelsAbove20AcrossSamples:brightPixelsAbove20});
  const images=await Promise.all(r.times.map(time=>sharp(`${dir}/${phase}-${r.name}-${time}.png`).extract(coal).png().toBuffer()));
  const staticImage=await sharp(`${dir}/${phase}-${r.name}-static.png`).extract(coal).png().toBuffer();
  const all=[staticImage,...images];
  await sharp({create:{width:coal.width*all.length,height:coal.height,channels:3,background:'#eee'}}).composite(all.map((input,i)=>({input,left:i*coal.width,top:0}))).png().toFile(`${dir}/${phase}-${r.name}-sequence.png`);
 }
}
await writeFile('docs/evidence/ember/smolder-comparison.json',JSON.stringify({method:'Actual CSS-scale right face only, no smoke; per-pixel luminance range across six shader phases. First sequence tile static source.',result},null,2)+'\n');
console.log(JSON.stringify(result,null,2));
