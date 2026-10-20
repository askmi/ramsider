import {expect,test} from '@playwright/test';
const extra=(url:string)=>/\/art\/(charcoal\/|technology\/slides\/|ember\/)/.test(new URL(url).pathname);

test('whole story finishes before optional media, including early modal activation',async({page},info)=>{
 test.skip(!info.project.use.isMobile,'Required phone profiles');
 let release!:()=>void;const gate=new Promise<void>(r=>{release=r;});const extras:string[]=[];
 await page.route('**/art/08.webp',async route=>{await gate;await route.continue();});
 page.on('request',r=>{if(extra(r.url()))extras.push(r.url());});
 try{
  await page.goto('/en',{waitUntil:'load'});
  await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));
  await expect(page.locator('.art img').first()).toHaveAttribute('data-media-ready','');
  await page.locator('#fire-learn').click();
  await expect(page.locator('#charcoal-viewer')).toBeVisible();
  await page.waitForTimeout(500);
  expect(extras,'Optional HTTP transfers must wait for the held story image').toEqual([]);
  await expect(page.locator('#charcoal-viewer .media-loading').first()).toBeVisible();
  release();
  await expect.poll(()=>extras.length,{timeout:30000}).toBeGreaterThan(0);
  const ready=await page.locator('.page-media-shell img').evaluateAll(images=>images.every(i=>i.hasAttribute('data-media-ready')));
  expect(ready).toBe(true);
  await expect(page.locator('#charcoal-viewer .charcoal-art').first()).toHaveAttribute('data-charcoal-ready','true',{timeout:30000});
 }finally{release();}
});

test('completed HTTP is insufficient until the last story image decodes',async({page},info)=>{
 test.skip(!info.project.use.isMobile,'Required phone profiles');
 await page.addInitScript(()=>{
  const original=HTMLImageElement.prototype.decode;
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  Object.assign(window,{releaseStoryDecode:release,storyDecodeHeld:false});
  HTMLImageElement.prototype.decode=async function(){
   await original.call(this);
   if(this.getAttribute('src')?.includes('/art/08.webp')){
    Object.assign(window,{storyDecodeHeld:true});await gate;
   }
  };
 });
 const extras:string[]=[];page.on('request',r=>{if(extra(r.url()))extras.push(r.url());});
 await page.goto('/en');
 await page.waitForFunction(()=>Boolean((window as unknown as {storyDecodeHeld:boolean}).storyDecodeHeld));
 await page.locator('#fire-learn').click();await expect(page.locator('#charcoal-viewer')).toBeVisible();
 expect(extras).toEqual([]);
 await page.evaluate(()=>{(window as unknown as {releaseStoryDecode:()=>void}).releaseStoryDecode();});
 await expect(page.locator('html')).toHaveAttribute('data-story-media-ready','');
 await expect.poll(()=>extras.length).toBeGreaterThan(0);
});

test('failed story image blocks optional warming until real Retry recovery',async({page},info)=>{
 test.skip(!info.project.use.isMobile,'Required phone profiles');
 let fail=true,attempts=0;const extras:string[]=[];
 await page.route('**/art/08.webp*',async route=>{attempts++;if(fail)await route.fulfill({status:503,body:'controlled story failure'});else await route.continue();});
 page.on('request',r=>{if(extra(r.url()))extras.push(r.url());});
 await page.goto('/en');await expect.poll(()=>attempts).toBe(1);
 await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));
 await page.waitForFunction(()=>{const images=[...document.querySelectorAll<HTMLImageElement>('.page-media-shell img')].filter(i=>!i.src.includes('/art/08.webp'));return images.length>0&&images.every(i=>i.hasAttribute('data-media-ready'));});
 const retry=page.locator('.page-media-overlay').getByRole('button',{name:'Retry',exact:true});
 await expect.poll(async()=>{await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));return retry.isVisible();}).toBe(true);expect(extras).toEqual([]);
 await expect(page.locator('html')).not.toHaveAttribute('data-story-media-ready','');
 fail=false;await retry.click();
 await expect(page.locator('html')).toHaveAttribute('data-story-media-ready','');
 await expect.poll(()=>extras.length).toBeGreaterThan(0);expect(attempts).toBe(2);
});

for(const viewer of ['charcoal','technology'] as const){
 test(`${viewer} shows Retry for a failed story barrier and recovers without closing`,async({page},info)=>{
  test.skip(!info.project.use.isMobile,'Required phone profiles');
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});let attempts=0;
  const extras:string[]=[];page.on('request',r=>{if(extra(r.url()))extras.push(r.url());});
  await page.route('**/art/08.webp*',async route=>{attempts++;if(attempts===1){await gate;await route.fulfill({status:503,body:'controlled story failure'});}else await route.continue();});
  try{
   await page.goto('/en');
   await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));
   const trigger=page.locator(viewer==='charcoal'?'#fire-learn':'[data-technology-open]').first();
   await trigger.scrollIntoViewIfNeeded();await trigger.click();
   const dialog=page.locator(`#${viewer}-viewer`);await expect(dialog).toBeVisible();
   release();const retry=dialog.getByRole('button',{name:'Retry',exact:true}).first();
   await expect(retry).toBeVisible();expect(extras).toEqual([]);
   await retry.click();await expect(page.locator('html')).toHaveAttribute('data-story-media-ready','');
   await expect.poll(()=>extras.length).toBeGreaterThan(0);expect(attempts).toBe(2);
   if(viewer==='charcoal')await expect(dialog.locator('.charcoal-art[data-charcoal-ready="true"]')).toHaveCount(12);
   else await expect(dialog).toHaveAttribute('aria-busy','false');
   await expect(dialog).toBeVisible();
  }finally{release();}
 });
}

for(const viewer of ['charcoal','technology'] as const){
 test(`bootstrap fallback with held hero settles priority for ${viewer} after hydration recovers`,async({page},info)=>{
  test.skip(!info.project.use.isMobile,'Required phone profiles');
  let scripts!:()=>void,story!:()=>void;const scriptsHeld=new Promise<void>(r=>{scripts=r;}),storyHeld=new Promise<void>(r=>{story=r;});
  const extras:string[]=[];page.on('request',r=>{if(extra(r.url()))extras.push(r.url());});
  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/,async route=>{await scriptsHeld;await route.continue();});
  await page.route('**/art/00.webp',async route=>{await storyHeld;await route.continue();});
  await page.route('**/art/08.webp',async route=>{await storyHeld;await route.continue();});
  try{
   await page.goto('/en',{waitUntil:'commit'});
   await page.locator('#fire-learn').waitFor({state:'attached'});
   await expect(page.locator('html')).toHaveAttribute('data-media-js','');
   await page.evaluate(()=>dispatchEvent(new ErrorEvent('error',{message:'controlled early bootstrap fallback'})));
   await expect(page.locator('html')).not.toHaveAttribute('data-media-js');scripts();
   await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated'));
   const trigger=page.locator(viewer==='charcoal'?'#fire-learn':'[data-technology-open]').first();await trigger.scrollIntoViewIfNeeded();await trigger.click();
   const dialog=page.locator(`#${viewer}-viewer`);await expect(dialog).toBeVisible();expect(extras).toEqual([]);
   story();await expect(page.locator('html')).toHaveAttribute('data-story-media-ready','');
   if(viewer==='charcoal')await expect(dialog.locator('.charcoal-art[data-charcoal-ready="true"]')).toHaveCount(12);
   else await expect(dialog).toHaveAttribute('aria-busy','false');
   await expect(page.locator('html')).not.toHaveAttribute('data-media-js');
  }finally{scripts();story();}
 });
}
