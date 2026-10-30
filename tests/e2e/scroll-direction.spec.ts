import {test,expect,type Page} from '@playwright/test';
import {silenceTestMedia} from './silent-media';
test.use({serviceWorkers:'block'});

test.beforeEach(async({page})=>silenceTestMedia(page));
const releases=new Set<()=>void>();
test.afterEach(()=>{releases.forEach(release=>release());releases.clear();});
async function pending(page:Page){
 let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);releases.add(release);
 await page.route('**/art/**/*.webp',async route=>{if(route.request().resourceType()==='fetch')await held;try{await route.continue();}catch{}});
 await page.goto('/en');await expect(page.locator('html')).toHaveAttribute('data-media-hydrated','');
 await expect(page.locator('img[data-original="/art/story-v2-01.webp"]')).toHaveAttribute('data-preview','ready');
 // Put pending art in view before exercising its event contract.
 await page.evaluate(()=>scrollTo({top:1600,behavior:'instant'}));await page.waitForTimeout(150);
 return release;
}
async function touch(page:Page,name:string,y=600,options:{cancelable?:boolean;count?:number;x?:number}={}){
 return page.locator('.canvas').evaluate((element,{name,y,options})=>{
  const event=new Event(name,{bubbles:true,cancelable:options.cancelable??true});
  Object.defineProperty(event,'touches',{value:Array.from({length:options.count??1},(_,i)=>({identifier:i,target:element,clientX:options.x??180+i*30,clientY:y}))});
  element.dispatchEvent(event);return event.defaultPrevented;
 },{name,y,options});
}
async function position(page:Page){return page.evaluate(()=>scrollY);}

test('native/external forward displacement is observed without a backward correction',async({page})=>{
 await pending(page);
 const trace=await page.evaluate(async()=>{
  scrollTo({top:1600,behavior:'instant'});const ys=[scrollY];
  for(let i=0;i<24;i++){await new Promise(requestAnimationFrame);ys.push(scrollY);}return ys;
 });
 expect(trace[0]).toBe(1600);expect(trace.every(y=>y===trace[0])).toBe(true);
});
test('old resisted animation cannot overwrite a newer native position',async({page})=>{
 await pending(page);await page.keyboard.press('PageDown');await page.waitForTimeout(50);
 const trace=await page.evaluate(async()=>{
  scrollTo({top:scrollY+1800,behavior:'instant'});const ys=[scrollY];
  for(let i=0;i<24;i++){await new Promise(requestAnimationFrame);ys.push(scrollY);}return ys;
 });
 expect(trace[0]).toBeGreaterThan(1800);expect(Math.min(...trace)).toBe(trace[0]);expect(Math.max(...trace)).toBe(trace[0]);
});
test('noncancelable wheel and touch never create a second movement',async({page})=>{
 await pending(page);const y=await position(page);
 await page.locator('.canvas').evaluate(element=>element.dispatchEvent(new WheelEvent('wheel',{bubbles:true,cancelable:false,deltaY:400})));
 await touch(page,'touchstart');expect(await touch(page,'touchmove',300,{cancelable:false})).toBe(false);
 await page.waitForTimeout(350);expect(await position(page)).toBe(y);
});
test('gesture begun native stays native when the pending frontier appears',async({page})=>{
 await pending(page);
 await page.locator('.canvas img[data-media]').evaluateAll(images=>images.forEach(i=>i.setAttribute('data-media-ready','')));
 await touch(page,'touchstart');
 await page.locator('.canvas img[data-media]:not([data-native-hero])').evaluateAll(images=>images.forEach(i=>i.removeAttribute('data-media-ready')));
 expect(await touch(page,'touchmove',300)).toBe(false);await page.waitForTimeout(250);expect(await position(page)).toBe(1600);
});
test('controlled gesture keeps one owner when originals finish during a swipe',async({page})=>{
 await pending(page);await touch(page,'touchstart');expect(await touch(page,'touchmove',500)).toBe(true);
 await page.locator('.canvas img[data-media]').evaluateAll(images=>images.forEach(i=>i.setAttribute('data-media-ready','')));
 expect(await touch(page,'touchmove',400)).toBe(true);await touch(page,'touchend',400,{count:0});await page.waitForTimeout(400);expect(await position(page)).toBeGreaterThan(0);
});
test('new contact and pinch cancel stale inertia without a snap',async({page})=>{
 await pending(page);await page.keyboard.press('PageDown');await page.waitForTimeout(60);await touch(page,'touchstart');
 const y=await position(page);await page.waitForTimeout(300);expect(await position(page)).toBe(y);
 expect(await touch(page,'touchmove',400)).toBe(true);await page.waitForTimeout(60);await touch(page,'touchmove',350,{count:2});
 const pinched=await position(page);await page.waitForTimeout(300);expect(await position(page)).toBe(pinched);
});
test('forward pending input makes monotonic progress and reverse is immediate',async({page})=>{
 await pending(page);await touch(page,'touchstart');const ys:number[]=[];
 for(let y=580;y>=300;y-=20){await touch(page,'touchmove',y);await page.waitForTimeout(20);ys.push(await position(page));}
 await touch(page,'touchend',300,{count:0});await page.waitForTimeout(250);ys.push(await position(page));
 expect(ys.at(-1)).toBeGreaterThan(1610);expect(ys.at(-1)).toBeLessThan(1900);expect(ys.every((y,i)=>i===0||y>=ys[i-1])).toBe(true);
 await page.keyboard.press('ArrowUp');expect(await position(page)).toBeLessThan(ys.at(-1)!);
});
test('missing preview bounds cancellable input without rewinding an existing position',async({page})=>{
 await pending(page);await page.locator('img[data-original="/art/story-v2-02.webp"]').evaluate((i:HTMLImageElement)=>i.src='data:image/webp;base64,AA==');
 await expect(page.locator('img[data-original="/art/story-v2-02.webp"]')).not.toHaveAttribute('data-preview','ready');
 await page.evaluate(()=>scrollTo({top:2000,behavior:'instant'}));await page.waitForTimeout(100);expect(await position(page)).toBe(2000);
 await page.keyboard.press('PageDown');await page.waitForTimeout(200);expect(await position(page)).toBe(2000);
 await page.keyboard.press('ArrowUp');expect(await position(page)).toBeLessThan(2000);
});
test('first tiny move reserves pending input without picking an axis; vertical ownership stays locked',async({page})=>{
 await pending(page);await touch(page,'touchstart');
 expect(await touch(page,'touchmove',600,{x:182})).toBe(true);
 expect(await position(page)).toBe(1600);
 await touch(page,'touchcancel',600,{count:0});await touch(page,'touchstart');
 expect(await touch(page,'touchmove',592,{x:189})).toBe(true);
 expect(await touch(page,'touchmove',570,{x:182})).toBe(true);
 expect(await touch(page,'touchmove',560,{x:350})).toBe(true);
 const before=await position(page);expect(await touch(page,'touchmove',460,{x:350})).toBe(true);
 await touch(page,'touchend',460,{count:0});await page.waitForTimeout(300);expect(await position(page)).toBeGreaterThan(before);
});
test('control taps keep native click handling and near-diagonal pending swipes keep moving',async({page})=>{
 await pending(page);const trigger=page.locator('[data-wellness-open]').first();
 const cancelled=await trigger.evaluate(element=>{
  const send=(name:string,x:number,y:number,end=false)=>{const event=new Event(name,{bubbles:true,cancelable:true});Object.defineProperty(event,'touches',{value:end?[]:[{identifier:1,target:element,clientX:x,clientY:y}]});element.dispatchEvent(event);return event.defaultPrevented;};
  send('touchstart',180,600);const cancelled=send('touchmove',182,599);send('touchend',182,599,true);return cancelled;
 });expect(cancelled).toBe(false);
 await touch(page,'touchstart');for(const [x,y] of [[189,592],[198,584],[216,568]])expect(await touch(page,'touchmove',y,{x})).toBe(true);
 await touch(page,'touchend',568,{count:0});await page.waitForTimeout(350);expect(await position(page)).toBeGreaterThan(1600);
 await trigger.click();await expect(page.locator('#wellness-viewer')).toBeVisible();
});
test('focused story controls obey scroll keys while preserving button activation',async({page})=>{
 await pending(page);
 const trigger=page.locator('[data-wellness-open]').first();await trigger.focus();
 const start=await page.locator('img[data-original="/art/story-v2-01.webp"]').evaluate(image=>image.getBoundingClientRect().top+scrollY);
 await page.evaluate(top=>scrollTo({top,behavior:'instant'}),start);await page.waitForTimeout(100);
 await trigger.press('PageDown');await page.waitForTimeout(350);const resisted=await position(page);
 expect(resisted).toBeGreaterThan(start);expect(resisted).toBeLessThan(start+await page.evaluate(()=>innerHeight)*.5);
 await page.locator('img[data-original="/art/story-v2-01.webp"]').evaluate((i:HTMLImageElement)=>i.src='data:image/webp;base64,AA==');
 await expect(page.locator('img[data-original="/art/story-v2-01.webp"]')).not.toHaveAttribute('data-preview','ready');
 const before=await position(page);await trigger.press('ArrowDown');await page.waitForTimeout(150);expect(await position(page)).toBe(before);
 await trigger.press('Space');await expect(page.locator('#wellness-viewer')).toBeVisible();
});
test('reserved first movement preserves horizontal input and technology boundary navigation',async({page})=>{
 await page.setViewportSize({width:402,height:560});await pending(page);await touch(page,'touchstart');
 expect(await touch(page,'touchmove',600,{x:230})).toBe(false);await touch(page,'touchend',600,{count:0});
 await page.locator('[data-technology-open]').first().evaluate((e:HTMLElement)=>e.click());
 const viewer=page.locator('#technology-viewer');await expect(viewer).toBeVisible();
 await expect(viewer.locator('img[data-media]')).toHaveAttribute('data-preview','ready');
 await viewer.locator('.technology-viewer__scroll').evaluate(element=>{
  element.scrollTop=element.scrollHeight;
  const send=(name:string,y:number,end=false)=>{const point={identifier:1,target:element,clientX:200,clientY:y};const event=new Event(name,{bubbles:true,cancelable:true});Object.defineProperties(event,{touches:{value:end?[]:[point]},changedTouches:{value:[point]}});element.dispatchEvent(event);return event.defaultPrevented;};
  send('touchstart',300);if(!send('touchmove',298))throw new Error('First pending movement was not reserved');
  send('touchmove',250);send('touchend',250,true);
 });
 await expect(viewer).toHaveAttribute('data-group','HeatCore');
});
