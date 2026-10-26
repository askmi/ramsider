import fs from 'node:fs/promises';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
const base='screenshots/r69j',reference=`${base}/reference-editorial`,actual=`${base}/candidate`;
const rows=[];await fs.mkdir(`${base}/diff`,{recursive:true});
for(const name of (await fs.readdir(actual)).filter(name=>name.endsWith('.png'))){
 const a=await sharp(`${reference}/${name}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});const b=await sharp(`${actual}/${name}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});const width=a.info.width,height=a.info.height-6,bytes=width*4;
 let best;
 // Beta notice cropping can round its document origin by at most one CSS px (DPR3).
 for(let shift=-3;shift<=3;shift++){
  const aa=a.data.subarray((3+Math.max(shift,0))*bytes,(3+Math.max(shift,0)+height)*bytes),bb=b.data.subarray((3+Math.max(-shift,0))*bytes,(3+Math.max(-shift,0)+height)*bytes),out=Buffer.alloc(width*height*4);
  const pixels=pixelmatch(aa,bb,out,width,height,{threshold:.1,includeAA:false});if(!best||pixels<best.pixels)best={pixels,shift,out};
 }
 const percent=best.pixels/(width*height)*100;rows.push({name,verticalDevicePixelAlignment:best.shift,differencePercent:percent});await sharp(best.out,{raw:{width,height,channels:4}}).png().toFile(`${base}/diff/${name}`);
}
await fs.writeFile('docs/evidence/r69j/comparison.json',JSON.stringify({date:'2026-10-26',method:'Same WebKit402DPR3/sourceeditorial CSSunchanged; bounded vertical origin alignment ±1CSSpx only; threshold0.1/AAexcluded. Formselect60px vs source33px intentional; previewtext intentional. Never a substitute for visual inspection.',rows},null,2)+'\n');console.log(rows.map(r=>`${r.name}: ${r.differencePercent.toFixed(3)}% (y${r.verticalDevicePixelAlignment})`).join('\n'));
