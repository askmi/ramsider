import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch(),results=[];
for(const throttled of [false,true]){
 const context=await browser.newContext({viewport:{width:402,height:874},deviceScaleFactor:3,isMobile:true,hasTouch:true}),page=await context.newPage(),cdp=await context.newCDPSession(page);
 page.setDefaultTimeout(120000);
 if(throttled){await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:500000,uploadThroughput:125000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})}
 await page.addInitScript(()=>{
  window.__perf={lcp:0,cls:0,useful:null};new PerformanceObserver(l=>{for(const e of l.getEntries())window.__perf.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__perf.cls+=e.value}).observe({type:'layout-shift',buffered:true});const observer=new MutationObserver(()=>{const e=document.querySelector('.page-media-shell');if(e&&!e.hasAttribute('data-media-blocked')&&window.__perf.useful===null)window.__perf.useful=performance.now()});observer.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-media-blocked']});
 });
 await page.goto('http://127.0.0.1:3057/en');await page.waitForFunction(()=>document.documentElement.hasAttribute('data-media-hydrated')&&!document.querySelector('.page-media-overlay'));await page.waitForTimeout(100);
 const initial=await page.evaluate(()=>({...window.__perf,jsBytes:performance.getEntriesByType('resource').filter(e=>e.initiatorType==='script').reduce((s,e)=>s+e.transferSize,0),networkBytes:performance.getEntriesByType('resource').reduce((s,e)=>s+e.transferSize,0),earlyTouchRequests:performance.getEntriesByType('resource').filter(e=>e.name.includes('/touch-')).length}));
 const trigger=page.locator('[data-technology-open]').first();await trigger.scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.page-media-overlay'));await trigger.click();const v=page.locator('#technology-viewer');const ready=()=>page.waitForFunction(()=>document.querySelector('#technology-viewer')?.getAttribute('aria-busy')==='false');await ready();
 for(let i=0;i<4;i++){await v.locator('footer button').last().click();await ready()}
 for(let i=0;i<2;i++){await v.locator('header button').nth(1).click();await ready()}
 let nativeScroll=null;
 if(!throttled){
  await page.setViewportSize({width:402,height:600});
  const frames=page.evaluate(async()=>{const f=[];let last=performance.now();for(let i=0;i<200;i++)await new Promise(r=>requestAnimationFrame(n=>{if(i)f.push(n-last);last=n;r()}));f.sort((a,b)=>a-b);return {samples:f.length,p95:f[Math.floor(f.length*.95)],over33:f.filter(n=>n>33).length}});
  for(let turn=0;turn<4;turn++){const start=turn%2?200:380,delta=turn%2?140:-140;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:220,y:start}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:220,y:start+delta*i/10}]});await new Promise(r=>setTimeout(r,16))}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
  nativeScroll=await frames;
 }
 const assets=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/touch-')).map(e=>({path:new URL(e.name).pathname,bytes:e.encodedBodySize,duration:e.duration})));
 results.push({conditions:throttled?'cold Chromium402 DPR3 4Mbps100ms4xCPU':'cold Chromium402 DPR3 loopback',initial,assets,nativeScroll,inp:'unmeasured',lighthouse:'unmeasured'});await context.close();
}
await browser.close();await writeFile('docs/evidence/technology-discrete/touchlink-performance.json',JSON.stringify(results,null,2)+'\n');console.log(results.map(r=>({conditions:r.conditions,initial:r.initial,nativeScroll:r.nativeScroll})));
