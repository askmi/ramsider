import { webkit, expect } from '@playwright/test';
import sharp from 'sharp';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = 'https://ramsider-main.vercel.app';
const out = 'docs/evidence/technology-viewer/cybermind';
const files = ['02','03','04','05','cybermind/01','cybermind/02'];
const results = [], browser = await webkit.launch();
const bounded = async (task,label) => {
  let timer;
  try { return await Promise.race([task,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`180s resource deadline: ${label}`)),180000);})]); }
  finally {clearTimeout(timer);}
};
try {
 for(const [name,width,height] of [['13-pro',390,664],['pro',402,874],['pro-max',440,956]]) {
  console.log(`${name}: start`);
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(files.some(id=>r.url()===`${base}/art/technology/${id}.png`)) requests.push(r.url());});
  await page.addInitScript(()=>{window.__qa={images:[],openAt:null};window.Image=new Proxy(window.Image,{construct(target,args){const i=Reflect.construct(target,args);window.__qa.images.push(i);return i;}});document.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('[data-technology-open]'))window.__qa.openAt=performance.now();},true);});
  const resources=files.map(id=>page.waitForResponse(r=>r.url()===`${base}/art/technology/${id}.png`,{timeout:180000}));
  const photo=async index=>{
   const response=await resources[index];expect(response.ok()).toBe(true);expect(response.headers()['content-type']).toContain('image/png');
   const bytes=await bounded(response.body(),`${name}/${files[index]}`);
   expect(bytes.equals(await readFile(`public/art/technology/${files[index]}.png`))).toBe(true);
   console.log(`${name}: ${files[index]} original ready (${bytes.length}B)`);
   return{id:files[index],bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
  };
  await page.goto(`${base}/en`,{waitUntil:'load',timeout:120000});
  const firstPhotos=await Promise.all([photo(0),photo(4)]);
  await page.waitForFunction(()=>window.__qa.images.length===2&&window.__qa.images.every(i=>i.complete&&i.naturalWidth===941),{},{timeout:180000});
  expect(requests.sort()).toEqual([`${base}/art/technology/02.png`,`${base}/art/technology/cybermind/01.png`].sort());
  const preOpen=await page.evaluate(async()=>{await Promise.all(window.__qa.images.map(i=>i.decode()));return{load:performance.getEntriesByType('navigation')[0].loadEventEnd,images:window.__qa.images.length,resources:performance.getEntriesByType('resource').filter(e=>/\/technology\/(?:cybermind\/01|02)\.png$/.test(e.name)).map(e=>({url:e.name,start:e.startTime,end:e.responseEnd}))};});
  preOpen.resources.forEach(r=>expect(r.start).toBeGreaterThanOrEqual(preOpen.load));
  const cta=page.locator('[data-technology-open]').first();await cta.click();
  const viewer=page.locator('#technology-viewer');await expect(viewer).toBeVisible();await expect(page.locator('html')).toHaveCSS('background-color','rgb(0, 0, 0)');await expect(page.locator('main.canvas')).not.toBeVisible();
  const rest=await Promise.all([photo(1),photo(2),photo(3),photo(5)]),photos=[firstPhotos[0],...rest.slice(0,3),firstPhotos[1],rest[3]];
  await page.waitForFunction(()=>window.__qa.images.length===6&&window.__qa.images.every(i=>i.complete&&i.naturalWidth===941),{},{timeout:180000});await page.evaluate(async()=>Promise.all(window.__qa.images.map(i=>i.decode())));
  const frame=await viewer.locator('.technology-viewer__frame').boundingBox(),stage=await viewer.locator('.technology-viewer__stage').boundingBox();
  expect(frame.x).toBeCloseTo(0,1);expect(frame.width).toBeCloseTo(width,1);expect(stage.x).toBeCloseTo(width*29/941,1);expect(stage.width).toBeCloseTo(width*883/941,1);
  const slides=[];
  for(const [brand,count] of [['HeatCore',4],['CyberMind',2]]) {
   if(brand==='CyberMind')await viewer.locator('.technology-viewer__next-group').click();
   await expect(viewer).toHaveAttribute('data-group',brand);await expect(viewer.locator('.technology-viewer__dots button')).toHaveCount(count);
   for(let i=0;i<count;i++) {
    const id=brand==='HeatCore'?files[i]:files[4+i];
    await viewer.locator('.technology-viewer__dots button').nth(i).click();await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src',`/art/technology/${id}.png`,{timeout:30000});
    await bounded(viewer.locator('img').evaluateAll(async imgs=>{await document.fonts.ready;await Promise.all(imgs.map(i=>i.decode()));}),`${name}/${id} decode`);
    if(brand==='CyberMind') {await expect(viewer.locator('.technology-viewer__descriptions')).toHaveCount(0);await expect(viewer.locator('.technology-viewer__title')).toHaveCSS('font-family',/OpenSans/);}
    const actual=await page.screenshot();if(brand==='CyberMind')await writeFile(`${out}/public-${name}-slide-${i+1}.png`,actual);
    let changedChannels=null;
    if(name!=='13-pro') {
     const local=brand==='HeatCore'?`${name}-heatcore-${i+1}.png`:`${name}-slide-${i+1}.png`;
     const a=await sharp(actual).raw().toBuffer(),b=await sharp(`${out}/${local}`).raw().toBuffer();expect(a.length).toBe(b.length);changedChannels=0;
     for(let j=0;j<a.length;j++)if(a[j]!==b[j])changedChannels++;expect(changedChannels).toBe(0);
    }
    slides.push({...photos[brand==='HeatCore'?i:4+i],brand,changedChannels});
   }
  }
  await viewer.locator('.technology-viewer__previous-group').click();await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src','/art/technology/05.png');
  const timing=await page.evaluate(()=>({openAt:window.__qa.openAt,instances:window.__qa.images.length,photos:performance.getEntriesByType('resource').filter(e=>/\/technology\/(?:cybermind\/0[12]|0[2-5])\.png$/.test(e.name)).map(e=>({url:e.name,start:e.startTime,end:e.responseEnd}))}));
  for(const r of timing.photos.filter(r=>!preOpen.resources.some(p=>p.url===r.url)))expect(r.start).toBeGreaterThanOrEqual(timing.openAt);
  const probe=await page.addStyleTag({content:'#technology-viewer[open],#technology-viewer[open] *{visibility:hidden!important}#technology-viewer[open]::backdrop{background:transparent!important}'});
  expect((await sharp(await page.screenshot()).removeAlpha().raw().toBuffer()).some(v=>v!==0)).toBe(false);await probe.evaluate(el=>el.remove());
  await viewer.locator('.technology-viewer__close').click();await expect(page.locator('main.canvas')).toBeVisible();await expect(page.locator('html')).toHaveCSS('background-color','rgb(211, 183, 159)');await expect(cta).toBeFocused();
  await cta.click();await expect(viewer).toHaveAttribute('data-group','HeatCore');await viewer.locator('.technology-viewer__next-group').click();await expect(viewer).toHaveAttribute('data-group','CyberMind');await viewer.locator('.technology-viewer__close').click();
  expect(requests).toHaveLength(6);expect(await page.evaluate(()=>window.__qa.images.length)).toBe(6);expect(errors).toEqual([]);
  results.push({name,width,height,dpr:3,preOpen,timing,frame,stage,slides,blackBacking:true,closeRestore:true,cacheInstances:6,uniquePhotoRequests:6,errors});await context.close();console.log(`${name}: PASS`);
 }
 await writeFile(`${out}/public-checks.json`,JSON.stringify({base,sha:process.env.DEPLOYMENT_SHA,nativeChromeVerified:false,results},null,2)+'\n');
 console.log('All3 profiles/six PNG identities/2+4 warming/cache/12 Pro-Max fullRGB0 comparisons PASS');
}finally{await browser.close();}
