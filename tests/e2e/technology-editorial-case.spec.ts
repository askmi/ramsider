import {test,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {locales} from '../../lib/i18n';
import {technologyGroups} from '../../lib/technology-gallery';
import {openTechnology,settleTechnology} from './helpers/technology';

const artifacts='screenshots/technology-editorial-case';
const approvedAcronyms=/\b(?:RAMSIDER|UNO|PRO|GOLD|PVD|PTFE|QR|CREATOR|WLAN)\b/g;
const editorialLabels='[data-description-block^="material-"]:not([data-description-block^="material-detail-"]) .technology-description__copy, [data-description-block^="capsule-icon-"] .technology-description__copy, [data-description-block^="air-icon-"] .technology-description__copy, [data-description-block^="mood-caption-"] .technology-description__copy, [data-description-block^="quick-caption-"] .technology-description__copy, [data-description-block="poly-summary"] .technology-description__copy, [data-description-block^="workflow-"] .technology-description__copy, [data-description-block*="eyebrow"] .technology-description__copy';

test('all technology editorial headings retain authored case, fit and TouchLink axis',async({page},info)=>{
 test.skip(!info.project.name.startsWith('iphone-17-pro'),'required mobile composition matrix');
 test.setTimeout(300000);
 await mkdir(artifacts,{recursive:true});
 const rows:unknown[]=[],errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const isPro=info.project.name==='iphone-17-pro-webkit';
 for(const locale of isPro?locales:['en','ru','de','ar'] as const){
  await page.goto(`/${locale}`);await openTechnology(page);const viewer=page.locator('#technology-viewer');
  for(const [groupIndex,group]of technologyGroups.entries()){
   if(groupIndex){await viewer.locator('footer button').last().click();}
   await settleTechnology(viewer);await expect(viewer).toHaveAttribute('data-group',group.title);
   for(let slide=0;slide<group.slides.length;slide++){
    if(slide){await viewer.locator('header button').nth(1).click();await settleTechnology(viewer);}
    await viewer.locator('article img').evaluate((img:HTMLImageElement)=>img.decode());await page.evaluate(()=>document.fonts.ready);
    const data=await viewer.evaluate((root,labels)=>{
     const article=root.querySelector('article')!,photo=article.getBoundingClientRect();
     const headings=[...root.querySelectorAll(`h3,h4,${labels}`)].map(e=>({text:e.textContent!,transform:getComputedStyle(e).textTransform}));
     const clipped=[...root.querySelectorAll('.technology-description__box')].filter(e=>e.firstElementChild!.scrollHeight>e.clientHeight+1||e.firstElementChild!.scrollWidth>e.clientWidth+1).map(e=>e.parentElement!.getAttribute('data-description-block'));
     const axis=[...root.querySelectorAll('[data-touchlink-slide="1"] [data-description-block]')].filter(e=>['touch-eyebrow','touch-headline','touch-body'].includes(e.getAttribute('data-description-block')!)).map(e=>{const b=e.getBoundingClientRect();return {id:e.getAttribute('data-description-block'),left:b.left-photo.left,right:photo.right-b.right,direction:getComputedStyle(e.firstElementChild!).direction}});
     return {width:innerWidth,dpr:devicePixelRatio,viewport:document.querySelector('meta[name="viewport"]')?.getAttribute('content'),overflow:document.documentElement.scrollWidth>innerWidth,headings,clipped,axis};
    },editorialLabels);
    expect(data.width).toBe(isPro?402:440);expect(data.dpr).toBe(3);expect(data.viewport).toContain('width=device-width');expect(data.overflow).toBe(false);expect(data.clipped).toEqual([]);expect(data.headings.length).toBeGreaterThan(0);
    for(const h of data.headings){expect(h.transform).toBe('none');const narrative=h.text.replace(approvedAcronyms,'').replace(/24K|N₂|CO₂/g,'');if(['en','ru','de','fr','es','it','tr'].includes(locale)&&/[\p{Lu}]/u.test(narrative))expect(narrative).not.toBe(narrative.toLocaleUpperCase(locale));}
    if(locale==='en'&&group.title==='NobleCraft'&&slide===1)await expect(viewer.locator('[data-description-block="material-0"] .technology-description__copy')).toHaveText('01  24K Gold PVD');
    if(group.title==='CapsuleCode'&&slide===1){const formula=viewer.locator('[data-description-block="capsule-icon-3"] .technology-description__copy');await expect(formula).toContainText('N₂');await expect(formula).toContainText('CO₂');}
    if(group.title==='TouchLink'&&slide===0){expect(data.axis).toHaveLength(3);for(const a of data.axis){expect(Math.abs(a.left-a.right)).toBeLessThan(.1);expect(a.direction).toBe(locale==='ar'?'rtl':'ltr');}if(locale==='en')await expect(viewer.locator('h3')).toHaveText('Control Starts with a Touch.\nThe App Takes It Further.');}
    if(locale==='en'||group.title==='TouchLink'&&['ar','ru','de'].includes(locale))await viewer.locator('article').screenshot({path:`${artifacts}/${info.project.name}-${locale}-${group.title}-${slide+1}.png`});
    rows.push({locale,group:group.title,slide,...data});
   }
  }
  await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();
 }
 expect(errors).toEqual([]);await writeFile(`${artifacts}/${info.project.name}.json`,JSON.stringify({rows,errors},null,2));
});
