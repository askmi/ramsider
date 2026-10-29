import {expect,test} from '@playwright/test';
import {openTechnology} from './helpers/technology';
import {silenceTestMedia} from './silent-media';
test.use({serviceWorkers:'block'});
test.beforeEach(async({page})=>silenceTestMedia(page));

type NavigationProbe={ready:string[];cloneDecodes:number;clickAt:number;commitMs:number|null;loadingFrames:number;sampleUntil:number};
declare global {interface Window {navigationProbe?:NavigationProbe}}

// A ready destination must not wait on preparation of an outgoing frame.
test('warm photos switch without clone decoding or a painted loading flash',async({page},info)=>{
 test.skip(!info.project.name.includes('webkit'),'mobile navigation regression');
 await page.addInitScript(()=>{
  const w=window;
  const probe:NavigationProbe=w.navigationProbe={ready:[],cloneDecodes:0,clickAt:0,commitMs:null,loadingFrames:0,sampleUntil:0};
  const original=HTMLImageElement.prototype.decode;
  HTMLImageElement.prototype.decode=async function(){
   await original.call(this);
   if(!this.isConnected&&this.hasAttribute('alt')){
    probe.cloneDecodes++;
    await new Promise(resolve=>setTimeout(resolve,120));
   }
   if(this.dataset.source&&!probe.ready.includes(this.dataset.source))probe.ready.push(this.dataset.source);
  };
  document.addEventListener('click',event=>{
   const button=(event.target as Element)?.closest('button');
   if(button?.getAttribute('aria-label')!=='Next Slide')return;
   probe.clickAt=performance.now();probe.sampleUntil=probe.clickAt+300;
   const sample=()=>{
    if(document.querySelector('#technology-viewer .technology-viewer__loading'))probe.loadingFrames++;
    if(performance.now()<probe.sampleUntil)requestAnimationFrame(sample);
   };
   requestAnimationFrame(sample);
  },true);
  new MutationObserver(()=>{
   const viewer=document.querySelector('#technology-viewer');
   if(probe.clickAt&&probe.commitMs===null&&viewer?.getAttribute('data-photo-index')==='1'&&viewer.getAttribute('aria-busy')==='false')probe.commitMs=performance.now()-probe.clickAt;
  }).observe(document,{subtree:true,attributes:true,childList:true});
 });
 await page.goto('/en');await openTechnology(page);
 const viewer=page.locator('#technology-viewer');
 await expect(viewer).toHaveAttribute('aria-busy','false');
 await page.waitForFunction(()=>window.navigationProbe!.ready.includes('/art/technology/slides/noble-02.webp'));
 await expect(viewer.locator('.technology-viewer__loading')).toHaveCount(0);
 await viewer.getByRole('button',{name:'Next Slide',exact:true}).click();
 await expect(viewer).toHaveAttribute('data-photo-index','1');
 await expect(viewer).toHaveAttribute('aria-busy','false');
 await page.waitForFunction(()=>{const p=window.navigationProbe!;return p.clickAt>0&&performance.now()>p.sampleUntil;});
 const probe=await page.evaluate(()=>window.navigationProbe!);
 expect(probe.commitMs).not.toBeNull();
 expect(probe.commitMs!).toBeLessThan(100);
 expect(probe.loadingFrames).toBe(0);
 expect(probe.cloneDecodes).toBe(0);
 await expect(viewer.locator('.technology-viewer__photo img')).toHaveCount(1);
 expect(await viewer.locator('.technology-viewer__photo img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await page.screenshot({path:info.outputPath('warm-navigation.png')});
});
