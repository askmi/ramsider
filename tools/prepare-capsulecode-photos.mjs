import sharp from 'sharp';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Untagged masters: preserve native RGBA; reconstruct only baked title glyphs.
const evidence='docs/evidence/technology-discrete';
await mkdir(evidence,{recursive:true});
const items=[];
for(let n=0;n<3;n++){
 const source=`design/references/tech_03/0${2+n*2}.png`,output=`public/art/technology/slides/capsule-0${n+1}.png`;
 const {data,info}=await sharp(source).raw().toBuffer({resolveWithObject:true});
 const {width,height,channels}=info,clean=Buffer.from(data),mask=Buffer.alloc(width*height);
 for(let y=20;y<174;y++)for(let x=45;x<688;x++){
  const i=(y*width+x)*channels,[r,g,b]=data.subarray(i,i+3);
  if((y<134&&Math.max(r,g,b)<65)||(y>=140&&x<224&&r-g>25&&g-b>12&&g<145)){
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)mask[(y+dy)*width+x+dx]=255;
  }
 }
 let changed=0,outside=0;
 for(let y=18;y<176;y++)for(let x=43;x<690;x++)if(mask[y*width+x]){
  // Interpolate between untouched samples along each wall column; grooves keep X phase.
  let top=y-1,bottom=y+1;while(top>0&&mask[top*width+x])top--;while(bottom<height-1&&mask[bottom*width+x])bottom++;
  const t=(y-top)/(bottom-top),i=(y*width+x)*channels;
  for(let c=0;c<3;c++)clean[i+c]=Math.round(data[(top*width+x)*channels+c]*(1-t)+data[(bottom*width+x)*channels+c]*t);
  changed++;
 }
 for(let i=0;i<data.length;i++)if(data[i]!==clean[i]&&!mask[Math.floor(i/channels)])outside++;
 if(outside)throw Error('Changed pixels outside title mask');
 await sharp(clean,{raw:{width,height,channels}}).png({compressionLevel:9,adaptiveFiltering:true}).toFile(output);
 const decoded=await sharp(output).raw().toBuffer();if(!decoded.equals(clean))throw Error('Lossless roundtrip failed');
 await sharp(mask,{raw:{width,height,channels:1}}).png().toFile(`/tmp/tech03-mask-${n+1}.png`);
 await sharp(output).extract({left:25,top:0,width:705,height:195}).png().toFile(`/tmp/tech03-clean-title-${n+1}.png`);
 items.push({source,output,width,height,channels,icc:'absent; native untagged channels retained',maskedPixels:changed,outsideChanged:outside,alphaExact:true,decodedExact:true,bytes:(await readFile(output)).length,sha256:createHash('sha256').update(await readFile(output)).digest('hex')});
}
await writeFile(`${evidence}/tech03-assets.json`,JSON.stringify(items,null,2)+'\n');
console.log(JSON.stringify(items));
