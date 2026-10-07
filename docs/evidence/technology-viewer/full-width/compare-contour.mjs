import sharp from 'sharp';import{writeFile}from'node:fs/promises';
const out='docs/evidence/technology-viewer/full-width';const results=[];
for(const[name,width,height]of[['pro',402,874],['pro-max',440,956]]){
 const w=width*3,h=Math.round(height*.8071559*3),top=Math.round(height*.0964221*3);
 const expected=await sharp('public/art/technology/frame-template.webp').resize(w,h,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 const actual=await sharp(`${out}/${name}-slide-1.png`).extract({left:0,top,width:w,height:h}).ensureAlpha().raw().toBuffer();
 const errors=[];let sum=0,max=0;
 for(let y=3;y<h-3;y++)for(let x=3;x<w-3;x++){
 const at=(y*w+x)*4;if(expected[at+3]!==255)continue;
 // Exclude fractional cutout transitions; compare only opaque contour interiors.
 if([at-12,at+12,at-12*w,at+12*w].some(i=>expected[i+3]!==255))continue;
 for(let c=0;c<3;c++){const d=Math.abs(expected[at+c]-actual[at+c]);errors.push(d);sum+=d;max=Math.max(max,d);}
 }
 errors.sort((a,b)=>a-b);results.push({name,comparedChannels:errors.length,meanAbsDifference:sum/errors.length,p99:errors[Math.floor(errors.length*.99)],max});
 await sharp(expected,{raw:{width:w,height:h,channels:4}}).png().toFile(`${out}/${name}-contour-reference.png`);
 // Native-pixel seam strip for image review, not a production asset.
 await sharp(`${out}/${name}-slide-1.png`).extract({left:0,top,width:60,height:Math.min(540,h)}).png().toFile(`${out}/${name}-left-seam.png`);
}
await writeFile(`${out}/contour-comparison.json`,JSON.stringify(results,null,2));console.log(results);
