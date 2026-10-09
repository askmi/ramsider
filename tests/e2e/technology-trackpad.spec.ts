import {expect,test} from '@playwright/test';
import {openTechnology} from './helpers/technology';

test.use({viewport:{width:1440,height:900},isMobile:false,hasTouch:false,deviceScaleFactor:2});
async function settleGesture(page: import('@playwright/test').Page) { await page.clock.runFor(220); }

test('native horizontal trackpad wheel switches groups once per gesture in English and Arabic',async({page},info)=>{
 await page.clock.install();
 for(const locale of ['en','ar']){
  await page.goto(`/${locale}`);await openTechnology(page);
  const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
  await viewer.locator('.technology-viewer__photo img').first().hover({position:{x:100,y:300}});
  const y=await page.evaluate(()=>scrollY); await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+1000);
  await page.mouse.wheel(-120,0);await expect(viewer).toHaveAttribute('data-group','CyberMind');await expect(viewer).toHaveAttribute('aria-busy','false');
  // Reversing within the same wheel burst must not undo the committed change.
  await page.mouse.wheel(120,0);await expect(viewer).toHaveAttribute('data-group','CyberMind');
  await settleGesture(page);await page.mouse.wheel(120,0);await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');
  await settleGesture(page);await page.mouse.wheel(120,0);await expect(viewer).toHaveAttribute('data-group','HeatCore');
  expect(await page.evaluate(()=>scrollY)).toBe(y);
  await page.clock.resume(); await page.screenshot({path:`${process.env.TECH_EVIDENCE ?? 'docs/evidence/technology-viewer/trackpad'}/${info.project.name}-${locale}.png`});
  await page.keyboard.press('Escape');
 }
});

test('small wheel deltas accumulate; vertical movement and pinch do not switch groups',async({page})=>{
 await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');const scroller=viewer.locator('.technology-viewer__scroll');await scroller.hover();
 await page.clock.install(); await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+1000);
 await page.mouse.wheel(-20,0);await expect(viewer).toHaveAttribute('data-group','HeatCore');await settleGesture(page);
 // Chromium protocol input atDPR2 reports half the requested CSS delta.
 await page.mouse.wheel(-40,0); await page.mouse.wheel(-60,0);await expect(viewer).toHaveAttribute('data-group','CyberMind');await expect(viewer).toHaveAttribute('aria-busy','false');
 await settleGesture(page);await page.mouse.wheel(30,300);await expect.poll(()=>scroller.evaluate(e=>e.scrollTop)).toBeGreaterThan(100);await expect(viewer).toHaveAttribute('data-group','CyberMind');
 await settleGesture(page);await page.keyboard.down('Control');await page.mouse.wheel(120,0);await page.keyboard.up('Control');await expect(viewer).toHaveAttribute('data-group','CyberMind');
 await settleGesture(page);await page.mouse.wheel(0,120);await page.mouse.wheel(120,0);await expect(viewer).toHaveAttribute('data-group','CyberMind');
 await page.clock.resume(); await viewer.locator('.technology-viewer__close').click();await openTechnology(page);await expect(viewer).toHaveAttribute('aria-busy','false');await scroller.hover();await page.mouse.wheel(-120,0);await expect(viewer).toHaveAttribute('data-group','CyberMind');
});

 test('horizontal wheel is locked while the next group loads and old pixels remain',async({page})=>{
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/art/technology/cybermind/02.png',async route=>{await gate;await route.continue();});
  try {
   await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');const scroller=viewer.locator('.technology-viewer__scroll');await scroller.hover();
   await page.mouse.wheel(-120,0);await expect(viewer).toHaveAttribute('aria-busy','true');await expect(viewer).toHaveAttribute('data-group','HeatCore');
   await page.mouse.wheel(120,0);await page.mouse.wheel(0,300);expect(await scroller.evaluate(e=>e.scrollTop)).toBe(0);await expect(viewer).toHaveAttribute('data-group','HeatCore');
   release();await expect(viewer).toHaveAttribute('data-group','CyberMind');await expect(viewer).toHaveAttribute('aria-busy','false');await expect(viewer.locator('.technology-viewer__photo img')).toHaveCount(2);
  } finally {release();}
 });

test('a tiny vertical lead-in does not cancel a horizontal two-finger gesture',async({page})=>{
 await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');await viewer.locator('.technology-viewer__photo img').first().hover({position:{x:100,y:300}});
 await page.clock.install();await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+1000);
 await page.mouse.wheel(0,2);await page.mouse.wheel(-120,4);await expect(viewer).toHaveAttribute('data-group','CyberMind');await expect(viewer).toHaveAttribute('aria-busy','false');
 await page.clock.runFor(220);await page.mouse.wheel(0,2);await page.mouse.wheel(120,4);await expect(viewer).toHaveAttribute('data-group','HeatCore');await page.clock.resume();
});
