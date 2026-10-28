import {chromium,webkit} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';

// Silent, cold-navigation reproduction. Art holds are QA-only; films are untouched.
const phase=process.env.PHASE||'before',base=process.env.BASE_URL||'http://127.0.0.1:3190',reload=process.env.SCENARIO==='reload',nearDiagonal=process.env.SCENARIO==='near-diagonal',diagonal=process.env.SCENARIO==='diagonal'||nearDiagonal,tapFilm=process.env.SCENARIO==='tap-film',tap=process.env.SCENARIO==='tap'||tapFilm;
const dir=`screenshots/scroll-incident/${phase}`;mkdirSync(dir,{recursive:true});
const results=[];
for(const engine of ['chromium','webkit']){
 if((diagonal||tap)&&engine!=='chromium')continue;
 const browser=await ({chromium,webkit})[engine].launch(engine==='chromium'?{args:['--mute-audio']}:{});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:engine==='chromium',hasTouch:true,serviceWorkers:'block',recordVideo:{dir,size:{width:390,height:844}}});
 await context.addInitScript(()=>{
  const mute=(e)=>{if(e instanceof HTMLMediaElement){e.muted=true;e.volume=0;}};
  new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{mute(n);n.querySelectorAll?.('video,audio').forEach(mute);}))).observe(document,{childList:true,subtree:true});
  const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){mute(this);return play.call(this);};
  document.addEventListener('play',event=>mute(event.target),true);
  window.__scrollProbe={writes:[],frames:[],events:[]};
  const original=window.scrollTo;
  window.scrollTo=function(...args){const before=scrollY;const result=original.apply(this,args);window.__scrollProbe.writes.push({t:performance.now(),before,after:scrollY});return result;};
  window.addEventListener('scroll',()=>window.__scrollProbe.events.push({t:performance.now(),y:scrollY}),{passive:true});
  const sample=()=>{window.__scrollProbe.frames.push({t:performance.now(),y:scrollY});requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 const page=await context.newPage();let release;const hold=new Promise(resolve=>release=resolve);
 await page.route('**/art/**/*.webp',async route=>{if(route.request().resourceType()==='fetch'&&/\/art\/(?:0[4-9]|1[0-9])(?:[-.]|\.webp)/.test(new URL(route.request().url()).pathname))await hold;try{await route.continue();}catch{}});
 await page.goto(`${base}/es`);await page.locator('html[data-media-hydrated]').waitFor();await page.locator('img[data-original="/art/03.webp"][data-media-ready]').waitFor();await page.waitForTimeout(500);
 await page.evaluate(()=>{window.__scrollProbe.input=[];window.addEventListener('touchmove',event=>window.__scrollProbe.input.push({cancelable:event.cancelable,prevented:event.defaultPrevented,x:event.touches[0]?.clientX,y:event.touches[0]?.clientY}),{passive:true});});
 if(diagonal)await page.evaluate(()=>scrollTo({top:6000,behavior:'instant'}));
 if(reload){
  await page.route('**/_next/**/*.js',async route=>{await new Promise(resolve=>setTimeout(resolve,1500));try{await route.continue();}catch{}});
  await page.reload({waitUntil:'commit'});
 }else await page.screenshot({path:`${dir}/${engine}-initial.png`});
 let diagonalProgress=null,tapActivated=null,filmTap=null;
 if(engine==='chromium'){
  const cdp=await context.newCDPSession(page);
  if(tap){
   const control=page.locator(tapFilm?'#film-play':'[data-wellness-open]').first();await control.scrollIntoViewIfNeeded();const box=await control.boundingBox();if(!box)throw new Error('Native tap target is absent');
   if(tapFilm)await page.evaluate(()=>window.__qaFilmVideo=document.querySelector('video'));
   const x=box.x+box.width/2,y=box.y+box.height/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await page.waitForTimeout(40);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+2,y:y+1}]});await page.waitForTimeout(40);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.locator(tapFilm?'#product-film':'#wellness-viewer').waitFor({state:'visible'});tapActivated=true;
   if(tapFilm){
    const hero=page.locator('.film-gallery__hero');await hero.waitFor({state:'visible'});
    const idle=await page.locator('video').evaluate(v=>({paused:v.paused,src:v.getAttribute('src')}));
    if(!idle.paused||idle.src!==null)throw new Error('Gallery opened with playback already active');
    const heroBox=await hero.boundingBox();if(!heroBox)throw new Error('Gallery Play target is absent');
    const hx=heroBox.x+heroBox.width/2,hy=heroBox.y+heroBox.height/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:hx,y:hy}]});await page.waitForTimeout(40);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(()=>{const v=document.querySelector('video');return v.currentTime>.1&&v.videoHeight>0;});filmTap=await page.evaluate(()=>{const v=document.querySelector('video');return {sameVideo:v===window.__qaFilmVideo,time:v.currentTime,height:v.videoHeight,muted:v.muted,volume:v.volume,paused:v.paused,error:!!v.error};});if(!filmTap.sameVideo||!filmTap.muted||filmTap.volume!==0||filmTap.error)throw new Error('Native film tap failed same-player/silent contract');
   }
  }else if(diagonal){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:730}]});
   const initial=nearDiagonal?[[217,706],[244,682],[271,658]]:[[192,727],[192,690],[370,670]];
   for(const [x,y] of initial){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await page.waitForTimeout(60);}
   const before=await page.evaluate(()=>scrollY);
   const continuation=nearDiagonal?[[298,634],[325,610],[352,586]]:[[370,600],[370,500],[370,400],[370,200]];
   for(const [x,y] of continuation){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await page.waitForTimeout(40);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
   diagonalProgress={before,after:await page.evaluate(()=>scrollY)};
   if(diagonalProgress.after<=before)throw new Error('Vertical progress froze after native diagonal touch');
  }else for(let swipe=0;swipe<16;swipe++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:730}]});
   for(let y=650;y>=90;y-=80){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y}]});await page.waitForTimeout(8);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(400);
  }
 }else{
  await page.mouse.move(190,500);for(let i=0;i<16;i++){await page.mouse.wheel(0,1800);await page.waitForTimeout(400);}
 }
 await page.waitForTimeout(700);await page.screenshot({path:`${dir}/${engine}-pending.png`});
 const probe=await page.evaluate(()=>({...window.__scrollProbe,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},pending:document.querySelectorAll('img[data-media]:not([data-media-ready])').length}));
 const rewinds=probe.writes.filter(w=>w.after<w.before-1),reverseFrames=probe.frames.slice(1).flatMap((f,i)=>f.y<probe.frames[i].y-1?[{before:probe.frames[i],after:f}]:[]);
 const result={engine,phase,reload,diagonalProgress,nearDiagonal,tapActivated,filmTap,reloadScriptDelayMs:reload?1500:0,recording:await page.video().path(),realInput:engine==='chromium'?'CDP native touch':'native wheel (desktop WebKit at phone size)',rewindCount:rewinds.length,maxRewind:Math.max(0,...rewinds.map(w=>w.before-w.after)),reverseFrameCount:reverseFrames.length,maxReverseFrame:Math.max(0,...reverseFrames.map(w=>w.before.y-w.after.y)),finalY:probe.frames.at(-1)?.y,probe};
 writeFileSync(`${dir}/${engine}-trace.json`,JSON.stringify(result,null,2));results.push({...result,probe:undefined});
 release();await context.close();await browser.close();
}
writeFileSync(`${dir}/summary.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
