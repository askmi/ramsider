import {webkit} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const phase=process.env.PHASE||'before',dir=`screenshots/scroll-incident/${phase}`,base=process.env.BASE_URL||'http://127.0.0.1:3190';mkdirSync(dir,{recursive:true});
const browser=await webkit.launch(),rows=[];
for(const [name,width,height] of [['pro',402,874],['max',440,956]]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await context.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){this.muted=true;this.volume=0;return play.call(this);};new MutationObserver(rs=>rs.forEach(r=>r.addedNodes.forEach(n=>{if(n instanceof HTMLMediaElement){n.muted=true;n.volume=0;}}))).observe(document,{childList:true,subtree:true});});
 const page=await context.newPage();await page.goto(`${base}/en`);await page.waitForFunction(()=>[...document.querySelectorAll('.canvas img[data-media]')].every(i=>i.hasAttribute('data-media-ready')));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
 const metrics=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth}));
 for(const [label,sourceY] of [['hero',0],['reference',2400],['middle',16000],['late',24000]]){
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),sourceY*width/941);await page.waitForTimeout(150);const y=await page.evaluate(()=>scrollY);
  await page.screenshot({path:`${dir}/${name}-${label}.png`,scale:'css'});rows.push({name,label,sourceY,y,...metrics});
 }
 await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`${dir}/${name}-full.png`,fullPage:true,scale:'css'});await context.close();
}
await browser.close();writeFileSync(`${dir}/visual-metrics.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
