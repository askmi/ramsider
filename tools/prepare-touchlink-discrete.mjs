import sharp from 'sharp';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const items=[];
await mkdir('public/art/technology/slides',{recursive:true});
for(const [n,sourceNumber] of [23,26,27].entries()){
 const source=`design/references/tech_05/${sourceNumber}.png`,output=`public/art/technology/slides/touch-0${n+1}.png`;
 const {data,info}=await sharp(source).raw().toBuffer({resolveWithObject:true});
 const {width,height,channels}=info,clean=Buffer.from(data),mask=Buffer.alloc(width*height);
 {
  for(let y=20;y<174;y++)for(let x=45;x<535;x++){
   const i=(y*width+x)*channels,[r,g,b]=data.subarray(i,i+3);
   if((y<134&&Math.max(r,g,b)<65)||(y>=140&&x<224&&r-g>25&&g-b>12&&g<145))
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)mask[(y+dy)*width+x+dx]=255;
  }
  for(let y=18;y<176;y++)for(let x=43;x<537;x++)if(mask[y*width+x]){
   let top=y-1,bottom=y+1;while(top>0&&mask[top*width+x])top--;while(bottom<height-1&&mask[bottom*width+x])bottom++;
   const t=(y-top)/(bottom-top),i=(y*width+x)*channels;
   for(let c=0;c<3;c++)clean[i+c]=Math.round(data[(top*width+x)*channels+c]*(1-t)+data[(bottom*width+x)*channels+c]*t);
  }
 }
 let outsideChanged=0,alphaExact=true;
 for(let i=0;i<data.length;i++){if(data[i]!==clean[i]&&!mask[Math.floor(i/channels)])outsideChanged++;if(i%channels===3&&data[i]!==clean[i])alphaExact=false}
 await sharp(clean,{raw:{width,height,channels}}).png({compressionLevel:9,adaptiveFiltering:true}).toFile(output);
 if(!(await sharp(output).ensureAlpha().raw().toBuffer()).equals(clean)||outsideChanged||!alphaExact)throw Error('Native RGBA preservation failed');
 await sharp(output).extract({left:25,top:0,width:540,height:195}).png().toFile(`/tmp/touchlink-clean-title-${n+1}.png`);
 const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
 items.push({source,reference:`design/references/tech_05/${[24,25,28][n]}.png`,output,width,height,channels,icc:'absent; native untagged RGBA retained; intended profile UNKNOWN',maskedPixels:mask.reduce((a,v)=>a+(v?1:0),0),outsideChanged,alphaExact,decodedExact:true,bytes:(await readFile(output)).length,sourceSha256:await hash(source),sha256:await hash(output),decision:'Original PNG format required by user; native RGBA retained outside authorized live-title glyph mask, alpha exact; no resizing or color conversion'});
}
await writeFile('docs/evidence/technology-discrete/touchlink-assets.json',JSON.stringify(items,null,2)+'\n');console.log(items.map(i=>({source:i.source,bytes:i.bytes,decodedExact:i.decodedExact})));
