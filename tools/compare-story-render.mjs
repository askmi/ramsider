import {webkit,devices} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {PNG} from 'pngjs';import pixelmatch from 'pixelmatch';
const browser=await webkit.launch();const out='screenshots/feed-seams/comparison';await mkdir(out,{recursive:true});const results=[];
for(const [name,width,height,device] of [['pro',402,874,'iPhone 17 Pro'],['max',440,956,'iPhone 17 Pro Max']]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:devices[device].userAgent,serviceWorkers:'block',reducedMotion:'reduce'});const page=await context.newPage();
 await page.goto('http://127.0.0.1:3190/en');await page.waitForFunction(()=>document.documentElement.hasAttribute('data-story-media-ready'),null,{timeout:90000});await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(async()=>{
  const main=[...Array.from({length:9},(_,i)=>({name:String(i).padStart(2,'0'),top:i?i*2800-2:0})),{name:'09-10',top:25198}];
  const tail=[{name:'09-10',top:25198-28207},{name:'11',top:30798-28207}];
  await Promise.all([['.art',main],['.tail-art',tail]].flatMap(([selector,items])=>items.map(async ({name,top})=>{const img=document.createElement('img');img.src=`/art/${name}.webp`;img.className='comparison-legacy';Object.assign(img.style,{position:'absolute',left:'0',top:`calc(${top}/941*100cqw)`,width:'100%',height:'auto',visibility:'hidden'});document.querySelector(selector).append(img);await img.decode();})));
 });
 for(const y of (process.env.COMPARE_POINTS ? process.env.COMPARE_POINTS.split(",").map(Number) : [1850,2800,3360,4800,5600,6580,8400,9720,11200,11580,14000,14990,16520,18180,20000,22400,24300,25200,26620,28970,30720])){
  const tail=y>=28207;await page.evaluate(({y,tail})=>{const root=document.querySelector(tail?'.tail-art':'.art');scrollTo({top:root.getBoundingClientRect().top+scrollY+(y-(tail?28207:0))*root.getBoundingClientRect().width/941-innerHeight/2,behavior:'instant'});},{y,tail});await page.waitForTimeout(80);
  const current=await page.screenshot();
  await page.locator('.comparison-legacy').evaluateAll(imgs=>imgs.forEach(i=>i.style.visibility='visible'));
  const previous=await page.screenshot();await page.locator('.comparison-legacy').evaluateAll(imgs=>imgs.forEach(i=>i.style.visibility='hidden'));
  const a=PNG.sync.read(current),b=PNG.sync.read(previous),diff=new PNG({width:a.width,height:a.height});const changed=pixelmatch(a.data,b.data,diff.data,a.width,a.height,{threshold:.1,includeAA:false});
  results.push({name,y,changed,percent:100*changed/(a.width*a.height)});
  if(process.env.COMPARE_POINTS || [2800,3360,8400,14990,26620,28970,30720].includes(y)){await writeFile(`${out}/${name}-${y}-new.png`,current);await writeFile(`${out}/${name}-${y}-old.png`,previous);await writeFile(`${out}/${name}-${y}-diff.png`,PNG.sync.write(diff));}
 }
 console.log(name,'max pixel percent',Math.max(...results.filter(r=>r.name===name).map(r=>r.percent)).toFixed(3));await context.close();
}
await browser.close();await writeFile(`${out}/results${process.env.COMPARE_POINTS ? "-focused" : ""}.json`,JSON.stringify(results,null,2));
