import {test,expect} from '@playwright/test';
import {openTechnology} from './helpers/technology';
import {locales} from '../../lib/i18n';
import {technologyGroups} from '../../lib/technology-gallery';
import {writeFile} from 'node:fs/promises';

test('CyberMind fourth and AirShield eighth: live readable flowing text in every locale',async({page},info)=>{
 const results=[];expect(technologyGroups.map(g=>g.title)).toEqual(['NobleCraft','HeatCore','CapsuleCode','CyberMind','TouchLink','MoodEngine','AquaSense','AirShield','QuickCell','PolyArmor']);expect(technologyGroups.at(-1)?.title).toBe('PolyArmor');
 for(const locale of (info.project.name==='iphone-17-pro-webkit'?locales:['en'] as const)){
  await page.goto(`/${locale}`);await openTechnology(page);const v=page.locator('#technology-viewer');const ready=()=>expect(v).toHaveAttribute('aria-busy','false');await ready();
  for(let i=0;i<3;i++){await v.locator('footer button').last().click();await ready();}await expect(v).toHaveAttribute('data-group','CyberMind');
  for(let i=0;i<2;i++){
   if(i){await v.locator('header button').nth(1).click();await ready();}await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>new Promise(async r=>{for(let n=0;n<10;n++)await new Promise(done=>requestAnimationFrame(done));r(null)}));
   const data=await v.evaluate(e=>{const image=e.querySelector('article img') as HTMLImageElement,b=image.getBoundingClientRect();return {width:innerWidth,dpr:devicePixelRatio,photoWidth:b.width,height:b.height,expected:b.width*1522/941,overflow:document.documentElement.scrollWidth>innerWidth,clipped:[...e.querySelectorAll('[data-cybermind-slide] .technology-description__copy')].filter(e=>e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1).length,fonts:[...e.querySelectorAll('[data-cybermind-slide] .technology-description__copy')].map(e=>getComputedStyle(e).fontFamily),callouts:[...e.querySelectorAll('[data-description-block^="cyber-callout-"]')].map(e=>({size:parseFloat(getComputedStyle(e).fontSize)}))}});
   expect(data.overflow).toBe(false);expect(data.clipped).toBe(0);expect(data.photoWidth).toBeCloseTo(Math.min(data.width,941),0);expect(Math.abs(data.height-data.expected)).toBeLessThan(1);for(const f of data.fonts)expect(f).toContain('OpenSans');expect(data.callouts).toHaveLength(i?10:0);for(const c of data.callouts)expect(c.size).toBe(16)
   await expect(v.locator('[data-description-block="cyber-body"]')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
   if(['en','ar','de'].includes(locale)){await page.screenshot({path:`/tmp/cyber-${info.project.name}-${locale}-${i+1}.png`});await v.locator('article').screenshot({path:`/tmp/cyber-${info.project.name}-${locale}-${i+1}-article.png`});}results.push({locale,photo:i,...data});
  }
  await v.locator('footer button').last().click();await ready();await expect(v).toHaveAttribute('data-group','TouchLink');for(const name of ['MoodEngine','AquaSense','AirShield','QuickCell','PolyArmor']){await v.locator('footer button').last().click();await ready();await expect(v).toHaveAttribute('data-group',name)}await expect(v.locator('footer button').last()).toBeDisabled();for(const name of ['QuickCell','AirShield','AquaSense','MoodEngine','TouchLink']){await v.locator('footer button').first().click();await ready();await expect(v).toHaveAttribute('data-group',name)}await v.locator('footer button').first().click();await ready();await expect(v).toHaveAttribute('data-group','CyberMind');await expect(v).toHaveAttribute('data-photo-index','0');await v.locator('footer button').first().click();await ready();await expect(v).toHaveAttribute('data-group','CapsuleCode');await page.keyboard.press('Escape');await expect(v).not.toBeVisible();
 }
 await writeFile(`/tmp/cyber-${info.project.name}-geometry.json`,JSON.stringify(results,null,2));
});
