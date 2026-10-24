import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs/promises';
const rows=[];
for(const route of ['reserve','pro','gold','compare','product-info','terms','returns','privacy','privacy-ru']){
 const reference=`screenshots/preorder/reference/${route==='product-info'?'product-card':route}-402.png`;
 const actual=`screenshots/preorder/final/iphone-17-pro-webkit/${route}.png`;
 const ref=await sharp(reference).resize({width:402}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const got=await sharp(actual).resize({width:402}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const width=402; const height=Math.min(ref.info.height,got.info.height)-2;
 let best={pixels:Infinity,dy:0};
 for(const dy of [0,1,2]){
  const a=ref.data.subarray(0,width*height*4);const b=got.data.subarray(dy*width*4,(height+dy)*width*4);
  const pixels=pixelmatch(a,b,null,width,height,{threshold:.15});
  if(pixels<best.pixels)best={pixels,dy};
 }
 const diff=Buffer.alloc(width*height*4);
 pixelmatch(ref.data.subarray(0,width*height*4),got.data.subarray(best.dy*width*4,(height+best.dy)*width*4),diff,width,height,{threshold:.15});
 await sharp(diff,{raw:{width,height,channels:4}}).png().toFile(`screenshots/preorder/${route}-diff.png`);
 rows.push({route,referenceHeight:ref.info.height,actualHeight:got.info.height,alignmentYCSS:best.dy,differencePercent:best.pixels/(width*height)*100,threshold:.15,interpretation:'Second signal only; intentional label contrast/Beta chrome excluded by document bounds, source links remapped; visual inspection required.'});
}
await fs.writeFile('docs/evidence/preorder/visual-diff.json',JSON.stringify(rows,null,2)+'\n');console.log(rows.map(({route,differencePercent,alignmentYCSS})=>({route,differencePercent,alignmentYCSS})));
