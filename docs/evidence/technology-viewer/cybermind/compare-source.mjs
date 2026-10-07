import {webkit,expect} from '@playwright/test';
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
const out='docs/evidence/technology-viewer/cybermind';
const files=['CyberMind_TOP_ONLY_941x1672.png','CyberMind_02_SYSTEM_CONNECTED_CLEAN_941x1672.png'];
const results=[];const browser=await webkit.launch();
try{for(const[name,width,height]of[['pro',402,874],['pro-max',440,956]]){
 const pages=[];
 for(const reference of [false,true]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true});const page=await context.newPage();
  if(reference)await page.route('**/technology/cybermind/*.png',async route=>{const id=Number(route.request().url().match(/(\d+)\.png$/)[1]);await route.fulfill({status:200,contentType:'image/png',body:await readFile(`design/references/tech_02/${files[id-1]}`)});});
  await page.goto('http://127.0.0.1:3021/en');await page.locator('[data-technology-open]').first().click();const viewer=page.locator('#technology-viewer');await viewer.locator('.technology-viewer__next-group').click();await expect(viewer).toHaveAttribute('data-group','CyberMind');
  await page.addStyleTag({content:'.technology-viewer__title{visibility:hidden}'});pages.push({page,viewer,context});
 }
 for(let i=0;i<2;i++){
  const captures=[];let stage;
  for(const{page,viewer}of pages){
   await viewer.locator('.technology-viewer__dots button').nth(i).click();await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src',`/art/technology/cybermind/0${i+1}.png`);
   await viewer.locator('img').evaluateAll(async imgs=>{await document.fonts.ready;await Promise.all(imgs.map(img=>img.decode()));});
   stage=await viewer.locator('.technology-viewer__stage').boundingBox();captures.push(await page.screenshot());
  }
  const a=await sharp(captures[0]).removeAlpha().raw().toBuffer(),b=await sharp(captures[1]).removeAlpha().raw().toBuffer();let outsideHeaderChanged=0,changedInsideHeader=0;
  for(let y=0;y<height*3;y++)for(let x=0;x<width*3;x++){
   const sx=(x/3-stage.x)/stage.width*941,sy=(y/3-stage.y)/stage.height*1672;
   const header=sx>=48&&sx<=552&&sy>=121&&sy<=282,p=(y*width*3+x)*3;
   for(let c=0;c<3;c++)if(a[p+c]!==b[p+c]){if(header)changedInsideHeader++;else outsideHeaderChanged++;}
  }
  expect(outsideHeaderChanged).toBe(0);results.push({name,slide:i+1,width,height,dpr:3,stage,outsideHeaderChanged,changedInsideHeader});
  const source=await sharp(`design/references/tech_02/${files[i]}`).extract({left:16,top:80,width:576,height:256}).png().toBuffer();
  const live=await sharp(`${out}/${name}-slide-${i+1}.png`).extract({left:Math.round(stage.x*3),top:Math.round(stage.y*3),width:Math.round(stage.width*3),height:Math.round(stage.height*3)}).resize(941,1672,{fit:'fill'}).extract({left:16,top:80,width:576,height:256}).png().toBuffer();
  await sharp({create:{width:1152,height:256,channels:3,background:'#fff'}}).composite([{input:source,left:0,top:0},{input:live,left:576,top:0}]).png().toFile(`${out}/${name}-${i+1}-title-pair.png`);
 }
 for(const{context}of pages)await context.close();
}await writeFile(`${out}/browser-source-rgb.json`,JSON.stringify({method:'Separate equivalent WebKit pages, live title hidden; actual delivered PNG vs intercepted source-original body. Header envelope accounts for resampling; native glyph-mask test separately requires exact channels outside glyphs.',results},null,2)+'\n');console.log('All4 browser originals/clean PNGs: RGB0 outside title envelope');}finally{await browser.close();}
