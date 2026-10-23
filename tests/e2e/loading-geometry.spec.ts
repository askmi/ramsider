import {test,expect} from '@playwright/test';
import {technologyGroups} from '../../lib/technology-gallery';
import previews from '../../lib/media-previews.json' with {type:'json'};
test('every technology slide preserves full-width source geometry and bottom access',async({page},info)=>{
 test.setTimeout(120000);await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/en');await page.locator('[data-technology-open]').first().evaluate((e:HTMLElement)=>e.click());const viewer=page.locator('#technology-viewer');
 for(let group=0;group<technologyGroups.length;group++){
  for(let slide=0;slide<technologyGroups[group].slides.length;slide++){
   await expect(viewer).toHaveAttribute('data-group',technologyGroups[group].title);await expect(viewer).toHaveAttribute('data-photo-index',String(slide));
   const image=viewer.locator('.technology-viewer__photo img');await expect(image).toHaveAttribute('data-media-ready','',{timeout:30000});
   const src=technologyGroups[group].slides[slide].src,entry=previews[src as keyof typeof previews];
   const geometry=await image.evaluate((image:HTMLImageElement)=>({width:image.getBoundingClientRect().width,height:image.getBoundingClientRect().height,plane:image.closest('article')!.getBoundingClientRect().width,natural:[image.naturalWidth,image.naturalHeight]}));
   expect(geometry.natural).toEqual([entry.width,entry.height]);expect(Math.abs(geometry.width-geometry.plane)).toBeLessThan(1);expect(Math.abs(geometry.height-geometry.width*entry.height/entry.width)).toBeLessThan(1);
   const scroll=viewer.locator('.technology-viewer__scroll');await scroll.evaluate(e=>e.scrollTop=e.scrollHeight);expect(await scroll.evaluate(e=>e.scrollHeight-e.clientHeight-e.scrollTop)).toBeLessThan(2);
   if(slide===0)await page.screenshot({path:`screenshots/loading-flow/geometry-${info.project.name}-${group}.png`});
   if(slide+1<technologyGroups[group].slides.length)await viewer.getByRole('button',{name:'Next Slide',exact:true}).click();
  }
  if(group+1<technologyGroups.length)await viewer.getByRole('button',{name:'Next Technology',exact:true}).click();
 }
});
test('charcoal and main artwork remain continuous; preview-to-original does not change dimensions',async({page},info)=>{
 await page.goto('/en');await expect(page.locator('html')).toHaveAttribute('data-story-media-ready','',{timeout:60000});
 const bad=await page.locator('.art img[data-media]').evaluateAll(images=>images.filter(image=>{const e=image as HTMLImageElement;return Math.abs(e.getBoundingClientRect().height-e.getBoundingClientRect().width*Number(e.getAttribute('height'))/Number(e.getAttribute('width')))>1;}).length);expect(bad).toBe(0);
 await page.locator('[data-charcoal-open]').first().evaluate((e:HTMLElement)=>e.click());await expect(page.locator('#charcoal-viewer img[data-media-ready]')).toHaveCount(12,{timeout:30000});
 const scroll=page.locator('.charcoal-viewer__scroll');await scroll.evaluate(e=>e.scrollTop=e.scrollHeight);await page.screenshot({path:`screenshots/loading-flow/charcoal-bottom-${info.project.name}.png`});expect(await scroll.evaluate(e=>e.scrollHeight-e.clientHeight-e.scrollTop)).toBeLessThan(2);
});
test('short phone, tablet and desktop adapt without clipping or horizontal overflow',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','size matrix owned by primary profile');test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
 for(const [width,height] of [[375,812],[402,650],[440,700],[768,1024],[1440,900]]){
  await page.setViewportSize({width,height});await page.goto('/en');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  for(const name of ['wellness','charcoal','technology']){await page.locator(`[data-${name}-open]`).first().evaluate((e:HTMLElement)=>e.click());const viewer=page.locator(`#${name}-viewer`);await expect(viewer).toBeVisible();await expect(viewer.locator('img[data-media]').first()).toHaveAttribute('data-media-ready','',{timeout:30000});await page.evaluate(()=>document.fonts.ready);expect(await viewer.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBeTruthy();await page.screenshot({path:`screenshots/loading-flow/adapt-${width}-${height}-${name}.png`});if(name==='technology'){const image=viewer.locator('.technology-viewer__photo img');const size=await image.evaluate((e:HTMLImageElement)=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,nw:e.naturalWidth,nh:e.naturalHeight}));expect(Math.abs(size.h-size.w*size.nh/size.nw)).toBeLessThan(1);const area=viewer.locator('.technology-viewer__scroll');await area.evaluate(e=>e.scrollTop=e.scrollHeight);expect(await area.evaluate(e=>e.scrollHeight-e.clientHeight-e.scrollTop)).toBeLessThan(2);await page.screenshot({path:`screenshots/loading-flow/adapt-${width}-${height}-${name}-bottom.png`});}await viewer.evaluate((e:HTMLDialogElement)=>e.close());}
 }
});
