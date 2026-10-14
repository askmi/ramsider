import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

await Promise.all(['screenshots/charcoal','public/art/charcoal','docs/evidence/charcoal'].map(path=>mkdir(path,{recursive:true})));
const sourcePath='design/references/charcoal-original.png';
const source=await sharp(sourcePath).raw().toBuffer({resolveWithObject:true});
const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
const sections=[
 {top:0,height:2250,boxes:[[62,1340,1018,1545,'dark'],[62,1610,1080,1950,'dark']]},
 {top:2250,height:2250,boxes:[[62,1490,840,1548,'gold'],[62,1618,1025,2140,'dark']]},
 {top:4500,height:1900,boxes:[[62,1203,1010,1270,'gold'],[62,1330,1025,1810,'dark']]},
 {top:6400,height:2150,boxes:[[62,1152,850,1225,'gold'],[62,1278,1055,1790,'dark'],[62,2030,410,2090,'gold']]},
];
const evidence={source:sourcePath,sourceSha256:await hash(sourcePath),faceSha256:await hash('design/references/charcoal-face.png'),originalICC:'absent, intended profile UNKNOWN; native web interpretation retained',faceICC:'sRGB IEC61966-2.1',cutoff:8550,removedTailRows:1800,items:[]};
const joins=[];
for(const [index,section]of sections.entries()){
 const width=1080,height=section.height;
 const original=source.data.subarray(section.top*width*3,(section.top+height)*width*3);
 const clean=Buffer.from(original),mask=Buffer.alloc(width*height);
 const generated=await sharp(`design/derived/charcoal/backplate-${index+1}.png`).resize(width,index===0?2100:height,{fit:'fill'}).removeAlpha().raw().toBuffer();
 for(const [l,t,r,b,kind]of section.boxes)for(let y=t;y<b;y++)for(let x=l;x<r;x++){
  const i=(y*width+x)*3,[red,green,blue]=original.subarray(i,i+3);
  if(kind==='dark'?Math.max(red,green,blue)<150:red>green+20&&green>blue+12&&green<160){
   for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<width&&y+dy>=0&&y+dy<height)mask[(y+dy)*width+x+dx]=1;
  }
 }
 // Imagegen supplies missing texture; a restricted harmonic refinement joins
 // glyph interiors to the untouched source rather than replacing full text boxes.
 const pixels=[];
 for(let p=0;p<mask.length;p++)if(mask[p]){pixels.push(p*3);for(let c=0;c<3;c++)clean[p*3+c]=generated[p*3+c];}
 const values=Float32Array.from(clean);
 for(let pass=0;pass<220;pass++)for(const i of pixels)for(let c=0;c<3;c++)values[i+c]=(values[i-3+c]+values[i+3+c]+values[i-width*3+c]+values[i+width*3+c])/4;
 for(const i of pixels)for(let c=0;c<3;c++)clean[i+c]=Math.round(values[i+c]);
 if(index===0){
  // Keep original smoky head/background. The literal Face donor is
  // composited inside its facial contour, preserving donor identity/pixels.
  const donor=await sharp('design/references/charcoal-face.png').extract({left:210,top:0,width:340,height:580}).resize(612,1044).removeAlpha().raw().toBuffer();
  const contour='M 310 125 L 405 125 L 421 370 L 350 438 L 245 438 L 245 265 L 294 220 Z';
  const svg=Buffer.from(`<svg width="612" height="1044"><g transform="scale(1.8) translate(-210 0)"><path d="${contour}" fill="white"/></g></svg>`);
  const alpha=await sharp(svg).blur(16).ensureAlpha().raw().toBuffer();
  const left=138,top=0;
  let donorCorePixels=0;
  for(let y=0;y<1044;y++)for(let x=0;x<612;x++){
   const a=alpha[(y*612+x)*4+3]/255;if(!a)continue;
   const i=((y+top)*width+x+left)*3,j=(y*612+x)*3;
   mask[(y+top)*width+x+left]=1;
   for(let c=0;c<3;c++)clean[i+c]=Math.round(clean[i+c]*(1-a)+donor[j+c]*a);
   if(a===1)donorCorePixels++;
  }
  section.donor={sourceCrop:[210,0,340,580],scale:1.8,left,top,contour,edgeBlur:16,donorCorePixels};
 }
 // Move the decorative line into live layout so translations can reflow it.
 if(index===3)for(let y=1958;y<1965;y++)for(let x=64;x<1012;x++){
  const i=(y*width+x)*3;for(let c=0;c<3;c++)clean[i+c]=clean[((y-20)*width+x)*3+c];mask[y*width+x]=1;
 }
 let outsideChanged=0;for(let i=0;i<clean.length;i++)if(clean[i]!==original[i]&&!mask[Math.floor(i/3)])outsideChanged++;
 if(outsideChanged)throw Error('Artwork exterior changed');
 const join=await sharp(clean,{raw:{width,height,channels:3}}).extract({left:0,top:height-1,width,height:1}).png().toBuffer();
 joins.push(`data:image/png;base64,${join.toString('base64')}`);
 const native=`screenshots/charcoal/clean-${index+1}.png`;
 await sharp(clean,{raw:{width,height,channels:3}}).png().toFile(native);
 const tiles=[];let bytes=0;const rejoined=[];
 for(let y=0,tile=0;y<height;y+=750,tile++){
  const tileTop=Math.max(0,y-2),tileEnd=Math.min(height,y+752),tileHeight=tileEnd-tileTop,output=`public/art/charcoal/${index+1}-${tile}.png`;
  const raw=clean.subarray(tileTop*width*3,tileEnd*width*3);
  await sharp(raw,{raw:{width,height:tileHeight,channels:3}}).png({compressionLevel:9,adaptiveFiltering:true}).toFile(output);
  const decoded=await sharp(output).removeAlpha().raw().toBuffer();
  if(!decoded.equals(raw))throw Error('Lossless native tile decoded mismatch');
  rejoined.push(decoded.subarray((y-tileTop)*width*3,(Math.min(height,y+750)-tileTop)*width*3));const tileBytes=(await readFile(output)).length;bytes+=tileBytes;
  tiles.push({output,top:tileTop,contentTop:y,contentHeight:Math.min(750,height-y),height:tileHeight,width,bytes:tileBytes,decodedExact:true,sha256:await hash(output)});
 }
 if(!Buffer.concat(rejoined).equals(clean))throw Error('Joined tile pixels changed');
 await sharp(native).resize({width:540}).toFile(`/tmp/charcoal-clean-${index+1}.png`);
 evidence.items.push({index:index+1,...section,width,maskedPixels:mask.reduce((s,v)=>s+v,0),outsideChanged,alpha:'source/output bothopaque',backplateSha256:await hash(`design/derived/charcoal/backplate-${index+1}.png`),nativeSha256:await hash(native),tiles,joinedDecodedExact:true,bytes,decodedExact:true,format:"lossless PNG, native1080px, no brightness/profile transform"});
}
await writeFile('lib/charcoal-joins.json',JSON.stringify(joins)+'\n');
await writeFile('docs/evidence/charcoal/assets.json',JSON.stringify(evidence,null,2)+'\n');
console.log(evidence.items.map(({index,outsideChanged,decodedExact,bytes})=>({index,outsideChanged,decodedExact,bytes})));
