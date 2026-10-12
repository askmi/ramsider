import {expect,test} from '@playwright/test';
import sharp from 'sharp';
import {openTechnology} from './helpers/technology';

// Inspect the rendered transition itself: settled screenshots alone missed CHG0106.
test('photo and technology changes blend complete painted frames without moving the old frame',async({page},info)=>{
 test.skip(!info.project.name.includes('webkit'),'mobile painted-frame regression');
 await page.addInitScript(()=>{
  const original=Element.prototype.animate;
  Element.prototype.animate=function(...args){
   const animation=original.apply(this,args);
   if(this.classList.contains('technology-viewer__snapshot')){animation.pause();animation.currentTime=0;}
   return animation;
  };
 });
 await page.goto('/en');await openTechnology(page);
 const viewer=page.locator('#technology-viewer'),stage=viewer.locator('.technology-viewer__stage');
 await expect(viewer).toHaveAttribute('aria-busy','false');await page.evaluate(()=>document.fonts.ready);
 for(const kind of ['photo','technology']){
  const old=await stage.screenshot();
  await (kind==='photo'?viewer.locator('header button').nth(1):viewer.locator('footer button').last()).click();
  await expect(viewer).toHaveAttribute('aria-busy','false');
  const painting=viewer.locator('.technology-viewer__snapshot');await expect(painting).toHaveCount(1);
  const zero=await stage.screenshot();
  expect((await sharp(zero).raw().toBuffer()).equals(await sharp(old).raw().toBuffer())).toBe(true);
  await painting.evaluate(e=>{e.getAnimations()[0].currentTime=90;});
  const middle=await stage.screenshot({path:info.outputPath(`${kind}-middle.png`)});
  const state=await painting.evaluate(e=>({opacity:Number(getComputedStyle(e).opacity),decoded:[...e.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0),hidden:e.parentElement!.getAttribute('aria-hidden'),inert:(e.parentElement as HTMLElement).inert}));
  expect(state.opacity).toBeGreaterThan(0);expect(state.opacity).toBeLessThan(1);
  expect(state.decoded).toBe(true);expect(state.hidden).toBe('true');expect(state.inert).toBe(true);
  await painting.evaluate(e=>{e.getAnimations()[0].currentTime=180;});
  const next=await stage.screenshot();
  expect((await sharp(middle).raw().toBuffer()).equals(await sharp(old).raw().toBuffer())).toBe(false);
  expect((await sharp(middle).raw().toBuffer()).equals(await sharp(next).raw().toBuffer())).toBe(false);
  await painting.evaluate(e=>e.getAnimations()[0].finish());await expect(painting).toHaveCount(0);
 }
});
