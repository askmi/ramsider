import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch();
const results=[];
for(const throttle of [false,true]){
 const context=await browser.newContext({viewport:{width:402,height:874},deviceScaleFactor:3,isMobile:true,hasTouch:true});
 const page=await context.newPage(),cdp=await context.newCDPSession(page);page.setDefaultTimeout(180000);
 if(throttle){await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:500000,uploadThroughput:125000});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
 await page.addInitScript(()=>{
  const perf={lcp:0,cls:0,useful:null};window.__charcoalPerf=perf;
  new PerformanceObserver(list=>{for(const e of list.getEntries())perf.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)perf.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
  const observer=new MutationObserver(()=>{const shell=document.querySelector('.page-media-shell');if(shell&&!shell.hasAttribute('data-media-blocked')&&perf.useful===null)perf.useful=performance.now();});observer.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-media-blocked']});
 });
 await page.goto('http://127.0.0.1:3070/en');await page.waitForFunction(()=>!document.querySelector('.page-media-overlay')&&document.documentElement.hasAttribute('data-media-hydrated'));
 await page.waitForTimeout(100);
 const initial=await page.evaluate(()=>({...window.__charcoalPerf,jsEncodedBodyBytes:performance.getEntriesByType('resource').filter(e=>e.initiatorType==='script').reduce((sum,e)=>sum+e.encodedBodySize,0),loadEventStart:performance.getEntriesByType('navigation')[0].loadEventStart}));
 await page.waitForFunction(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/art/charcoal/')).length===8);
 const assets=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/art/charcoal/')).map(e=>({path:new URL(e.name).pathname,start:e.startTime,end:e.responseEnd,encodedBodyBytes:e.encodedBodySize,duration:e.duration})));
 await page.locator('#fire-learn').scrollIntoViewIfNeeded();await page.waitForFunction(()=>!document.querySelector('.page-media-overlay'));
 const at=await page.evaluate(()=>performance.now());await page.locator('#fire-learn').click();await page.waitForFunction(()=>document.querySelectorAll('.charcoal-art[data-media-ready]').length===8);
 const ready=await page.evaluate(()=>performance.now());
 const framesPromise=page.evaluate(async()=>{const frames=[];let last=performance.now();for(let i=0;i<120;i++)await new Promise(r=>requestAnimationFrame(n=>{if(i)frames.push(n-last);last=n;r()}));frames.sort((a,b)=>a-b);return{samples:frames.length,p95:frames[Math.floor(frames.length*.95)],over33:frames.filter(n=>n>33).length};});
 const positions=[];
 for(let turn=0;turn<4;turn++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:210,y:680}]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:210,y:680-450*i/12}]});await new Promise(r=>setTimeout(r,16));}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  positions.push(await page.evaluate(()=>({scroll:document.querySelector('.charcoal-viewer__scroll').scrollTop,close:document.querySelector('.charcoal-viewer__close').getBoundingClientRect().toJSON()})));
 }
 const frames=await framesPromise;
 await page.screenshot({path:`screenshots/charcoal/native-touch-${throttle?'throttled':'loopback'}.png`,scale:'css'});
 await page.locator('.charcoal-viewer__close').click();
 results.push({conditions:throttle?'cold production Chromium402×874/DPR3 4Mbps100ms4xCPU, tech+charcoal warming enabled':'cold production Chromium402×874/DPR3 loopback, tech+charcoal warming enabled',initial,assets,warmCompleted:Math.max(...assets.map(a=>a.end)),warmOpenAutomationWallMs:ready-at,nativeScroll:positions,frames,inp:'not measured; automation wall timing is not INP',lighthouse:'not run',physicalSafari:'not available'});
 await context.close();console.log({throttle,initial,warmCompleted:Math.max(...assets.map(a=>a.end)),frames});
}
await browser.close();await writeFile('docs/evidence/charcoal/performance.json',JSON.stringify(results,null,2)+'\n');
