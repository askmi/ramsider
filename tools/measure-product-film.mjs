// Repeatable project-specific HLS network benchmark. Chromium/CDP emulation;
// does not certify physical iPhone/Android performance. About six minutes.
import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
const evidencePath=resolve(process.env.HLS_EVIDENCE??'test-results/product-film-network.json');
const browser=await chromium.launch({args:['--mute-audio']});
try {
const context=await browser.newContext({viewport:{width:402,height:874},deviceScaleFactor:3,isMobile:true,hasTouch:true});
await context.addInitScript(()=>{Object.defineProperty(HTMLMediaElement.prototype,'muted',{get(){return true},set(){},configurable:true});Object.defineProperty(HTMLMediaElement.prototype,'volume',{get(){return 0},set(){},configurable:true});});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const allMedia=[];const ids=new Set();let bytes=0;
cdp.on('Network.requestWillBeSent',e=>{if(e.request.url.includes('/films/')){ids.add(e.requestId);allMedia.push(e.request.url);}});
cdp.on('Network.dataReceived',e=>{if(ids.has(e.requestId))bytes+=e.dataLength;});
const network=Mbps=>cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:Mbps*1000000/8,uploadThroughput:1000000,connectionType:'cellular4g'});
await page.goto(process.env.HLS_BASE_URL??'http://127.0.0.1:3000/en');await page.evaluate(()=>document.fonts.ready);
await page.waitForFunction(()=>document.querySelectorAll('.art img:not([data-media-ready])').length===0,{},{timeout:50000});
await page.locator('#film-play').scrollIntoViewIfNeeded();await page.waitForTimeout(600);
const beforeIntent=allMedia.length;const startup=[];const full=[];
async function probe(){
 await page.locator('#film-play').click();
 const startingBytes=bytes;
 await page.evaluate(()=>{
  const v=document.querySelector('video');const p={start:0,firstFrameMs:null,firstPlayingMs:null,events:[],qualities:[],stop:false,frame:0};window.__filmProbe=p;
  const quality=()=>{const previous=p.qualities.at(-1);if(v.videoHeight&&previous?.height!==v.videoHeight)p.qualities.push({ms:performance.now()-p.start,time:v.currentTime,height:v.videoHeight});};
  const frame=()=>{if(p.stop||window.__filmProbe!==p)return;if(p.firstFrameMs===null)p.firstFrameMs=performance.now()-p.start;quality();p.frame=v.requestVideoFrameCallback(frame);};
  const handler=e=>{if(p.stop||!p.start)return;if(e.type==='playing'&&p.firstPlayingMs===null)p.firstPlayingMs=performance.now()-p.start;p.events.push({event:e.type,ms:performance.now()-p.start,time:v.currentTime,height:v.videoHeight});};
  for(const name of ['waiting','playing','pause','ended','error'])v.addEventListener(name,handler);
  p.cleanup=()=>{p.stop=true;if(p.frame)v.cancelVideoFrameCallback(p.frame);for(const name of ['waiting','playing','pause','ended','error'])v.removeEventListener(name,handler);};
  document.querySelector('.film-gallery__hero').addEventListener('click',()=>{p.start=performance.now();p.frame=v.requestVideoFrameCallback(frame);},{once:true});
 });
 await page.locator('.film-gallery__hero').click();
 await page.waitForFunction(()=>window.__filmProbe.firstFrameMs!==null,{},{timeout:20000});
 return startingBytes;
}
async function finish(startingBytes){
 const result=await page.evaluate(()=>{
  const p=window.__filmProbe,v=document.querySelector('video');p.cleanup();
  return {firstFrameMs:p.firstFrameMs,firstPlayingMs:p.firstPlayingMs,events:p.events,qualities:p.qualities,contentTime:v.currentTime,ended:v.ended,buffered:Array.from({length:v.buffered.length},(_,i)=>[v.buffered.start(i),v.buffered.end(i)]),playback:v.dataset.playback};
 });
 result.mediaReceivedBytes=bytes-startingBytes;
 await page.locator('.film-player__top button').last().click();
 await page.waitForFunction(()=>{const v=document.querySelector('video');return !v.hasAttribute('src')&&v.paused&&v.networkState===0;});
 result.stalls=result.events.filter(e=>e.event==='waiting'&&e.ms>result.firstPlayingMs+100&&e.time>.1);
 return result;
}
for(const rate of [1,4,10]){
 await network(rate);const trials=[];
 for(let i=0;i<20;i++){
  const start=await probe();await page.waitForTimeout(250);const r=await finish(start);trials.push(r.firstFrameMs);
 }
 const sorted=[...trials].sort((a,b)=>a-b);
 startup.push({rateMbps:rate,trials:trials.length,p50FirstFrameMs:sorted[Math.ceil(sorted.length*.5)-1],p95FirstFrameMs:sorted[Math.ceil(sorted.length*.95)-1],allFirstFrameMs:trials});
 console.log(JSON.stringify(startup.at(-1)));
}
for(const rate of [1,4,10]){
 await network(rate);const start=await probe();await page.waitForFunction(()=>document.querySelector('video').ended,{},{timeout:120000});
 const r=await finish(start);full.push({rateMbps:rate,...r});console.log(JSON.stringify({stableRate:rate,firstFrameMs:r.firstFrameMs,stalls:r.stalls.length,bytes:r.mediaReceivedBytes,qualities:r.qualities}));
}
await network(25);const start=await probe();await page.waitForTimeout(12000);await network(1);await page.waitForTimeout(23000);await network(25);
await page.waitForFunction(()=>document.querySelector('video').ended,{},{timeout:90000});
const adaptation=await finish(start);
const report={measuredAtUTC:new Date().toISOString(),conditions:'Production build; actual Chromium mobile emulation402x874DPR3;100msCDP; media HTTP cache disabled; site artwork decoded/library warmed before intent; repeated fresh HLS sessions on one page; no physical phone claim',browser:browser.version(),beforeIntentMediaRequests:beforeIntent,startup,stableFullPlayback:full,adaptation:{trajectory:'25Mbps for12s →1Mbps for23s →25Mbps toend',...adaptation},errors,limits:'Synthetic CDP delivery, not real wireless/cellular radio or nativeiOS;20sample p95 exploratory; downloadedbytes CDPdataLength excludes protocoloverhead'};
await mkdir(dirname(evidencePath),{recursive:true});await writeFile(evidencePath,JSON.stringify(report,null,2));
console.log('HLS performance run complete: '+evidencePath);
} finally { await browser.close(); }
