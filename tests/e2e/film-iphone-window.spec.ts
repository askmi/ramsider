import {test,expect,type Page} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {silenceTestMedia} from './silent-media';
import {revealFilmTop} from './film-reveal-top';

test.use({serviceWorkers:'block'});
test.setTimeout(180000);
const out='screenshots/video/iphone-window';
test.beforeEach(async({page},info)=>{
 test.skip(!info.project.name.includes('iphone'),'Actual iPhone WebKit web layer; native API calls below are explicitly adapters');
 await silenceTestMedia(page);await mkdir(out,{recursive:true});
});
async function open(page:Page,locale='en',query=''){
 await page.goto(`/${locale}${query}`);await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();await page.locator('.film-gallery__item').nth(2).click();await page.locator('.film-gallery__hero').click();
 await expect(page.locator('#film-player')).toHaveAttribute('data-controls','ready');
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:30000}).toBeGreaterThan(.2);
}
async function settleMenu(page:Page){
 await expect.poll(()=>page.locator('.film-settings').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
 await page.locator('.film-settings').evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})));});
}
async function seek(page:Page,time:number){
 await page.locator('video').evaluate((v:HTMLVideoElement,t)=>{v.pause();v.currentTime=t;},time);
 await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>!v.seeking&&v.readyState>=2&&v.videoWidth>0),{timeout:30000}).toBe(true);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
async function nativeAdapter(page:Page,pending=false){
 await page.evaluate(pending=>{
  const v=document.querySelector('video')!;let active=false,enters=0,exits=0;
  const begin=()=>{active=true;v.dispatchEvent(new Event('webkitbeginfullscreen'));};
  const end=()=>{active=false;exits++;v.dispatchEvent(new Event('webkitendfullscreen'));};
  Object.defineProperties(v,{
   webkitSupportsFullscreen:{configurable:true,value:true},
   webkitDisplayingFullscreen:{configurable:true,get:()=>active},
   webkitEnterFullscreen:{configurable:true,value:()=>{enters++;if(!pending)begin();}},
   webkitExitFullscreen:{configurable:true,value:end},
  });
  Object.assign(window,{iphoneNativeProbe:{get enters(){return enters;},get exits(){return exits;},get active(){return active;},begin,end}});
 },pending);
}
async function nativeState(page:Page){return page.evaluate(()=>{
 const p=(window as unknown as {iphoneNativeProbe:{enters:number;exits:number;active:boolean}}).iphoneNativeProbe;
 return {enters:p.enters,exits:p.exits,active:p.active};
});}
async function endNative(page:Page){await page.evaluate(()=>(window as unknown as {iphoneNativeProbe:{end:()=>void}}).iphoneNativeProbe.end());}

test('original fullscreen fills actual iPhone viewport and Evolution aperture through rotation and shortened Safari heights',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await open(page);await nativeAdapter(page);await page.locator('.film-fullscreen').click();
 const max=info.project.name.includes('max');const sizes=max?[[440,956],[440,650],[956,440],[956,350]]:[[402,874],[402,650],[874,402],[874,326],[390,844],[844,390]];
 const observations=[];
 for(const [width,height]of sizes){await page.setViewportSize({width,height});for(const time of[10,109]){
  await seek(page,time);
  const g=await page.locator('video').evaluate((v:HTMLVideoElement)=>{
   const h=v.closest('media-controller')!,b=h.getBoundingClientRect(),r=v.getBoundingClientRect();const scale=Math.max(r.width/v.videoWidth,r.height/v.videoHeight);
   const top=r.top+(r.height-v.videoHeight*scale)/2;const left=r.left+(r.width-v.videoWidth*scale)/2;
   return {host:{x:b.x,y:b.y,w:b.width,h:b.height},viewport:{w:innerWidth,h:innerHeight,dpr:devicePixelRatio},aperture:{left,right:left+v.videoWidth*scale,top:top+v.videoHeight*98/720*scale,bottom:top+v.videoHeight*624/720*scale},fit:getComputedStyle(v).objectFit,decoded:[v.videoWidth,v.videoHeight],native:!!document.fullscreenElement,src:v.currentSrc,muted:v.muted,volume:v.volume};
  });
  expect(g.viewport.dpr).toBe(3);expect(g.viewport.w).toBe(width);expect(g.host.x).toBeCloseTo(0);expect(g.host.y).toBeCloseTo(0);expect(g.host.w).toBeCloseTo(width);expect(g.host.h).toBeCloseTo(height);
  expect(g.fit).toBe('cover');expect(g.native).toBe(false);expect(g.aperture.left).toBeLessThanOrEqual(1);expect(g.aperture.right).toBeGreaterThanOrEqual(width-1);expect(g.aperture.top).toBeLessThanOrEqual(1);expect(g.aperture.bottom).toBeGreaterThanOrEqual(height-1);expect(g.muted).toBe(true);expect(g.volume).toBe(0);
  await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');
  await page.screenshot({path:`${out}/${info.project.name}-${width}x${height}-${time}.png`});observations.push({width,height,time,...g});
 }}
 expect((await nativeState(page)).enters).toBe(0);await page.keyboard.press('Escape');await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');await expect(page.locator('#product-film')).toHaveAttribute('open');await expect(page.locator('.film-fullscreen')).toBeFocused();
 await page.locator('.film-fullscreen').click();await page.locator('.film-player__close').click();await expect(page.locator('video')).not.toHaveAttribute('src');await expect(page.locator('#product-film')).not.toHaveAttribute('data-film-expanded');
 expect(errors).toEqual([]);await writeFile(`${out}/${info.project.name}-geometry.json`,JSON.stringify({observations,errors},null,2));
});

for(const urlOverride of[false,true])test(`native fallback ${urlOverride?'URL':'live settings'} keeps source/time and existing Apple lifecycle`,async({page},info)=>{
 await open(page,'en',urlOverride?'?iphonePlayer=native':'');await seek(page,10);await nativeAdapter(page);
 const before=await page.locator('video').evaluate((v:HTMLVideoElement)=>({src:v.currentSrc,time:v.currentTime}));
 if(!urlOverride){await page.locator('.film-fullscreen').click();await page.locator('.film-options__trigger').click();await expect(page.locator('.film-menu-native')).toBeVisible();await settleMenu(page);await page.screenshot({path:`${out}/${info.project.name}-native-menu.png`});await page.locator('.film-menu-native').click();}else await page.locator('.film-fullscreen').click();
 expect((await nativeState(page)).enters).toBe(1);await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');await expect(page.locator('#product-film')).not.toHaveAttribute('data-film-expanded');await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed','true');
 expect(await page.locator('video').evaluate((v:HTMLVideoElement)=>({src:v.currentSrc,time:v.currentTime}))).toEqual(before);
 await endNative(page);await expect(page.locator('.film-fullscreen')).toHaveAttribute('aria-pressed','false');await expect(page.locator('video')).toBeFocused();
 await revealFilmTop(page);await page.locator('.film-player__close').click();await page.locator('#film-play').click();await page.locator('.film-gallery__hero').click();await page.locator('.film-fullscreen').click();
 if(urlOverride)expect((await nativeState(page)).enters).toBe(2);else await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');
 await page.locator('#product-film').evaluate((d:HTMLDialogElement)=>d.close());await expect(page.locator('video')).not.toHaveAttribute('src');expect((await nativeState(page)).active).toBe(false);
});

test('window remains operational in English presentation: menu, quality, end/replay, list, adjacent films and reopen',async({page},info)=>{
 await open(page);await page.locator('.film-fullscreen').click();await expect(page.locator('#product-film')).toHaveAttribute('dir','ltr');
 await page.locator('.film-options__trigger').click();await page.locator('.film-menu-quality').click();await page.locator('#film-quality-options media-chrome-menu-item[value="1080"]').click();await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.videoHeight),{timeout:30000}).toBe(1080);
 await seek(page,112);await page.locator('video').evaluate((v:HTMLVideoElement)=>v.play());await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.ended),{timeout:15000}).toBe(true);await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');await page.screenshot({path:`${out}/${info.project.name}-en-end.png`});
 await page.locator('.film-ended__replay').click();await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.2);
 await revealFilmTop(page);await page.locator('.film-player__list-toggle').click();await expect(page.locator('.film-playlist')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.film-playlist')).toHaveCount(0);await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');
 await page.setViewportSize(info.project.name.includes('max')?{width:956,height:440}:{width:874,height:402});
 for(let index=0;index<7;index++){
  await revealFilmTop(page);await page.locator('.film-player__list-toggle').click();await page.locator('.film-playlist__item').nth(index).click();await page.locator('.film-playlist__item').nth(index).click();
  await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:30000}).toBeGreaterThan(.2);await seek(page,index===1?5:10);await page.screenshot({path:`${out}/${info.project.name}-film${index+1}.png`});
  await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');
 }
 await revealFilmTop(page);await page.locator('.film-player__close').click();await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');await page.locator('#film-play').click();await page.locator('.film-gallery__hero').click();await expect(page.locator('#product-film')).toHaveAttribute('data-view','playing');await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');
});

test('cancelled native fallback cannot reopen window or closed viewer',async({page})=>{
 await open(page);await nativeAdapter(page,true);await page.locator('.film-fullscreen').click();await page.locator('.film-options__trigger').click();await page.locator('.film-menu-native').click();await page.locator('#product-film').evaluate((d:HTMLDialogElement)=>d.close());
 await page.evaluate(()=>(window as unknown as {iphoneNativeProbe:{begin:()=>void}}).iphoneNativeProbe.begin());expect((await nativeState(page)).active).toBe(false);await expect(page.locator('#product-film')).not.toHaveAttribute('open');await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
});

test('native fallback supports keyboard activation and failure preserves usable playback',async({page})=>{
 await open(page);await seek(page,10);await nativeAdapter(page);await page.locator('.film-fullscreen').focus();await page.keyboard.press('Space');await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');await expect(page.locator('.film-fullscreen')).toBeFocused();await page.keyboard.press('Space');await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');await page.keyboard.press('Space');await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');
 await page.locator('.film-options__trigger').click();await page.locator('.film-menu-native').focus();await page.keyboard.press('Enter');expect((await nativeState(page)).enters).toBe(1);await endNative(page);
 await revealFilmTop(page);await page.locator('.film-fullscreen').click();await page.locator('.film-options__trigger').click();await page.locator('.film-menu-native').focus();await page.keyboard.press('Space');expect((await nativeState(page)).enters).toBe(2);await endNative(page);
 await page.locator('video').evaluate(v=>Object.defineProperty(v,'webkitEnterFullscreen',{configurable:true,value:()=>{throw new Error('Test rejection');}}));
 await revealFilmTop(page);await page.locator('.film-fullscreen').click();await page.locator('.film-options__trigger').click();await page.locator('.film-menu-native').click();await expect(page.locator('.film-control-message')).toBeVisible();await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
 await page.locator('.film-fullscreen').click();await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');await expect(page.locator('.film-control-message')).toBeHidden();
 await page.locator('video').evaluate((v:HTMLVideoElement)=>v.play());await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(10.1);
});

test('all eleven native action translations stay reachable in the real menu',async({page},info)=>{
 test.skip(info.project.name.includes('max'),'Localized menu sweep once on narrower Pro');
 await page.goto('/ar');test.skip(new URL(page.url()).pathname==='/en','Historical multilingual menu sweep disabled by English-only presentation; EN action is tested by entrypaths suite');
 for(const locale of['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']){
  await open(page,locale);await page.locator('.film-fullscreen').click();await page.locator('.film-options__trigger').click();const native=page.locator('.film-menu-native');await native.scrollIntoViewIfNeeded();await expect(native).toBeVisible();await settleMenu(page);expect((await native.innerText()).trim().length).toBeGreaterThan(4);
  expect(await native.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth+1&&r.height>=44;})).toBe(true);
  await page.screenshot({path:`${out}/${info.project.name}-menu-${locale}.png`});await page.locator('#product-film').evaluate((d:HTMLDialogElement)=>d.close());
 }
});

test('PiP transition releases window and returns inline before re-expansion',async({page})=>{
 await page.addInitScript(()=>{
  Object.defineProperty(document,'pictureInPictureEnabled',{configurable:true,value:false});
  Object.defineProperty(HTMLVideoElement.prototype,'webkitSupportsPresentationMode',{configurable:true,value:()=>true});
  Object.defineProperty(HTMLVideoElement.prototype,'webkitSetPresentationMode',{configurable:true,value:function(this:HTMLVideoElement,mode:string){Object.defineProperty(this,'webkitPresentationMode',{configurable:true,value:mode});this.dispatchEvent(new Event('webkitpresentationmodechanged'));}});
 });
 await open(page);await page.locator('.film-fullscreen').click();await page.locator('.film-options__trigger').click();await page.locator('.film-menu-pip').click();await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');await expect(page.locator('#product-film')).not.toHaveAttribute('data-film-expanded');
 await revealFilmTop(page);await page.locator('.film-fullscreen').click();await expect(page.locator('#film-player')).toHaveAttribute('data-full-window','true');expect(await page.locator('video').evaluate(v=>(v as HTMLVideoElement&{webkitPresentationMode:string}).webkitPresentationMode)).toBe('inline');
 await page.locator('#product-film').evaluate((d:HTMLDialogElement)=>d.close());expect(await page.locator('video').evaluate(v=>(v as HTMLVideoElement&{webkitPresentationMode:string}).webkitPresentationMode)).toBe('inline');
});

test('short window safe-area controls and last native menu action stay visible and clickable',async({page},info)=>{
 const landscape=info.project.name.includes('max')?{width:956,height:350}:{width:874,height:326};
 for(const size of[{width:info.project.name.includes('max')?440:402,height:650},landscape]){
  await page.setViewportSize(size);await page.emulateMedia({reducedMotion:'reduce'});await open(page,'en');await nativeAdapter(page);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));if(!await page.locator('#film-player').getAttribute('data-full-window'))await page.locator('.film-fullscreen').click();
  const portrait=size.width<size.height;
  await page.addStyleTag({content:`.film-player[data-full-window] .film-player__top{padding-top:${portrait?59:0}px!important;padding-left:${portrait?0:59}px!important;padding-right:${portrait?0:59}px!important}.film-player[data-full-window] .film-transport{padding-bottom:${portrait?34:21}px!important;padding-left:${portrait?0:59}px!important;padding-right:${portrait?0:59}px!important}`});
  await writeFile(`${out}/${info.project.name}-safe-${size.width}x${size.height}-geometry.json`,JSON.stringify(await page.evaluate(()=>({w:innerWidth,h:innerHeight,rects:['.film-player__top','.film-transport','.film-transport__row','.film-player__close','.film-fullscreen','.film-options__trigger'].map(selector=>{const el=document.querySelector(selector)!,s=getComputedStyle(el);return{selector,box:el.getBoundingClientRect().toJSON(),width:s.width,boxSizing:s.boxSizing,padding:s.padding};})})),null,2));
  for(const selector of['.film-player__close','.film-fullscreen','.film-options__trigger']){
   const r=await page.locator(selector).boundingBox();expect(r).not.toBeNull();expect(r!.x).toBeGreaterThanOrEqual(0);expect(r!.y).toBeGreaterThanOrEqual(0);expect(r!.x+r!.width).toBeLessThanOrEqual(size.width+1);expect(r!.y+r!.height).toBeLessThanOrEqual(size.height+1);
  }
  await page.locator('.film-options__trigger').click();await page.locator('.film-menu-native').scrollIntoViewIfNeeded();await settleMenu(page);
  expect(await page.locator('.film-menu-native').evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return el===hit||el.contains(hit);})).toBe(true);
  expect(await page.locator('#film-player').evaluate(el=>el.scrollTop)).toBe(0);
  await page.screenshot({path:`${out}/${info.project.name}-safe-${size.width}x${size.height}.png`});await page.locator('.film-menu-native').click();expect((await nativeState(page)).enters).toBe(1);await page.locator('#product-film').evaluate((d:HTMLDialogElement)=>d.close());
 }
});
