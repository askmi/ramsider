import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openTechnology} from './helpers/technology';

test('six delivered photos exactly match current source PNGs',async()=>{
 const files=JSON.parse(await readFile('docs/evidence/technology-discrete/assets.json','utf8'));
 for(const file of files){const a=await readFile(file.source),b=await readFile(file.output);expect(a.equals(b)).toBe(true);expect(createHash('sha256').update(b).digest('hex')).toBe(file.sha256);}
});

test('photos move horizontally; technologies move vertically; source ratio and thin bars hold',async({page},info)=>{
 for(const locale of ['en','ar']){
  await page.goto(`/${locale}`);await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
  await expect(viewer).toHaveAttribute('data-group','NobleCraft');await expect(viewer.locator('article')).toHaveCount(1);
  const check=async()=>{
   const box=await viewer.locator('.technology-viewer__content').boundingBox();const image=await viewer.locator(".technology-viewer__photo img").boundingBox();expect(image!.height).toBeCloseTo(box!.height,0);const canvas=await page.locator(".canvas").boundingBox();expect(box!.width).toBeCloseTo(canvas!.width,0);const frame=await viewer.boundingBox();expect(frame!.x).toBeCloseTo(canvas!.x,0);expect(Math.abs(box!.height-box!.width*1522/941)).toBeLessThan(1);
   await expect(viewer.locator('.technology-viewer__toolbar--top')).toHaveCSS('height','48px');await expect(viewer.locator('.technology-viewer__toolbar--bottom')).toHaveCSS('height','48px');
  };
  await check();await page.keyboard.press('ArrowRight');await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');
  await page.keyboard.press('ArrowRight');await expect(viewer).toHaveAttribute('data-photo-index','1');
  await viewer.locator('.technology-viewer__toolbar--bottom button').last().click();await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('data-photo-index','0');await expect(viewer).toHaveAttribute('aria-busy','false');await check();
  for(let i=1;i<4;i++){await page.keyboard.press('ArrowRight');await expect(viewer).toHaveAttribute('data-photo-index',String(i));await expect(viewer).toHaveAttribute('aria-busy','false');if(i===2)await expect(viewer.locator('[data-description-block^="phone-"],[data-description-block^="diagram-"]')).toHaveCount(0);}
  await viewer.locator('.technology-viewer__toolbar--bottom button').first().click();await expect(viewer).toHaveAttribute('data-group','NobleCraft');await expect(viewer).toHaveAttribute('aria-busy','false');
  await viewer.locator('.technology-viewer__toolbar--bottom button').last().click();await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');
  await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();
 }
});

test('pending photo retains old frame; retry and close remain usable',async({page})=>{
 let valid=false;await page.route('**/art/technology/slides/noble-02.png',route=>valid?route.continue():route.fulfill({status:503,body:'failed'}));
 await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
 await page.keyboard.press('ArrowRight');await expect(viewer.getByRole('button',{name:'Retry',exact:true})).toBeVisible();await expect(viewer).toHaveAttribute('data-photo-index','0');await expect(viewer.locator('article')).toHaveCount(1);
 valid=true;await viewer.getByRole('button',{name:'Retry',exact:true}).click();await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();
});

test('native trackpad uses the new horizontal axis, and vertical input changes a fitting technology',async({browser,baseURL},info)=>{
 test.skip(info.project.name!=='desktop-chromium','one native desktop profile is sufficient');
 const context=await browser.newContext({viewport:{width:402,height:874}}),page=await context.newPage();await page.goto(`${baseURL}/en`);await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');await viewer.locator('.technology-viewer__photo img').hover({position:{x:200,y:250}});
 await page.clock.install();await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+1000);
 await page.mouse.wheel(0,2);await page.mouse.wheel(-120,4);await expect(viewer).toHaveAttribute('data-photo-index','1');await expect(viewer).toHaveAttribute('aria-busy','false');await expect(viewer).toHaveAttribute('data-group','NobleCraft');
 await page.clock.runFor(220);await page.mouse.wheel(0,120);await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');await page.clock.resume();await context.close();
});

test("keyboard pans a tall photo before changing technologies",async({page})=>{
 await page.setViewportSize({width:1024,height:650});await page.goto("/en");await openTechnology(page);const viewer=page.locator("#technology-viewer"),scroll=viewer.locator(".technology-viewer__scroll");await expect(viewer).toHaveAttribute("aria-busy","false");await scroll.focus();await page.keyboard.press("ArrowDown");await expect.poll(()=>scroll.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await expect(viewer).toHaveAttribute("data-group","NobleCraft");await scroll.evaluate(e=>{e.scrollTop=e.scrollHeight});await page.keyboard.press("ArrowDown");await expect(viewer).toHaveAttribute("data-group","HeatCore");
});
