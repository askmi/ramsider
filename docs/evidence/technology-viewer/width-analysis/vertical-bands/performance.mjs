import { chromium } from '@playwright/test';
import { writeFile, stat } from 'node:fs/promises';
const baseURL = 'http://127.0.0.1:3024';
const sources = ['/art/technology/02.png','/art/technology/03.png','/art/technology/cybermind/01.png','/art/technology/cybermind/02.png','/art/technology/04.png','/art/technology/05.png'];
const browser = await chromium.launch();
const results = [];
async function ready(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(() => !document.querySelector('.page-media-overlay'));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
for (const throttled of [false, true]) {
  const context = await browser.newContext({ viewport:{width:402,height:874},deviceScaleFactor:3,isMobile:true,hasTouch:true });
  const page = await context.newPage();
  if (throttled) {
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', { offline:false,latency:100,downloadThroughput:500000,uploadThroughput:125000 });
    await client.send('Emulation.setCPUThrottlingRate', { rate:4 });
  }
  await page.addInitScript(() => {
    window.__mediaQA = { lcp:0,lcpElement:null,cls:0,longTasks:[],useful:null };
    new PerformanceObserver(list => { for (const e of list.getEntries()) { window.__mediaQA.lcp=e.startTime;window.__mediaQA.lcpElement={tag:e.element?.tagName,className:e.element?.className,url:e.url}; } }).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) window.__mediaQA.cls+=e.value; }).observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(list => { for (const e of list.getEntries()) window.__mediaQA.longTasks.push(e.duration); }).observe({type:'longtask',buffered:true});
    const observer = new MutationObserver(() => {
      const shell = document.querySelector('.page-media-shell');
      if (shell && !shell.hasAttribute('data-media-blocked') && window.__mediaQA.useful===null) window.__mediaQA.useful=performance.now();
    });
    observer.observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-media-blocked']});
  });
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL+'/en',{waitUntil:'load'});
  await ready(page);
  const initial = await page.evaluate(() => {
    const entries=performance.getEntriesByType('resource');
    const nav=performance.getEntriesByType('navigation')[0];
    return {...window.__mediaQA,ttfbMs:nav.responseStart,fcpMs:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,loadEnd:nav.loadEventEnd,
      mainResources:entries.filter(e=>e.name.includes('/art/')&&!e.name.includes('/technology/')).map(e=>({url:new URL(e.name).pathname,start:e.startTime,end:e.responseEnd,bytes:e.encodedBodySize})),
      jsTransferBytes:entries.filter(e=>e.initiatorType==='script').reduce((sum,e)=>sum+e.transferSize,0),
      transferBytes:entries.reduce((sum,e)=>sum+e.transferSize,0)};
  });
  await page.waitForFunction(() => performance.getEntriesByType('resource').filter(e=>e.name.includes('/art/technology/')&&e.initiatorType==='fetch').length===6,null,{timeout:120000});
  const warm = await page.evaluate(() => performance.getEntriesByType('resource').filter(e=>e.name.includes('/art/technology/')&&e.initiatorType==='fetch').map(e=>({url:new URL(e.name).pathname,start:e.startTime,end:e.responseEnd,bytes:e.encodedBodySize})));
  await page.waitForFunction(() => [...document.querySelectorAll('img[data-media]')].every(i=>i.hasAttribute('data-media-ready')),null,{timeout:120000});
  const trigger=page.locator('[data-technology-open]').first();
  await trigger.scrollIntoViewIfNeeded();await ready(page);
  await page.evaluate(() => document.addEventListener('click', event => { if (event.target.closest?.('[data-technology-open]')) window.__viewerClick = performance.now(); }, { capture:true }));
  await trigger.click();
  await page.waitForFunction(()=>document.querySelector('#technology-viewer[open]')?.getAttribute('aria-busy')==='false');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const cachedOpenMs=await page.evaluate(()=>performance.now()-window.__viewerClick);
  await page.waitForFunction(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/art/technology/')&&e.initiatorType==='fetch').length===6,null,{timeout:120000});
  const all=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/art/technology/')&&e.initiatorType==='fetch').map(e=>({url:new URL(e.name).pathname,start:e.startTime,end:e.responseEnd,bytes:e.encodedBodySize})));
  await page.setViewportSize({width:390,height:664});
  const innerScroll=await page.locator('.technology-viewer__scroll').evaluate(async element=>{
    const frames=[];let last=performance.now();const max=element.scrollHeight-element.clientHeight;
    for(let i=0;i<160;i++)await new Promise(resolve=>requestAnimationFrame(now=>{if(i)frames.push(now-last);last=now;element.scrollTo({top:i*max/159,behavior:'instant'});resolve();}));
    frames.sort((a,b)=>a-b);return{frames:frames.length,p95Ms:frames[Math.floor(frames.length*.95)],over33Ms:frames.filter(n=>n>33).length,scrollRange:max};
  });
  await page.locator('.technology-viewer__close').click();
  await page.setViewportSize({width:402,height:874});
  let scroll=null;
  {
    const height=await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
    for(let y=0;y<=height;y+=700){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await ready(page);}
    scroll=await page.evaluate(async()=>{
      const frames=[];let last=performance.now();
      for(let i=0;i<160;i++)await new Promise(resolve=>requestAnimationFrame(now=>{if(i)frames.push(now-last);last=now;scrollTo({top:i*(document.documentElement.scrollHeight-innerHeight)/159,behavior:'instant'});resolve();}));
      frames.sort((a,b)=>a-b);return{frames:frames.length,p95Ms:frames[Math.floor(frames.length*.95)],over33Ms:frames.filter(n=>n>33).length};
    });
  }
  results.push({conditions:throttled?'Chromium mobile402x874 DPR3,4Mbps/100ms RTT setting,4xCPU, cold context':'Chromium mobile402x874 DPR3,unthrottled loopback,cold context',initial,warm,all,cachedOpenMs,innerScroll,scroll,errors,inp:'not measured; cachedOpen is a synthetic interaction latency, not INP'});
  console.log(JSON.stringify(results.at(-1)));
  await context.close();
}
const assetBytes=await Promise.all(sources.map(async src=>({src,bytes:(await stat('public'+src)).size})));
await writeFile('docs/evidence/technology-viewer/width-analysis/vertical-bands/performance.json',JSON.stringify({baseURL,assetBytes,results},null,2));
await browser.close();
