import {test,expect} from '@playwright/test';
import {openTechnology} from './helpers/technology';
import {silenceTestMedia} from './silent-media';

test.beforeEach(async({page})=>silenceTestMedia(page));

test('native short-screen gestures navigate without pan; cancellation, RTL and boundaries hold',async({browser,baseURL},info)=>{
 test.skip(info.project.name!=='desktop-chromium','CDP native touch input');test.setTimeout(90000);
 for(const width of [402,440,1024])for(const locale of ['en','ar']){
  const context=await browser.newContext({viewport:{width,height:width===1024?650:560},isMobile:true,hasTouch:true,deviceScaleFactor:3,reducedMotion:'reduce'});
  await silenceTestMedia(context);const page=await context.newPage(),driver=await context.newCDPSession(page);
  await page.goto(`${baseURL}/${locale}`);await openTechnology(page);const v=page.locator('#technology-viewer'),s=v.locator('.technology-viewer__scroll');
  const ready=()=>expect(v).toHaveAttribute('aria-busy','false');await ready();
  const swipe=async(dy:number,dx=0,cancel=false)=>{for(let i=0;i<=6;i++){await driver.send('Input.dispatchTouchEvent',{type:i?'touchMove':'touchStart',touchPoints:[{x:200+dx*i/6,y:280+dy*i/6}]});}await driver.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});};
  const fit=async()=>{expect(await s.evaluate(e=>e.scrollHeight-e.clientHeight)).toBeLessThanOrEqual(1);expect(await s.evaluate(e=>e.scrollTop)).toBe(0);};
  await expect(s).toHaveCSS('touch-action','pinch-zoom');await fit();await swipe(32);await expect(v).toHaveAttribute('data-group','NobleCraft');
  await swipe(-32);await ready();await expect(v).toHaveAttribute('data-group','HeatCore');await fit();
  await swipe(32);await ready();await expect(v).toHaveAttribute('data-group','NobleCraft');
  await swipe(-32,0,true);await expect(v).toHaveAttribute('data-group','NobleCraft');
  await swipe(-40,40);await expect(v).toHaveAttribute('data-group','NobleCraft');await fit();
  await driver.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:280},{x:220,y:280}]});await driver.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:160,y:250},{x:240,y:250}]});await driver.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(v).toHaveAttribute('data-group','NobleCraft');
  await swipe(0,-32);await ready();await expect(v).toHaveAttribute('data-photo-index','1');
  await swipe(0,-32);await expect(v).toHaveAttribute('data-photo-index','1');
  for(let i=0;i<9;i++){await v.locator('footer button').last().click();await ready();await fit();}await swipe(-32);await expect(v).toHaveAttribute('data-group','PolyArmor');
  await page.keyboard.press('Escape');await expect(v).not.toBeVisible();await context.close();
 }
});

test('WebKit fitted-slide lifecycle, cancellation and reduced motion',async({page},info)=>{
 test.skip(!info.project.name.includes('webkit'),'mobile WebKit lifecycle');
 await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:info.project.name.includes('max')?440:402,height:560});await page.goto('/en');await openTechnology(page);const v=page.locator('#technology-viewer'),s=v.locator('.technology-viewer__scroll');await expect(v).toHaveAttribute('aria-busy','false');
 const swipe=async(dy:number,cancel=false)=>s.evaluate((e,{dy,cancel})=>{
  const t=(y:number)=>({identifier:7,target:e,clientX:200,clientY:y});
  const send=(name:string,y:number,end=false)=>{const event=new Event(name,{bubbles:true,cancelable:true});Object.defineProperties(event,{touches:{value:end?[]:[t(y)]},changedTouches:{value:[t(y)]}});e.dispatchEvent(event);};
  send('touchstart',280);for(let i=1;i<=4;i++)send('touchmove',280+dy*i/4);send(cancel?'touchcancel':'touchend',280+dy,true);
 },{dy,cancel});
 await swipe(-32,true);await expect(v).toHaveAttribute('data-group','NobleCraft');
 for(const group of ['HeatCore','CapsuleCode','CyberMind','TouchLink','MoodEngine','AquaSense','AirShield','QuickCell','PolyArmor']){await swipe(-32);await expect(v).toHaveAttribute('data-group',group);await expect(v).toHaveAttribute('aria-busy','false');expect(await s.evaluate(e=>e.scrollHeight-e.clientHeight)).toBeLessThanOrEqual(1);expect(await s.evaluate(e=>e.scrollTop)).toBe(0);}
 await swipe(-32);await expect(v).toHaveAttribute('data-group','PolyArmor');await swipe(32);await expect(v).toHaveAttribute('data-group','QuickCell');await expect(v).toHaveAttribute('aria-busy','false');await page.keyboard.press('Escape');await expect(v).not.toBeVisible();
});

test('native pinch stays available on a height-fitted picture',async({browser,baseURL},info)=>{
 test.skip(info.project.name!=='desktop-chromium','CDP native pinch');
 const context=await browser.newContext({viewport:{width:440,height:560},deviceScaleFactor:3,isMobile:true,hasTouch:true});await silenceTestMedia(context);const page=await context.newPage(),driver=await context.newCDPSession(page);
 await page.goto(`${baseURL}/en`);await openTechnology(page);const v=page.locator('#technology-viewer');await expect(v).toHaveAttribute('aria-busy','false');
 const scale=await page.evaluate(()=>visualViewport!.scale);await driver.send('Input.synthesizePinchGesture',{x:220,y:260,scaleFactor:1.5,relativeSpeed:400,gestureSourceType:'touch'});await expect.poll(()=>page.evaluate(()=>visualViewport!.scale)).toBeGreaterThan(scale);
 await expect(v).toHaveAttribute('data-group','NobleCraft');await expect(v).toHaveAttribute('data-photo-index','0');await page.keyboard.press('Escape');await context.close();
});
