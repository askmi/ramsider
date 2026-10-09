import {expect,test,type Locator} from '@playwright/test';
import {openTechnology} from './helpers/technology';

async function appearance(status:Locator) {
 return status.evaluate(el=>{
  const css=getComputedStyle(el),track=getComputedStyle(el.querySelector('[role=progressbar]')!),bar=getComputedStyle(el.querySelector('.media-loading__bar')!);
  return {width:el.getBoundingClientRect().width,color:css.color,background:css.backgroundColor,padding:css.padding,font:css.font,borderWidth:css.borderWidth,trackHeight:track.height,trackColor:track.backgroundColor,barColor:bar.backgroundColor,opacity:bar.opacity,animation:bar.animationName};
 });
}

test('main and gallery share loading appearance, RTL and reduced motion',async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{
   const decode=HTMLImageElement.prototype.decode;
   const qa=window as Window & {releaseSharedDecode?:()=>void};
   const gate=new Promise<void>(resolve=>{qa.releaseSharedDecode=resolve;});
   HTMLImageElement.prototype.decode=async function(){await decode.call(this);if(new URL(this.currentSrc||this.src).pathname==='/art/00.webp')await gate;};
  });
 for(const locale of ['en','ar']){
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  const hold='**/art/technology/slides/noble-01.png';await page.route(hold,async route=>{await gate;await route.continue().catch(()=>{});});
  await page.goto(`/${locale}`);
  const main=page.locator('.page-media-overlay .media-loading');await expect(main).toBeVisible();
  const reference=await appearance(main);
  expect(reference).toMatchObject({color:'rgb(255, 255, 255)',background:'rgb(24, 21, 18)',padding:'0px',borderWidth:'0px',trackHeight:'4px',trackColor:'rgb(214, 208, 199)',barColor:'rgb(140, 92, 37)',opacity:'1',animation:'none'});
  expect(reference.width).toBe(Math.min((info.project.use.viewport?.width??1440)-48,420));
  await expect(main.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  await page.evaluate(()=>(window as Window &{releaseSharedDecode?:()=>void}).releaseSharedDecode?.());
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  try {
   await openTechnology(page);const viewer=page.locator('#technology-viewer'),status=viewer.locator('.media-loading');await expect(status).toBeVisible();
   expect(await appearance(status)).toEqual(reference);await expect(status).toHaveAttribute('aria-live','polite');
   if(locale==='ar')await expect(status).toHaveAttribute('dir','rtl');
   await expect(status.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
   await page.screenshot({path:`${process.env.LOADING_EVIDENCE??'docs/evidence/loading-shared/final'}/${info.project.name}-${locale}-pending.png`});
   release();await expect(viewer).toHaveAttribute('aria-busy','false');await expect(status).toHaveCount(0);await page.keyboard.press('Escape');
  } finally {release();await page.unroute(hold);}
 }
});
