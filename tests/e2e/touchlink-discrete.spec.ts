import {test,expect} from '@playwright/test';
import {openTechnology} from './helpers/technology';
import {locales} from '../../lib/i18n';
import {technologyGroups} from '../../lib/technology-gallery';
import {writeFile,mkdir} from 'node:fs/promises';

const artifacts='screenshots/technology-touchlink';
test('TouchLink three source-aligned slides, fifth group and all locale columns',async({page},info)=>{
 test.skip(!info.project.name.startsWith('iphone-17-pro'),'mobile source comparison matrix');
 test.setTimeout(180000);
 const results=[];const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await mkdir(artifacts,{recursive:true});
 expect(technologyGroups.map(g=>g.title)).toEqual(['NobleCraft','HeatCore','CapsuleCode','CyberMind','TouchLink','MoodEngine','AquaSense','AirShield','QuickCell','PolyArmor']);
 for(const locale of (info.project.name==='iphone-17-pro-webkit'?locales:['en','ar'] as const)){
  await page.goto(`/${locale}`);await openTechnology(page);const v=page.locator('#technology-viewer');const ready=()=>expect(v).toHaveAttribute('aria-busy','false');await ready();
  for(let i=0;i<4;i++){await v.locator('footer button').last().click();await ready();}await expect(v).toHaveAttribute('data-group','TouchLink');
  for(let i=0;i<3;i++){
   if(i){await v.locator('header button').nth(1).click();await ready();}await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
   const data=await v.evaluate(e=>{const image=e.querySelector('article img') as HTMLImageElement,b=image.getBoundingClientRect();return {width:innerWidth,dpr:devicePixelRatio,photoWidth:b.width,height:b.height,expected:b.width*1522/941,overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...e.querySelectorAll('[data-touchlink-slide] .technology-description__box')].filter(e=>e.firstElementChild!.scrollHeight>e.clientHeight+1||e.firstElementChild!.scrollWidth>e.clientWidth+1).map(e=>e.parentElement!.getAttribute('data-description-block')),fonts:[...e.querySelectorAll('[data-touchlink-slide] .technology-description__box')].map(e=>getComputedStyle(e).fontFamily),callouts:[...e.querySelectorAll('[data-description-block^="touch-feature-"]')].map(e=>({x:e.getAttribute('x'),width:e.getAttribute('width')}))}});
   expect(data.width).toBe(info.project.name.includes('pro-max')?440:402);expect(data.dpr).toBe(3);expect(data.overflow).toBe(false);expect(data.clipped).toEqual([]);expect(data.photoWidth).toBeCloseTo(data.width,0);expect(Math.abs(data.height-data.expected)).toBeLessThan(1);for(const f of data.fonts)expect(f).toContain('OpenSans');expect(data.callouts).toHaveLength(i?10:0);if(i===2)for(const c of data.callouts){expect(c.x).toBe('135');expect(c.width).toBe('275')}
   await expect(v.locator('[data-touchlink-title="live"]')).toHaveCount(1);await expect(v.locator('[data-description-block="touch-headline"] > div')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
   if(['en','ar','de'].includes(locale)){await page.screenshot({path:`${artifacts}/${info.project.name}-${locale}-${i+1}.png`});await v.locator('article').screenshot({path:`${artifacts}/${info.project.name}-${locale}-${i+1}-article.png`});}results.push({locale,photo:i,...data});
  }
  await expect(v.locator('header button').nth(1)).toBeDisabled();await expect(v).toHaveAttribute('data-photo-index','2');
  for(const name of ['MoodEngine','AquaSense','AirShield','QuickCell','PolyArmor']){await v.locator('footer button').last().click();await ready();await expect(v).toHaveAttribute('data-group',name)}await expect(v.locator('footer button').last()).toBeDisabled();for(const name of ['QuickCell','AirShield','AquaSense','MoodEngine','TouchLink']){await v.locator('footer button').first().click();await ready();await expect(v).toHaveAttribute('data-group',name)}await expect(v).toHaveAttribute('data-photo-index','0');await v.locator('footer button').first().click();await ready();await expect(v).toHaveAttribute('data-group','CyberMind');await page.keyboard.press('Escape');await expect(v).not.toBeVisible();
 }
 expect(errors).toEqual([]);await writeFile(`${artifacts}/${info.project.name}-geometry.json`,JSON.stringify({results,errors},null,2));
});

test('TouchLink adapts to phone tablet desktop; keyboard and assembled page',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','one focused adaptation matrix');
 await page.goto('/en');await openTechnology(page);const v=page.locator('#technology-viewer');const ready=()=>expect(v).toHaveAttribute('aria-busy','false');await ready();for(let i=0;i<4;i++){await v.locator('footer button').last().click();await ready()}
 const results=[];
 for(const size of [{width:402,height:650},{width:375,height:812},{width:768,height:1024},{width:1440,height:900}]){
  await page.setViewportSize(size);
  for(let i=0;i<3;i++){
   if(i){await page.keyboard.press('ArrowRight');await ready();}const d=await v.evaluate(e=>{const img=e.querySelector('article img')!,b=img.getBoundingClientRect();const s=e.querySelector('.technology-viewer__scroll')!;return {innerWidth,photoWidth:b.width,height:b.height,overflow:document.documentElement.scrollWidth>innerWidth,scroll:s.scrollHeight>s.clientHeight}});
   expect(d.photoWidth).toBeCloseTo(Math.min(size.width,941),0);expect(Math.abs(d.height-d.photoWidth*1522/941)).toBeLessThan(1);expect(d.overflow).toBe(false);await page.screenshot({path:`${artifacts}/adapt-${size.width}-${size.height}-${i+1}.png`});const scroller=v.locator('.technology-viewer__scroll');await scroller.evaluate(e=>e.scrollTop=e.scrollHeight);expect(await scroller.evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop))).toBeLessThan(1);await page.screenshot({path:`${artifacts}/adapt-${size.width}-${size.height}-${i+1}-bottom.png`});results.push({size,photo:i,...d});
  }
  await page.keyboard.press('ArrowLeft');await ready();await page.keyboard.press('ArrowLeft');await ready();
 }
 await page.keyboard.press('Escape');await expect(v).not.toBeVisible();
 for(const size of [{width:402,height:874},{width:440,height:956}]){
  await page.setViewportSize(size);for(const fraction of [0,.25,.5,.75,1]){await page.evaluate(f=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*f),fraction);await page.waitForTimeout(250);await expect(page.locator('.page-media-overlay')).not.toBeVisible({timeout:30000});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.screenshot({path:`${artifacts}/assembled-${size.width}-${fraction}.png`})}
 }
 await writeFile(`${artifacts}/adaptation.json`,JSON.stringify(results,null,2));
});
