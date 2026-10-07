/** Preserve all original channels outside the authorized CyberMind title glyphs. */
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const out = 'docs/evidence/technology-viewer/cybermind';
const crop = { left:16,top:80,width:576,height:256 };
const sources = { '01':'CyberMind_TOP_ONLY_941x1672.png', '02':'CyberMind_02_SYSTEM_CONNECTED_CLEAN_941x1672.png' };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir('public/art/technology/cybermind', {recursive:true});
const items=[];
for (const [id,file] of Object.entries(sources)) {
  const source=`design/references/tech_02/${file}`;
  const patch=`design/derived/cybermind-title/${id}-wall.png`;
  const output=`public/art/technology/cybermind/${id}.png`;
  const bytes=await readFile(source), metadata=await sharp(bytes).metadata();
  const {data:original,info}=await sharp(bytes).raw().toBuffer({resolveWithObject:true});
  const {width,height,channels}=info;
  if(width!==941||height!==1672||channels!==(id==='01'?4:3)||metadata.icc) throw new Error(`Unexpected master ${id}`);
  const mask=Buffer.alloc(width*height), glyphs=[];
  for(let y=120;y<280;y++) for(let x=45;x<565;x++) {
    const [r,g,b]=original.subarray((y*width+x)*channels,(y*width+x)*channels+3);
    if((y<236&&Math.max(r,g,b)<120)||(y>=240&&x<220&&r-g>25&&g-b>8&&g<190)) glyphs.push([x,y]);
  }
  for(const[x,y]of glyphs)for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)mask[(y+dy)*width+x+dx]=255;
  const wall=await sharp(patch).raw().toBuffer();
  const clean=Buffer.from(original);let maskedPixels=0;
  for(let y=122;y<282;y++)for(let x=43;x<567;x++) {
    if(!mask[y*width+x])continue;
    maskedPixels++; const correction=[0,0,0];let samples=0;
    for(let dy=-14;dy<=14;dy+=2)for(let dx=-14;dx<=14;dx+=2){
      const sx=x+dx,sy=y+dy;if(mask[sy*width+sx])continue;
      const p=((sy-crop.top)*crop.width+sx-crop.left)*3,s=(sy*width+sx)*channels;
      for(let c=0;c<3;c++)correction[c]+=original[s+c]-wall[p+c];samples++;
    }
    if(!samples)throw new Error(`No local wall samples ${id}/${x}/${y}`);
    const p=((y-crop.top)*crop.width+x-crop.left)*3,s=(y*width+x)*channels;
    for(let c=0;c<3;c++)clean[s+c]=Math.max(0,Math.min(255,Math.round(wall[p+c]+correction[c]/samples)));
  }
  await sharp(clean,{raw:{width,height,channels}}).png({compressionLevel:0}).toFile(output);
  await sharp(mask,{raw:{width,height,channels:1}}).png().toFile(`${out}/mask-${id}.png`);
  await sharp(bytes).extract(crop).png().toFile(`${out}/${id}-source-title.png`);
  await sharp(output).extract(crop).png().toFile(`${out}/${id}-clean-title.png`);
  const decoded=await sharp(output).raw().toBuffer();let outsideChangedChannels=0,alphaChangedPixels=0;
  for(let i=0;i<mask.length;i++){
    if(!mask[i])for(let c=0;c<channels;c++)if(decoded[i*channels+c]!==original[i*channels+c])outsideChangedChannels++;
    if(channels===4&&decoded[i*4+3]!==original[i*4+3])alphaChangedPixels++;
  }
  const deliveredMetadata=await sharp(output).metadata();
  if(outsideChangedChannels||alphaChangedPixels||deliveredMetadata.icc||deliveredMetadata.channels!==channels)throw new Error(`Original fidelity changed ${id}`);
  items.push({id,source,output,patch,sourceSha256:sha(bytes),outputSha256:sha(await readFile(output)),patchSha256:sha(await readFile(patch)),width,height,channels,icc:null,outputBytes:(await readFile(output)).length,maskedPixels,outsideChangedChannels,alphaChangedPixels});
}
await writeFile(`${out}/assets.json`,JSON.stringify({method:'Built-in imagegen crop wall patch; tight glyph-only composite with local source color correction; native PNG compressionLevel0, no resizing/profile/channel/alpha change to photographs',crop,items},null,2)+'\n');
console.log(JSON.stringify(items));
