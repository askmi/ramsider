import sharp from 'sharp';
import { readFile,writeFile } from 'node:fs/promises';
const dir='screenshots/ember/three-faces';
const regions={top:{x:195,y:338,w:115,h:35,min:5},left:{x:145,y:437,w:69,h:115,min:12},junction:{x:230,y:378,w:55,h:72,min:5},right:{x:330,y:400,w:45,h:55,min:5}};
const result=[];
for(const phase of ['before','after']){
 const evidence=JSON.parse(await readFile(`docs/evidence/ember/faces-${phase}.json`,'utf8'));
 for(const r of evidence.results){
  const scale=r.width/941,frames=await Promise.all(r.times.map(t=>sharp(`${dir}/${phase}-${r.name}-${t}.png`).removeAlpha().raw().toBuffer()));
  const original=await sharp(`${dir}/${phase}-${r.name}-static.png`).removeAlpha().raw().toBuffer();
  const areas={};
  for(const [name,a] of Object.entries(regions)){
   const box={left:Math.ceil(r.box.x+a.x*scale),top:Math.ceil(r.box.y+a.y*scale),width:Math.floor(a.w*scale),height:Math.floor(a.h*scale)};
   let visible=0,warm=0;const ranges=[];
   for(let y=box.top;y<box.top+box.height;y++)for(let x=box.left;x<box.left+box.width;x++){
    const i=(y*r.width+x)*3;
    const light=frames.map(f=>.2126*f[i]+.7152*f[i+1]+.0722*f[i+2]);
    const range=Math.max(...light)-Math.min(...light);ranges.push(range);if(range>12)visible++;
    if(frames.some(f=>f[i]-original[i]>20&&.2126*(f[i]-original[i])+.7152*(f[i+1]-original[i+1])+.0722*(f[i+2]-original[i+2])>10))warm++;
   }
   ranges.sort((a,b)=>a-b);
   areas[name]={box,visiblePixels:visible,warmGlintPixels:warm,p99LuminanceRange:ranges[Math.floor(ranges.length*.99)],minimum:a.min,pass:visible>=a.min&&warm>=a.min};
  }
  const coal={left:Math.ceil(367*scale),top:Math.ceil(2685*scale-r.scrollY),width:Math.floor(284*scale),height:Math.floor(326*scale)};
  const all=await Promise.all(['static',...r.times].map(t=>sharp(`${dir}/${phase}-${r.name}-${t}.png`).extract(coal).png().toBuffer()));
  await sharp({create:{width:coal.width*all.length,height:coal.height,channels:3,background:'#eee'}}).composite(all.map((input,i)=>({input,left:i*coal.width,top:0}))).png().toFile(`${dir}/${phase}-${r.name}-sequence.png`);
  result.push({phase,name:r.name,areas});
 }
}
await writeFile('docs/evidence/ember/faces-comparison.json',JSON.stringify({method:'Actual CSS per-face temporal luminance and positive warm glints vs static photo; smoke outside all regions',result},null,2)+'\n');
console.log(JSON.stringify(result.map(r=>({phase:r.phase,name:r.name,areas:Object.fromEntries(Object.entries(r.areas).map(([k,v])=>[k,{visible:v.visiblePixels,warm:v.warmGlintPixels,pass:v.pass}]))})),null,2));
