import {test,expect} from '@playwright/test';
import {openTechnology} from './helpers/technology';

test('native tall-photo swipes scroll to an edge, then a new gesture changes technology',async({browser,baseURL},info)=>{
 test.skip(info.project.name!=='desktop-chromium','CDP native touch input');test.setTimeout(60000);
 for(const width of [402,440,1024])for(const locale of ['en','ar']){
  const context=await browser.newContext({viewport:{width:402,height:874},isMobile:true,hasTouch:true,deviceScaleFactor:3,reducedMotion:'reduce'}),page=await context.newPage(),driver=await context.newCDPSession(page);
  await page.goto(`${baseURL}/${locale}`);await openTechnology(page);const v=page.locator('#technology-viewer'),s=v.locator('.technology-viewer__scroll');
  const ready=()=>expect(v).toHaveAttribute('aria-busy','false');await ready();await page.setViewportSize({width,height:width===1024?650:560});
  const swipe=async(dy:number,dx=0,cancel=false)=>{for(let i=0;i<=6;i++){await driver.send('Input.dispatchTouchEvent',{type:i?'touchMove':'touchStart',touchPoints:[{x:200+dx*i/6,y:280+dy*i/6}]});await page.waitForTimeout(16);}await driver.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});};
  const edge=async(bottom:boolean)=>{await s.evaluate((e,bottom)=>e.scrollTop=bottom?e.scrollHeight:0,bottom);};
  await expect(s).toHaveCSS('touch-action','pinch-zoom');await swipe(32);await expect(v).toHaveAttribute('data-group','NobleCraft');
  await v.locator('footer button').last().click();await ready();await expect(v).toHaveAttribute('data-group','HeatCore');
  const reverse=async(bottom:boolean)=>{await edge(bottom);await driver.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:280}]});for(const d of (bottom?[80,30,-40]:[-80,-30,40])){await driver.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:280+d}]});await page.waitForTimeout(16);}await driver.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(v).toHaveAttribute('data-group','HeatCore');expect(await s.evaluate((e,b)=>Math.abs(e.scrollTop-(b?e.scrollHeight-e.clientHeight:0)),bottom)).toBeLessThan(1);};
  await reverse(false);await reverse(true);
  for(const bottom of [false,true]){await s.evaluate((e,b)=>e.scrollTop=b?e.scrollHeight-e.clientHeight-40:40,bottom);await driver.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:280}]});for(const d of (bottom?[-100,-60]:[100,60])){await driver.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:280+d}]});await page.waitForTimeout(16);}await driver.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(v).toHaveAttribute('data-group','HeatCore');const distance=await s.evaluate((e,b)=>b?e.scrollHeight-e.clientHeight-e.scrollTop:e.scrollTop,bottom);expect(distance).toBeGreaterThan(30);}
  await edge(false);await swipe(-40,40);await expect(v).toHaveAttribute('data-group','HeatCore');expect(await s.evaluate(e=>e.scrollTop)).toBeGreaterThan(30);
  await s.evaluate(e=>e.scrollTop=e.scrollHeight-e.clientHeight-40);await swipe(-100);
  await expect(v).toHaveAttribute('data-group','HeatCore');await expect.poll(()=>s.evaluate(e=>Math.abs(e.scrollTop-(e.scrollHeight-e.clientHeight)))).toBeLessThan(1);
  await page.screenshot({path:`/tmp/edge-native-${width}-${locale}-bottom.png`});
  await swipe(-32);await ready();await expect(v).toHaveAttribute('data-group','CapsuleCode');await expect(v).toHaveAttribute('data-photo-index','0');expect(await s.evaluate(e=>e.scrollTop)).toBe(0);
  await swipe(32);await ready();await expect(v).toHaveAttribute('data-group','HeatCore');
  await s.evaluate(e=>e.scrollTop=40);await swipe(100);await expect(v).toHaveAttribute('data-group','HeatCore');await expect.poll(()=>s.evaluate(e=>e.scrollTop)).toBe(0);
  await page.screenshot({path:`/tmp/edge-native-${width}-${locale}-top.png`});
  await swipe(32);await ready();await expect(v).toHaveAttribute('data-group','NobleCraft');
  await edge(true);await swipe(-32,0,true);await expect(v).toHaveAttribute('data-group','NobleCraft');
  await driver.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:280},{x:220,y:280}]});await driver.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:160,y:250},{x:240,y:250}]});await driver.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(v).toHaveAttribute('data-group','NobleCraft');
  await edge(false);await swipe(0,-32);await ready();await expect(v).toHaveAttribute('data-photo-index','1');
  for(let i=0;i<7;i++){await v.locator('footer button').last().click();await ready();}await edge(true);await swipe(-32);await expect(v).toHaveAttribute('data-group','AirShield');
  await page.keyboard.press('Escape');await expect(v).not.toBeVisible();await context.close();
 }
});

test('WebKit tall-photo edge snapshots, cancellation and reduced-motion pan',async({page},info)=>{
 test.skip(!info.project.name.includes('webkit'),'mobile WebKit lifecycle');
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/en');await openTechnology(page);const v=page.locator('#technology-viewer'),s=v.locator('.technology-viewer__scroll');await expect(v).toHaveAttribute('aria-busy','false');
 await page.screenshot({path:`/tmp/edge-${info.project.name}-normal.png`});await page.setViewportSize({width:info.project.name.includes('max')?440:402,height:560});
 const swipe=async(dy:number,cancel=false)=>s.evaluate((e,{dy,cancel})=>{
  const t=(y:number)=>({identifier:7,target:e,clientX:200,clientY:y});
  const send=(name:string,y:number,end=false)=>{const event=new Event(name,{bubbles:true,cancelable:true});Object.defineProperties(event,{touches:{value:end?[]:[t(y)]},changedTouches:{value:[t(y)]}});e.dispatchEvent(event);};
  send('touchstart',280);for(let i=1;i<=4;i++)send('touchmove',280+dy*i/4);send(cancel?'touchcancel':'touchend',280+dy,true);
 },{dy,cancel});
 await v.locator('footer button').last().click();await expect(v).toHaveAttribute('aria-busy','false');
 await s.evaluate(e=>e.scrollTop=e.scrollHeight-e.clientHeight-20);await swipe(-64);await expect(v).toHaveAttribute('data-group','HeatCore');
 await swipe(-32);await expect(v).toHaveAttribute('data-group','CapsuleCode');await expect(v).toHaveAttribute('aria-busy','false');
 await page.waitForTimeout(200);expect(await s.evaluate(e=>e.scrollTop)).toBe(0);
 for(const group of ['CyberMind','TouchLink','MoodEngine','AquaSense','AirShield']){await s.evaluate(e=>e.scrollTop=e.scrollHeight);await swipe(-32);await expect(v).toHaveAttribute('data-group',group);await expect(v).toHaveAttribute('aria-busy','false');await page.waitForTimeout(200);expect(await s.evaluate(e=>e.scrollTop)).toBe(0);}
 for(let i=0;i<5;i++){await v.locator('footer button').first().click();await expect(v).toHaveAttribute('aria-busy','false');}
 await page.screenshot({path:`/tmp/reset-${info.project.name}.png`});
 await swipe(32,true);await expect(v).toHaveAttribute('data-group','CapsuleCode');await swipe(32);await expect(v).toHaveAttribute('data-group','HeatCore');await expect(v).toHaveAttribute('aria-busy','false');
 await swipe(-40);await expect(v).toHaveAttribute('data-group','HeatCore');const top=await s.evaluate(e=>e.scrollTop);expect(top).toBeGreaterThan(0);await page.waitForTimeout(200);expect(await s.evaluate(e=>e.scrollTop)).toBe(top);
 await page.screenshot({path:`/tmp/edge-${info.project.name}-tall.png`});await page.keyboard.press('Escape');await expect(v).not.toBeVisible();
});

test('native inertia stops on a new contact, reduced motion disables it, pinch remains available',async({browser,baseURL},info)=>{
 test.skip(info.project.name!=='desktop-chromium','CDP native touch and pinch');
 const context=await browser.newContext({viewport:{width:440,height:560},deviceScaleFactor:3,isMobile:true,hasTouch:true}),page=await context.newPage(),driver=await context.newCDPSession(page);
 await page.goto(`${baseURL}/en`);await openTechnology(page);const v=page.locator('#technology-viewer'),s=v.locator('.technology-viewer__scroll');await expect(v).toHaveAttribute('aria-busy','false');
 const touch=(type:'touchStart'|'touchMove'|'touchEnd'|'touchCancel',y:number)=>driver.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x:220,y}]});
 const pan=async()=>{await touch('touchStart',280);for(let i=1;i<=4;i++){await touch('touchMove',280-i*8);await page.waitForTimeout(16);}await touch('touchEnd',248);};
 await pan();const released=await s.evaluate(e=>e.scrollTop);await expect.poll(()=>s.evaluate(e=>e.scrollTop)).toBeGreaterThan(released+1);
 await touch('touchStart',280);const stopped=await s.evaluate(e=>e.scrollTop);await page.waitForTimeout(100);expect(await s.evaluate(e=>e.scrollTop)).toBe(stopped);await touch('touchCancel',280);
 await page.emulateMedia({reducedMotion:'reduce'});await s.evaluate(e=>e.scrollTop=0);await pan();const still=await s.evaluate(e=>e.scrollTop);await page.waitForTimeout(100);expect(await s.evaluate(e=>e.scrollTop)).toBe(still);
 const scale=await page.evaluate(()=>visualViewport!.scale);await driver.send('Input.synthesizePinchGesture',{x:220,y:260,scaleFactor:1.5,relativeSpeed:400,gestureSourceType:'touch'});await expect.poll(()=>page.evaluate(()=>visualViewport!.scale)).toBeGreaterThan(scale);
 await expect(v).toHaveAttribute('data-group','NobleCraft');await page.keyboard.press('Escape');await context.close();
});
