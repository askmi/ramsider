import sharp from 'sharp';
// Lossless source crops include card corners AND the real full-width gap below.
// Four source pixels of bleed on both vertical edges avoid fractional browser clipping seams.
// Source background.png 941×32127; no invented fill or card-free background.
const rows = [[27147,172,7],[27326,171,8],[27505,171,7],[27683,171,7],[27861,170,6],[28037,170,0]];
for (let i=0;i<rows.length;i++) {
  const [top,height,gap] = rows[i];
  await sharp('public/art/09-10.webp').extract({left:0,top:top-25200-4,width:941,height:height+gap+8}).webp({lossless:true}).toFile(`public/art/faq-row-${i+1}.webp`);
}
