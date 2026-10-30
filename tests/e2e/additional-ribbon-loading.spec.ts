import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
test.use({serviceWorkers:'block',reducedMotion:'reduce'});
test('Wellness uses complete photos in pending/mixed states and preserves all edge geometry after recovery',async({page},info)=>{
 test.setTimeout(90000);test.skip(!info.project.name.includes('iphone'),'mobile artwork evidence');
 await mkdir('screenshots/additional-ribbons/wellness',{recursive:true});let release!:()=>void;const held=new Promise<void>(r=>release=r);
 await page.route('**/art/wellness/*.webp',async route=>{if(/03-botanicals|02-water/.test(route.request().url()))await held;try{await route.continue();}catch{}});
 try{
  await page.goto('/en');await page.locator('[data-wellness-open]').first().evaluate((e:HTMLElement)=>e.click());await page.evaluate(()=>document.fonts.ready);
  const images=page.locator('.wellness-photo img[data-media]');await expect(images).toHaveCount(4);await expect(images.nth(0)).toHaveAttribute('data-media-ready','',{timeout:30000});await expect(images.nth(2)).toHaveAttribute('data-media-ready','',{timeout:30000});
  for(const i of [1,3]){await expect(images.nth(i)).toHaveAttribute('data-preview','ready');await expect(images.nth(i)).not.toHaveAttribute('data-media-ready');}
  const before=await page.locator('.wellness-photo').evaluateAll(es=>es.map(e=>({top:(e as HTMLElement).offsetTop,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})));
  for(let i=0;i<4;i++)for(const edge of ['top','bottom']){await page.locator('.wellness-scroll').evaluate((e,y)=>e.scrollTop=Math.max(0,y-200),before[i].top+(edge==='bottom'?before[i].height:0));await page.waitForTimeout(70);await page.screenshot({path:`screenshots/additional-ribbons/wellness/${info.project.name}-${i}-${edge}-mixed.png`});}
  release();await expect(page.locator('.wellness-photo img[data-media-ready]')).toHaveCount(4,{timeout:30000});
  expect(await page.locator('.wellness-photo').evaluateAll(es=>es.map(e=>({top:(e as HTMLElement).offsetTop,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})))).toEqual(before);
  await page.locator('.wellness-close').click();await expect(page.locator('#wellness-viewer')).not.toBeVisible();
 }finally{release();}
});
test('Charcoal section texture feathers only toward pending neighbors and restores sharp ready rendering',async({page},info)=>{
 test.setTimeout(60000);test.skip(!info.project.name.includes('iphone'),'mobile artwork evidence');let release!:()=>void;const held=new Promise<void>(r=>release=r);
 await page.route('**/art/charcoal/v2-2-0.webp',async route=>{await held;try{await route.continue();}catch{}});
 try{
  await page.goto('/en');await page.locator('[data-charcoal-open]').first().evaluate((e:HTMLElement)=>e.click());const upper=page.locator('.charcoal-section--1 .charcoal-art[data-media]').last(),lower=page.locator('.charcoal-section--2 .charcoal-art[data-media]').first();
  await page.locator('.charcoal-viewer__scroll').evaluate(e=>e.scrollTop=600);await expect(upper).toHaveAttribute('data-media-ready','',{timeout:30000});await expect(lower).toHaveAttribute('data-preview','ready');
  await expect.poll(()=>upper.evaluate(e=>getComputedStyle(e).maskImage)).toContain('linear-gradient');const before=await page.locator('.charcoal-ribbon').evaluate(e=>e.getBoundingClientRect().height);
  release();await expect(lower).toHaveAttribute('data-media-ready','',{timeout:30000});await expect.poll(()=>upper.evaluate(e=>getComputedStyle(e).maskImage)).toBe('none');expect(await page.locator('.charcoal-ribbon').evaluate(e=>e.getBoundingClientRect().height)).toBe(before);
 }finally{release();}
});
