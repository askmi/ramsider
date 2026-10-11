import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// PNG is a delivery requirement. No resizing, profile assignment or codec substitution.
const items=[];
for(const [kind,folder,numbers,refs,templateNumber,right] of [
 ['mood','tech_06',[30,31],[29,32],30,640],
 ['aqua','tech_07',[33,36],[34,35],36,600],
]){
 const template=await sharp(`design/references/${folder}/${templateNumber}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(const [n,number] of numbers.entries()){
  const source=`design/references/${folder}/${number}.png`,output=`public/art/technology/slides/${kind}-0${n+1}.png`;
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width,height,channels}=info,clean=Buffer.from(data),mask=Buffer.alloc(width*height);
  // Derive only actual title glyphs from the light-background template;
  // the Mood second source's dark hose must never define the mask.
  for(let y=20;y<174;y++)for(let x=45;x<right;x++){
   const i=(y*template.info.width+x)*4,[r,g,b]=template.data.subarray(i,i+3);
   if((y<134&&Math.max(r,g,b)<65)||(y>=140&&x<224&&r-g>25&&g-b>12&&g<145))
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)mask[(y+dy)*width+x+dx]=255;
  }
  for(let y=18;y<176;y++)for(let x=43;x<right+2;x++)if(mask[y*width+x]){
   let top=y-1,bottom=y+1;
   while(top>0&&mask[top*width+x])top--;while(bottom<height-1&&mask[bottom*width+x])bottom++;
   let left=x-1,rightX=x+1;
   while(left>0&&mask[y*width+left])left--;while(rightX<width-1&&mask[y*width+rightX])rightX++;
   const t=(y-top)/(bottom-top),h=(x-left)/(rightX-left),i=(y*width+x)*channels;
   const glassColumn=kind==='aqua'&&n===0&&x<210;
   const horizontalWeight=glassColumn?0:kind==='mood'?(y>=140||x>=525?1:0):(bottom-top)/((bottom-top)+(rightX-left));
   for(let c=0;c<3;c++){
    const vertical=data[(top*width+x)*channels+c]*(1-t)+data[(bottom*width+x)*channels+c]*t;
    const horizontal=data[(y*width+left)*channels+c]*(1-h)+data[(y*width+rightX)*channels+c]*h;
    clean[i+c]=Math.round(vertical*(1-horizontalWeight)+horizontal*horizontalWeight);
   }
  }
  // Relax the glyph-only region against untouched neighbouring pixels. This
  // removes rectangular interpolation seams on arches and refracted water.
  const samples=Float32Array.from(clean),pixels=[];
  for(let y=18;y<176;y++)for(let x=43;x<right+2;x++)if(mask[y*width+x]&&(kind==='aqua'||y>=134)&&!(kind==='aqua'&&n===0&&x<210))pixels.push((y*width+x)*4);
  for(let pass=0;pass<350;pass++)for(const i of pixels)for(let c=0;c<3;c++)
   samples[i+c]=(samples[i-4+c]+samples[i+4+c]+samples[i-width*4+c]+samples[i+width*4+c])/4;
  for(const i of pixels)for(let c=0;c<3;c++)clean[i+c]=Math.round(samples[i+c]);
  let outsideChanged=0,alphaExact=true;
  for(let i=0;i<data.length;i++){if(data[i]!==clean[i]&&!mask[Math.floor(i/channels)])outsideChanged++;if(i%4===3&&data[i]!==clean[i])alphaExact=false}
  await sharp(clean,{raw:{width,height,channels}}).png({compressionLevel:9,adaptiveFiltering:true}).toFile(output);
  if(outsideChanged||!alphaExact||!(await sharp(output).ensureAlpha().raw().toBuffer()).equals(clean))throw Error('Native PNG preservation failed');
  const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
  await sharp(output).extract({left:25,top:0,width:640,height:195}).png().toFile(`/tmp/${kind}-prepared-title-${n+1}.png`);
  items.push({source,reference:`design/references/${folder}/${refs[n]}.png`,output,width,height,channels,icc:'absent; native untagged interpretation retained; intended profile UNKNOWN',template:`${folder}/${templateNumber}.png`,maskedPixels:mask.reduce((s,v)=>s+(v?1:0),0),outsideChanged,alphaExact,decodedExact:true,sourceSha256:await hash(source),sha256:await hash(output),bytes:(await readFile(output)).length});
 }
}
await writeFile('docs/evidence/technology-discrete/mood-aqua-assets.json',JSON.stringify(items,null,2)+'\n');console.log(items.map(({output,width,bytes,outsideChanged})=>({output,width,bytes,outsideChanged})));
