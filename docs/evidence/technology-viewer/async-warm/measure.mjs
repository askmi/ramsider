import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch();
const results=[];
for (const [name,slow,enabled] of [['local-warm',false,true],['4mbps-warm',true,true],['4mbps-baseline',true,false]]) {
 const context=await browser.newContext({viewport:{width:402,height:874},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({enabled})=>{
  window.__qa={lcp:0,cls:0,images:[]};
  new PerformanceObserver(l=>{for(const e of l.getEntries())window.__qa.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__qa.cls+=e.value}).observe({type:'layout-shift',buffered:true});
  const setSrc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src').set;
  window.Image=new Proxy(window.Image,{construct(target,args){const image=Reflect.construct(target,args);window.__qa.images.push(image);if(!enabled)Object.defineProperty(image,'src',{set(value){if(!/\/technology\/0[2-5]\.png$/.test(value))setSrc.call(image,value)}});return image}});
 },{enabled});
 if(slow){const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:500000,uploadThroughput:125000});}
 await page.goto('http://127.0.0.1:3021/en',{waitUntil:'load',timeout:120000});
 const first=await page.evaluate(()=>({lcpMs:window.__qa.lcp,cls:window.__qa.cls,fcpMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,loadMs:performance.getEntriesByType('navigation')[0].loadEventEnd,ttfbMs:performance.getEntriesByType('navigation')[0].responseStart}));
 const scroll=await page.evaluate(async()=>{let last=performance.now();const frames=[];for(let i=0;i<120;i++){await new Promise(resolve=>requestAnimationFrame(now=>{if(i)frames.push(now-last);last=now;scrollTo(0,i*(document.documentElement.scrollHeight-innerHeight)/119);resolve()}))}frames.sort((a,b)=>a-b);return{p95Ms:frames[Math.floor(frames.length*.95)],over33Ms:frames.filter(x=>x>33).length}});
 let warm=null;
 if(enabled){await page.waitForFunction(()=>window.__qa.images.filter(i=>/\/technology\/0[2-5]\.png$/.test(i.src)&&i.complete&&i.naturalWidth===941).length===4,{},{timeout:120000});
 warm=await page.evaluate(async()=>{await Promise.all(window.__qa.images.map(i=>i.decode()));const photos=performance.getEntriesByType('resource').filter(e=>/\/technology\/0[2-5]\.png$/.test(e.name));return{readyMs:performance.now(),requests:photos.map(e=>({url:e.name.split('/').pop(),start:e.startTime,end:e.responseEnd,bytes:e.transferSize})),totalBytes:photos.reduce((s,e)=>s+e.transferSize,0)}});
 await page.evaluate(()=>document.querySelector('[data-technology-open]').click());await page.locator('#technology-viewer img').evaluateAll(async images=>{await Promise.all(images.map(i=>i.decode()));await document.fonts.ready;});
 const ready=await page.evaluate(async()=>{const times=[];for(const button of document.querySelectorAll('.technology-viewer__dots button')){const start=performance.now();button.click();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const image=document.querySelector('.technology-viewer__stage img');await image.decode();times.push(performance.now()-start)}return times});warm.switchMs=ready;
 }
 const resources=await page.evaluate(()=>({jsBytes:performance.getEntriesByType('resource').filter(e=>e.initiatorType==='script').reduce((s,e)=>s+e.transferSize,0),cls:window.__qa.cls}));
 results.push({name,...first,scroll,warm,...resources,errors});console.log(JSON.stringify(results.at(-1)));await context.close();
}
await writeFile('docs/evidence/technology-viewer/async-warm/performance.json',JSON.stringify(results,null,2));await browser.close();
