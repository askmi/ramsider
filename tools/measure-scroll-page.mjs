import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const phase=process.env.PHASE||'before',dir=`screenshots/scroll-incident/${phase}`,base=process.env.BASE_URL||'http://127.0.0.1:3190';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({args:['--mute-audio']}),context=await browser.newContext({viewport:{width:402,height:874},deviceScaleFactor:3,isMobile:true,hasTouch:true});
await context.addInitScript(()=>{
 const mute=e=>{if(e instanceof HTMLMediaElement){e.muted=true;e.volume=0;}};new MutationObserver(rs=>rs.forEach(r=>r.addedNodes.forEach(n=>{mute(n);n.querySelectorAll?.('video,audio').forEach(mute);}))).observe(document,{childList:true,subtree:true});
 window.__perf={lcp:0,cls:0,longTasks:[],frames:[]};new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__perf.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__perf.cls+=e.value;})).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__perf.longTasks.push(e.duration))).observe({type:'longtask',buffered:true});
});
const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];page.on('pageerror',e=>errors.push(e.message));
await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:4e6/8,uploadThroughput:1e6/8});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await page.goto(`${base}/en`);await page.waitForTimeout(5000);
const initial=await page.evaluate(()=>({timing:performance.getEntriesByType('navigation')[0].toJSON(),paint:performance.getEntriesByType('paint').map(e=>e.toJSON()),lcp:window.__perf.lcp,cls:window.__perf.cls,resources:performance.getEntriesByType('resource').map(e=>({type:e.initiatorType,path:new URL(e.name).pathname,bytes:e.encodedBodySize,transfer:e.transferSize})),readyImages:document.querySelectorAll('img[data-media-ready]').length,overflow:document.documentElement.scrollWidth>innerWidth}));
await page.evaluate(()=>{window.__perf.scrolling=true;const f=()=>{window.__perf.frames.push({t:performance.now(),y:scrollY});if(window.__perf.scrolling)requestAnimationFrame(f);};requestAnimationFrame(f);});
for(let i=0;i<8;i++){
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:750}]});
 for(let y=690;y>120;y-=60){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y}]});await page.waitForTimeout(12);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(300);
}
await page.waitForTimeout(500);const scroll=await page.evaluate(()=>{window.__perf.scrolling=false;return window.__perf;});
const intervals=scroll.frames.slice(1).map((f,i)=>f.t-scroll.frames[i].t).sort((a,b)=>a-b),moving=scroll.frames.slice(1).filter((f,i)=>f.y!==scroll.frames[i].y),reverse=scroll.frames.slice(1).filter((f,i)=>f.y<scroll.frames[i].y-1);
const summary={phase,conditions:'Single cold Chromium mobile402×874DPR3,4Mbps100ms,CPU4;8actualCDPtouchswipes. Not physical Safari/fieldINP/Lighthouse/causal latency proof.',initial:{ttfb:initial.timing.responseStart-initial.timing.startTime,fcp:initial.paint.find(e=>e.name==='first-contentful-paint')?.startTime,lcp:initial.lcp,cls:initial.cls,jsBytes:initial.resources.filter(r=>r.type==='script').reduce((a,r)=>a+r.bytes,0),completedBytes:initial.resources.reduce((a,r)=>a+r.bytes,0),filmObjects:initial.resources.filter(r=>r.path.startsWith('/films/')).length,readyImages:initial.readyImages},scroll:{samples:intervals.length,movingFrames:moving.length,startY:scroll.frames[0]?.y,endY:scroll.frames.at(-1)?.y,p95Ms:intervals[Math.ceil(intervals.length*.95)-1],over33Ms:intervals.filter(t=>t>33).length,reverseFrames:reverse.length,maxReverse:Math.max(0,...reverse.map(f=>{const i=scroll.frames.indexOf(f);return scroll.frames[i-1].y-f.y;})),cls:scroll.cls,longTasks:scroll.longTasks},errors};
writeFileSync(`${dir}/performance.json`,JSON.stringify({summary,initial,scroll},null,2));console.log(JSON.stringify(summary,null,2));await context.close();await browser.close();
