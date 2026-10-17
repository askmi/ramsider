import {test,expect} from '@playwright/test';
import {openTechnology,settleTechnology} from './helpers/technology';
import {locales} from '../../lib/i18n';
import {technologyGroups} from '../../lib/technology-gallery';
import {mkdir,writeFile} from 'node:fs/promises';
const artifacts='screenshots/technology-mood-aqua';
test('MoodEngine and AquaSense: native dimensions/lossless WebP, live copy, locale columns and group transitions',async({page},info)=>{
 test.skip(!info.project.name.startsWith('iphone-17-pro'),'mobile comparison matrix');test.setTimeout(180000);await mkdir(artifacts,{recursive:true});
 expect(technologyGroups.map(g=>g.title)).toEqual(['NobleCraft','HeatCore','CapsuleCode','CyberMind','TouchLink','MoodEngine','AquaSense','AirShield','QuickCell','PolyArmor']);
 const results=[],errors:string[]=[],paths:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/\/(mood|aqua)-/.test(r.url()))paths.push(new URL(r.url()).pathname)});
 for(const locale of (info.project.name==='iphone-17-pro-webkit'?locales:['en','ar'] as const)){
  await page.goto(`/${locale}`);await openTechnology(page);const v=page.locator('#technology-viewer'),ready=()=>settleTechnology(v);await ready();
  for(let i=0;i<5;i++){await v.locator('footer button').last().click();await ready()}
  for(const [kind,name] of [['mood','MoodEngine'],['aqua','AquaSense']] as const){
   await expect(v).toHaveAttribute('data-group',name);
   for(let slide=0;slide<2;slide++){
    if(slide){await v.locator('header button').nth(1).click();await ready()}
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
    const d=await v.evaluate(e=>{const img=e.querySelector('article img') as HTMLImageElement,b=img.getBoundingClientRect();return {viewport:innerWidth,dpr:devicePixelRatio,src:e.querySelector('article')!.getAttribute('data-photo'),sourceWidth:img.naturalWidth,sourceHeight:img.naturalHeight,width:b.width,height:b.height,ratioError:Math.abs(b.height-b.width*img.naturalHeight/img.naturalWidth),overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...e.querySelectorAll('[data-mood-aqua] .technology-description__box')].filter(e=>e.firstElementChild!.scrollHeight>e.clientHeight+1||e.firstElementChild!.scrollWidth>e.clientWidth+1).map(e=>e.parentElement!.getAttribute('data-description-block')),fonts:[...e.querySelectorAll('[data-mood-aqua] .technology-description__box')].map(e=>getComputedStyle(e).fontFamily)}});
    expect(d.viewport).toBe(info.project.name.includes('max')?440:402);expect(d.dpr).toBe(3);expect(d.sourceWidth).toBe(kind==='aqua'&&!slide?940:941);expect(d.sourceHeight).toBe(1522);expect(d.src).toBe(`/art/technology/slides/${kind}-0${slide+1}.webp`);expect(d.width).toBeCloseTo(d.viewport,0);expect(d.ratioError).toBeLessThan(1);expect(d.overflow).toBe(false);expect(d.clipped).toEqual([]);for(const f of d.fonts)expect(f).toContain('OpenSans');await expect(v.locator('[data-mood-aqua-title="live"]')).toHaveCount(1);await expect(v.locator('[data-description-block="mood-aqua-body"] > div')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
    if(['en','ar','de'].includes(locale)){await page.screenshot({path:`${artifacts}/${info.project.name}-${locale}-${kind}-${slide+1}.png`});await v.locator('article').screenshot({path:`${artifacts}/${info.project.name}-${locale}-${kind}-${slide+1}-article.png`})}results.push({locale,kind,slide,...d});
   }
   await expect(v.locator('header button').nth(1)).toBeDisabled();await v.locator('.technology-viewer__scroll').evaluate(e=>e.scrollTop=e.scrollHeight);await v.locator('footer button').last().click();await ready();await page.waitForTimeout(200);expect(await v.locator('.technology-viewer__scroll').evaluate(e=>e.scrollTop)).toBe(0);
  }
  for(const name of ['AirShield','QuickCell','PolyArmor']){if(name!=='AirShield'){await v.locator('footer button').last().click();await ready()}await expect(v).toHaveAttribute('data-group',name)}await expect(v.locator('footer button').last()).toBeDisabled();for(const name of ['QuickCell','AirShield','AquaSense','MoodEngine','TouchLink']){await v.locator('footer button').first().click();await ready();await expect(v).toHaveAttribute('data-group',name);await expect(v).toHaveAttribute('data-photo-index','0')}
  await page.keyboard.press('Escape');await expect(v).not.toBeVisible();
 }
 expect(errors).toEqual([]);expect(paths.length).toBeGreaterThan(0);expect(paths.every(p=>p.endsWith('.webp'))).toBe(true);await writeFile(`${artifacts}/${info.project.name}-geometry.json`,JSON.stringify({results,errors,requestedPaths:[...new Set(paths)]},null,2));
});
test('four new slides adapt, retain bottom access and keyboard; assembled page',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','one adaptation matrix');await mkdir(artifacts,{recursive:true});await page.goto('/en');await openTechnology(page);const v=page.locator('#technology-viewer'),ready=()=>settleTechnology(v);await ready();for(let i=0;i<5;i++){await v.locator('footer button').last().click();await ready()}
 const results=[];
 for(const size of [{width:402,height:650},{width:375,height:812},{width:768,height:1024},{width:1440,height:900}]){
  await page.setViewportSize(size);
  for(const name of ['MoodEngine','AquaSense']){
   await expect(v).toHaveAttribute('data-group',name);
   for(let slide=0;slide<2;slide++){
    if(slide){await page.keyboard.press('ArrowRight');await ready()}
    const d=await v.evaluate(e=>{const img=e.querySelector('article img') as HTMLImageElement,b=img.getBoundingClientRect();return {width:b.width,ratioError:Math.abs(b.height-b.width*img.naturalHeight/img.naturalWidth),overflow:document.documentElement.scrollWidth>innerWidth}});expect(d.width).toBeCloseTo(Math.min(size.width,941),0);expect(d.ratioError).toBeLessThan(1);expect(d.overflow).toBe(false);
    await page.screenshot({path:`${artifacts}/adapt-${size.width}-${name}-${slide+1}.png`});const scroller=v.locator('.technology-viewer__scroll');await scroller.evaluate(e=>e.scrollTop=e.scrollHeight);expect(await scroller.evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop))).toBeLessThan(1);await page.screenshot({path:`${artifacts}/adapt-${size.width}-${name}-${slide+1}-bottom.png`});results.push({size,name,slide,...d});
   }
   if(name==='MoodEngine'){await v.locator('footer button').last().click();await ready()}
  }
  await v.locator('footer button').first().click();await ready();
 }
 await page.keyboard.press('Escape');for(const width of [402,440]){await page.setViewportSize({width,height:width===402?874:956});for(const f of [0,.5,1]){await page.evaluate(f=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*f),f);await page.waitForTimeout(250);await expect(page.locator('.page-media-overlay')).not.toBeVisible({timeout:30000});expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await page.screenshot({path:`${artifacts}/assembled-${width}-${f}.png`})}}
 await writeFile(`${artifacts}/adaptation.json`,JSON.stringify(results,null,2));
});
