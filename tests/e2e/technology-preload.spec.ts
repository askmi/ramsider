import {test,expect,type Page} from '@playwright/test';
import {technologyGroups} from '../../lib/technology-gallery';
import {openTechnology} from './helpers/technology';
import {mkdir,writeFile} from 'node:fs/promises';
const photos=technologyGroups.flatMap(g=>g.slides.map(s=>s.src));
const evidence='screenshots/technology-preload';
test.beforeEach(async()=>{await mkdir(evidence,{recursive:true})});
type Trace={requests:{src:string;priority:string;hero:boolean;main:boolean;state:string;at:number}[];decoded:string[]};
declare global {interface Window {__preloadTrace:Trace}}
async function trace(page:Page){
 await page.addInitScript(()=>{
  const target=window;target.__preloadTrace={requests:[],decoded:[]};const original=window.fetch;
  window.fetch=(input,init)=>{const src=typeof input==='string'?input:input instanceof URL?input.pathname:input.url;if(src.includes('/art/technology/slides/'))target.__preloadTrace.requests.push({src,priority:(init as RequestInit &{priority?:string})?.priority??'auto',hero:!!document.querySelector('img[data-media-ready][src="/art/00.webp"]'),main:document.documentElement.hasAttribute('data-page-artwork-warming'),state:document.readyState,at:performance.now()});return original(input,init)};
  const decode=HTMLImageElement.prototype.decode;HTMLImageElement.prototype.decode=function(){return decode.call(this).then(()=>{if(this.dataset.source)target.__preloadTrace.decoded.push(this.dataset.source)})};
 });
}
const read=(page:Page)=>page.evaluate(()=>(window).__preloadTrace);
test('cold entry automatically preloads all photos serially after hero and main kickoff',async({page},info)=>{
 test.skip(!info.project.name.includes('webkit'),'mobile baseline');test.setTimeout(120000);await trace(page);await mkdir(evidence,{recursive:true});
 let releaseHero!:()=>void,releaseMain!:()=>void,releaseFirst!:()=>void,releaseLoad!:()=>void;
 const hero=new Promise<void>(r=>releaseHero=r),main=new Promise<void>(r=>releaseMain=r),first=new Promise<void>(r=>releaseFirst=r),load=new Promise<void>(r=>releaseLoad=r);const mainRequests:string[]=[];
 page.on('request',r=>{if(/\/art\/\d\d\.webp/.test(r.url()))mainRequests.push(new URL(r.url()).pathname)});
 await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const image=new Image();image.hidden=true;image.src='/__test_load_barrier.png';document.body.append(image)},{once:true}));
 await page.route('**/__test_load_barrier.png',async r=>{await load;await r.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1sAAAAASUVORK5CYII=','base64')})});
 await page.route('**/art/00.webp',async r=>{await hero;await r.continue()});await page.route('**/art/01.webp',async r=>{await main;await r.continue()});await page.route(`**${photos[0]}`,async r=>{await first;await r.continue()});
 try{
  await page.goto('/en',{waitUntil:'domcontentloaded'});await expect(page.locator('html')).toHaveAttribute('data-media-hydrated','');await page.waitForTimeout(150);expect((await read(page)).requests).toEqual([]);await expect(page.locator('html')).not.toHaveAttribute('data-page-artwork-warming','');
  releaseHero();await expect(page.locator('img[data-media][src="/art/00.webp"]')).toHaveAttribute('data-media-ready','');await expect.poll(async()=>(await read(page)).requests.length).toBe(1);await page.waitForTimeout(150);const held=await read(page);expect(held.requests.map(r=>r.src)).toEqual([photos[0]]);expect(held.requests[0]).toMatchObject({hero:true,main:true,priority:'auto',state:'interactive'});expect(mainRequests).toContain('/art/01.webp');expect(await page.locator('img[data-media]').evaluateAll(images=>images.every(i=>(i as HTMLImageElement).fetchPriority==='high'))).toBe(true);
  releaseFirst();await expect.poll(async()=>(await read(page)).decoded.length,{timeout:60000}).toBe(photos.length);const warmed=await read(page);expect(warmed.requests.map(r=>r.src)).toEqual(photos);expect(warmed.decoded).toEqual(photos);expect(warmed.requests.map(r=>r.priority)).toEqual(photos.map((_,i)=>i<technologyGroups[0].slides.length?'auto':'low'));expect(warmed.requests.every(r=>r.hero&&r.main)).toBe(true);expect(await page.evaluate(()=>document.readyState)).toBe('interactive');expect(await page.evaluate(()=>scrollY)).toBe(0);expect(await page.locator('dialog[open]').count()).toBe(0);
  releaseMain();releaseLoad();await expect(page.locator('.page-media-overlay')).not.toBeVisible();await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${evidence}/${info.project.name}-ready-main.png`});await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');await page.screenshot({path:`${evidence}/${info.project.name}-ready-first.png`});for(let i=0;i<technologyGroups.length-1;i++){await viewer.locator('footer button').last().click();await expect(viewer).toHaveAttribute('aria-busy','false')}await expect(viewer).toHaveAttribute('data-group','PolyArmor');await page.screenshot({path:`${evidence}/${info.project.name}-ready-last.png`});expect((await read(page)).requests).toEqual(warmed.requests);await page.keyboard.press('Escape');
  await writeFile(`${evidence}/${info.project.name}-ordered.json`,JSON.stringify({mainRequests,trace:warmed,allPhotos:photos,requestsAfterOpen:(await read(page)).requests.length},null,2));
 }finally{releaseHero();releaseMain();releaseFirst();releaseLoad()}
});
test('failed optional preload continues and an early viewer opening retries the original URL',async({page},info)=>{
 test.skip(!info.project.name.includes('webkit'),'mobile cache path');await trace(page);let attempts=0;await page.route(`**${photos[0]}`,async r=>{if(!attempts++)await r.fulfill({status:503,body:'temporary failure'});else await r.continue()});await page.goto('/ar');await expect.poll(async()=>(await read(page)).requests.length,{timeout:60000}).toBe(photos.length);await expect.poll(async()=>(await read(page)).decoded.length,{timeout:60000}).toBe(photos.length-1);await expect(page.locator('.page-media-overlay')).not.toBeVisible();await openTechnology(page);await expect(page.locator('#technology-viewer')).toHaveAttribute('aria-busy','false');const t=await read(page);expect(t.requests.map(r=>r.src)).toEqual([...photos,photos[0]]);expect(attempts).toBe(2);await page.screenshot({path:`${evidence}/${info.project.name}-arabic-retry.png`});await writeFile(`${evidence}/${info.project.name}-error.json`,JSON.stringify(t,null,2));
});
test('on-demand selected photo bypasses a held background queue without duplicate transfers',async({page},info)=>{
 test.skip(!info.project.name.includes('webkit'),'mobile demand path');await trace(page);let release!:()=>void;const held=new Promise<void>(r=>release=r);await page.route(`**${photos[1]}`,async r=>{await held;await r.continue()});
 try{await page.goto('/en');await expect.poll(async()=>(await read(page)).requests.length).toBe(2);await openTechnology(page);const v=page.locator('#technology-viewer');await expect(v).toHaveAttribute('aria-busy','false');await v.locator('footer button').last().click();await expect(v).toHaveAttribute('aria-busy','false');await expect(v).toHaveAttribute('data-group','HeatCore');const demand=await read(page);expect(demand.requests.map(r=>r.src)).toEqual([photos[0],photos[1],photos[2]]);expect(demand.requests.at(-1)?.priority).toBe('auto');release();await expect.poll(async()=>(await read(page)).decoded.length,{timeout:60000}).toBe(photos.length);const final=await read(page);expect(final.requests.filter(r=>r.src===photos[2])).toHaveLength(1);expect(new Set(final.requests.map(r=>r.src)).size).toBe(photos.length);await writeFile(`${evidence}/${info.project.name}-demand.json`,JSON.stringify(final,null,2));}finally{release()}
});
