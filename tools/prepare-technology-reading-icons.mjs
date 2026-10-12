import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';

// Source artwork remains untouched. Separate exact icon crops from a narrowly
// masked companion overlay; unmasked pixels of the overlay are transparent.
const map=JSON.parse(await readFile('lib/technology-icon-map.json','utf8'));
const destination='public/art/technology/reading-icons';
await mkdir(destination,{recursive:true});
const report=[],patchBounds={};
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const group of map.groups){
 const bytes=await readFile(`public${group.source}`),meta=await sharp(bytes).metadata();
 if(meta.icc)throw new Error(`Tagged source needs an explicit color-managed path: ${group.photo}`);
 const {data:source,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width,height}=info,mask=new Uint8Array(width*height),patch=Buffer.alloc(source.length);
 const mark=(x,y)=>{if(x>=0&&y>=0&&x<width&&y<height)mask[y*width+x]=1;};
 const lum=(i)=>.2126*source[i]+.7152*source[i+1]+.0722*source[i+2];
 const icons=[];
 for(const icon of group.icons){
  const [left,top,w,h]=icon.box;
  const raw=await sharp(bytes).extract({left,top,width:w,height:h}).ensureAlpha().raw().toBuffer();
  const target=`${destination}/${group.photo}-${icon.id}.png`;
  const encoded=await sharp(raw,{raw:{width:w,height:h,channels:4}}).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
  await writeFile(target,encoded);
  const decoded=await sharp(encoded).ensureAlpha().raw().toBuffer();
  if(!decoded.equals(raw))throw new Error(`Crop differs: ${target}`);
  icons.push({id:icon.id,caption:icon.caption,box:icon.box,path:target,bytes:encoded.length,decodedRGBAMaxDifference:0,alphaExact:true});
  for(let y=top;y<top+h;y++)for(let x=left;x<left+w;x++){
   const i=(y*width+x)*4,L=lum(i),r=source[i],g=source[i+1],b=source[i+2];
   let ink;
   if(icon.id==='mood-online'){
    const distance=Math.hypot(x-690,y-878);
    ink=(distance>26&&distance<34)||(x>665&&x<718&&y>855&&y<899);
   }else if(group.photo.startsWith('cyber'))ink=r-b>24&&r-g>8&&L<235;
   else if(group.photo.startsWith('touch'))ink=r-b>45&&r-g>15&&L<205;
   else ink=L<(group.photo==='mood-02'?100:160)||(group.photo==='noble-02'&&r-b>60&&L<205);
   if(group.photo.startsWith('cyber'))ink=ink||Math.hypot(x-91,y-(top+41))<=37;
   if(ink)mark(x,y);
  }
  // Pale antialiasing and raster shadows belong to the removed icon too.
  // These small source rectangles contain only feature ink and background.
  if(icon.id!=='mood-online'&&!group.photo.startsWith('cyber')){
   for(let y=top-4;y<top+h+4;y++)for(let x=left-4;x<left+w+4;x++)mark(x,y);
  }
 }
 // Explicit connector ownership: routes that led to moved feature icons are
 // removed. Device UI/data paths outside these routes remain source artwork.
 for(const points of group.paths){
  for(let segment=1;segment<points.length;segment++){
   const [ax,ay]=points[segment-1],[bx,by]=points[segment],dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;
   for(let y=Math.floor(Math.min(ay,by)-4);y<=Math.ceil(Math.max(ay,by)+4);y++)for(let x=Math.floor(Math.min(ax,bx)-4);x<=Math.ceil(Math.max(ax,bx)+4);x++){
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/len2));
    if(group.photo.startsWith('cyber')){
     const i=(y*width+x)*4;
     if(!(source[i]-source[i+2]>22&&source[i]-source[i+1]>5&&lum(i)<240))continue;
    }else if(Math.hypot(x-ax-t*dx,y-ay-t*dy)>2.5)continue;
    mark(x,y);
   }
  }
 }
 // Cover antialiased edge ink without replacing an entire textured rectangle.
 const ink=mask.slice();
 const edge=group.photo.startsWith('cyber')||group.photo==='mood-02'?2:1;
 for(let y=edge;y<height-edge;y++)for(let x=edge;x<width-edge;x++)if(ink[y*width+x])for(let oy=-edge;oy<=edge;oy++)for(let ox=-edge;ox<=edge;ox++)mark(x+ox,y+oy);
 if(group.photo==='mood-02'){
  // Native black foot edge, measured from source pixels, crosses the cloud.
  // Protect only this geometry; dark circle shadows outside it remain masked.
  const edgePoints=[[580,858],[620,862],[655,864],[670,864],[680,863],[690,861],[700,858],[710,855],[720,850],[730,846],[740,842]];
  for(let k=1;k<edgePoints.length;k++){
   const [ax,ay]=edgePoints[k-1],[bx,by]=edgePoints[k];
   for(let x=ax;x<=bx;x++){
    const cy=ay+(by-ay)*(x-ax)/(bx-ax);
    for(let y=Math.ceil(cy-2);y<=Math.floor(cy+2);y++)if(lum((y*width+x)*4)<70)mask[y*width+x]=0;
   }
  }
 }
 let count=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  if(!mask[y*width+x])continue;
  count++;const sums=[0,0,0];let weights=0;
  for(let radius=3;radius<=78;radius+=3){
   for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
    if(Math.max(Math.abs(ox),Math.abs(oy))!==radius)continue;
    const sx=x+ox,sy=y+oy;if(sx<0||sy<0||sx>=width||sy>=height||mask[sy*width+sx])continue;
    const weight=1/(ox*ox+oy*oy),j=(sy*width+sx)*4;
    for(let c=0;c<3;c++)sums[c]+=source[j+c]*weight;
    weights+=weight;
   }
   if(weights>0)break;
  }
  if(!weights)throw new Error(`No background neighbours: ${group.photo} ${x},${y}`);
  const i=(y*width+x)*4;for(let c=0;c<3;c++)patch[i+c]=Math.round(sums[c]/weights);patch[i+3]=source[i+3];
 }
 // Relax the small Mood cloud/connector mask against fixed source neighbours.
 // This avoids ring-shaped nearest-neighbour bands where it crosses the foot.
 if(group.photo==='mood-02'){
  const points=[];
  for(let y=1;y<1000;y++)for(let x=1;x<width-1;x++)if(mask[y*width+x])points.push(y*width+x);
  const field=new Float64Array(source.length);
  for(let p=0;p<width*height;p++)for(let c=0;c<4;c++)field[p*4+c]=mask[p]?patch[p*4+c]:source[p*4+c];
  for(let pass=0;pass<400;pass++)for(const p of points){
   const i=p*4;
   for(let c=0;c<3;c++)field[i+c]=(field[i-4+c]+field[i+4+c]+field[i-width*4+c]+field[i+width*4+c])/4;
  }
  for(const p of points)for(let c=0;c<3;c++)patch[p*4+c]=Math.round(field[p*4+c]);
 }
 let left=width,top=height,right=0,bottom=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(mask[y*width+x]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 left=Math.max(0,left-2);top=Math.max(0,top-2);right=Math.min(width-1,right+2);bottom=Math.min(height-1,bottom+2);
 const box={left,top,width:right-left+1,height:bottom-top+1};
 const expected=await sharp(patch,{raw:{width,height,channels:4}}).extract(box).raw().toBuffer();
 const overlay=await sharp(expected,{raw:{width:box.width,height:box.height,channels:4}}).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
 const patchPath=`${destination}/${group.photo}-patch.png`;
 await writeFile(patchPath,overlay);
 patchBounds[group.photo]=[box.left,box.top,box.width,box.height];
 const decoded=await sharp(overlay).ensureAlpha().raw().toBuffer();
 if(!decoded.equals(expected))throw new Error(`Patch decode differs: ${group.photo}`);
 let outsideAlpha=0;for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++)if(!mask[(top+y)*width+left+x]&&decoded[(y*box.width+x)*4+3])outsideAlpha++;
 if(outsideAlpha)throw new Error('Patch is opaque outside its mask');
 if(hash(await readFile(`public${group.source}`))!==hash(bytes))throw new Error('Source changed');
 report.push({photo:group.photo,sourceSHA256:hash(bytes),sourceUnchanged:true,width,height,ICC:'UNTAGGED; source intent UNKNOWN; no profile assignment',icons,patch:{path:patchPath,bytes:overlay.length,box:[box.left,box.top,box.width,box.height],decodedBytes:box.width*box.height*4,maskedPixels:count,alphaOutsideMask:outsideAlpha,decodedRGBAMaxDifference:0},limitations:'Masked background interpolation is visually checked; exact underlying occluded texture is unknown.'});
}
await writeFile('lib/technology-icon-patches.json',JSON.stringify(patchBounds,null,2)+'\n');
await writeFile('docs/evidence/technology-discrete/reading-icons-assets.json',JSON.stringify({date:'2026-10-12',encoding:'Native-size lossless PNG; exact source icon crops; bounded alpha patches; no source mutation',report},null,2)+'\n');
console.log(JSON.stringify({photos:report.length,icons:report.reduce((n,r)=>n+r.icons.length,0),totalBytes:report.reduce((n,r)=>n+r.patch.bytes+r.icons.reduce((s,i)=>s+i.bytes,0),0)}));
