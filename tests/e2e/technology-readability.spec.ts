import {test,expect} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {openTechnology} from './helpers/technology';
import {locales} from '../../lib/i18n';
import {technologyGroups} from '../../lib/technology-gallery';
import iconMap from '../../lib/technology-icon-map.json' with {type:'json'};

const evidence='screenshots/technology-readability';
test.beforeEach(async({page})=>{
 await mkdir(evidence,{recursive:true});
 // Mark only the actual DOM resources whose decode completed, not new IMG copies.
 await page.addInitScript(()=>{
  const decode=HTMLImageElement.prototype.decode;
  HTMLImageElement.prototype.decode=function(){return decode.call(this).then(()=>{this.dataset.qaDecodedResource='true';});};
 });
});

test('all technology reading copy has fixed readable sizes, complete content and reachable bottom',async({page},info)=>{
 test.skip(!info.project.name.includes('webkit'),'mobile text matrix');
 test.setTimeout(240000);
 await mkdir(evidence,{recursive:true});
 const baseline=JSON.parse(await readFile('tests/fixtures/technology-reading-copy.json','utf8')) as {photo:string;blocks:{id:string;text:string}[]}[];
 const results=[];
 const targets=info.project.name==='iphone-17-pro-webkit'?locales:['en','ar'] as const;
 for(const locale of targets){
  await page.goto(`/${locale}`);await openTechnology(page);const v=page.locator('#technology-viewer');const ready=()=>expect(v).toHaveAttribute('aria-busy','false');await ready();
  for(let g=0;g<technologyGroups.length;g++){
   if(g){await v.locator('footer button').last().click();await ready();}
   await expect(v).toHaveAttribute('data-group',technologyGroups[g].title);
   for(let s=0;s<technologyGroups[g].slides.length;s++){
    if(s){await v.locator('header button').nth(1).click();await ready();}
    await page.evaluate(()=>document.fonts.ready);
    await page.waitForTimeout(60);
    const data=await v.evaluate(e=>{
     const image=e.querySelector('article img') as HTMLImageElement,b=image.getBoundingClientRect(),article=e.querySelector('article')!,r=e.querySelector('.technology-viewer__scroll')!;
     const descriptor=e.querySelector('.technology-viewer__art-title span');
     const contrast=(color:string,background:string)=>{const rgb=(s:string)=>s.match(/[\d.]+/g)!.map(Number);const luminance=(v:number[])=>{const a=v.slice(0,3).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return a[0]*.2126+a[1]*.7152+a[2]*.0722};const bg=rgb(background);if(bg[3]!==undefined&&bg[3]<1)return 0;const a=luminance(rgb(color)),b=luminance(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
     const descriptorStyle=descriptor?getComputedStyle(descriptor):null;
     return {descriptorContrast:descriptorStyle?contrast(descriptorStyle.color,descriptorStyle.backgroundColor):null,width:innerWidth,dpr:devicePixelRatio,photoWidth:b.width,height:b.height,expected:b.width*image.naturalHeight/image.naturalWidth,overflow:document.documentElement.scrollWidth>innerWidth||r.scrollWidth>r.clientWidth+1,scrollTop:r.scrollTop,articleHeight:article.getBoundingClientRect().height,blocks:[...e.querySelectorAll<HTMLElement>('[data-description-block]')].map(n=>({id:n.dataset.descriptionBlock!,text:n.textContent!,size:parseFloat(getComputedStyle(n).fontSize),line:parseFloat(getComputedStyle(n).lineHeight),tag:n.tagName,dir:n.dir,clipped:n.scrollWidth>n.clientWidth+1||n.scrollHeight>n.clientHeight+1})),targets:[...e.querySelectorAll('button')].map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height}))};
    });
    expect(data.width).toBe(info.project.use.viewport!.width);expect(data.dpr).toBe(3);expect(data.overflow).toBe(false);expect(Math.abs(data.height-data.expected)).toBeLessThan(1);expect(data.photoWidth).toBeCloseTo(Math.min(data.width,941),0);expect(data.scrollTop).toBeLessThan(1);
    expect(data.blocks.length).toBeGreaterThan(2);
    if(data.descriptorContrast!==null)expect(data.descriptorContrast).toBeGreaterThanOrEqual(4.5);
    for(const block of data.blocks){expect(block.size).toBe(block.tag==='H3'?24:16);expect(block.clipped).toBe(false);expect(block.dir).toBe(locale==='ar'?'rtl':'ltr');}
    for(const target of data.targets){expect(target.w).toBeGreaterThanOrEqual(44);expect(target.h).toBeGreaterThanOrEqual(44);}
    if(locale==='en'){
     const old=baseline.find(x=>x.photo===technologyGroups[g].slides[s].src)!;
     for(const block of old.blocks.filter(x=>!x.id.endsWith('-descriptor'))){const actual=data.blocks.find(x=>x.id===block.id);expect(actual,block.id).toBeDefined();expect(actual!.text.replace(/\s+/g,' ').trim()).toBe(block.text.replace(/\s+/g,' ').trim());}
    }
    const iconGroup=iconMap.groups.find(group=>group.source===technologyGroups[g].slides[s].src);
    const iconRows=v.locator('[data-reading-icon]');
    await expect(iconRows).toHaveCount(iconGroup?.icons.length??0);
    if(iconGroup){
     await expect(v.locator('.technology-viewer__icon-patch')).toHaveCount(1);
     await expect(v.locator('.technology-viewer__icon-patch')).toHaveAttribute('data-qa-decoded-resource','true');
     for(const icon of iconGroup.icons){
      const row=v.locator(`[data-reading-icon="${icon.id}"]`);
      await expect(row.locator(`[data-description-block="${icon.caption}"]`)).toHaveCount(1);
      const geometry=await row.evaluate(e=>{const image=e.querySelector('img')!,label=e.querySelector('[data-description-block]')!,i=image.getBoundingClientRect(),b=label.getBoundingClientRect();return {retainedDecoded:image.dataset.qaDecodedResource==='true',decoded:image.complete&&image.naturalWidth>0,blob:image.src.startsWith('blob:'),gap:e.getAttribute('dir')==='rtl'?i.left-b.right:b.left-i.right,overflow:e.scrollWidth>e.clientWidth+1,iconWidth:i.width,iconHeight:i.height,labelSize:parseFloat(getComputedStyle(label).fontSize)};});
      expect(geometry.retainedDecoded).toBe(true);expect(geometry.decoded).toBe(true);expect(geometry.blob).toBe(true);expect(geometry.gap).toBeCloseTo(16,0);expect(geometry.overflow).toBe(false);expect(geometry.iconWidth).toBe(48);expect(geometry.iconHeight).toBe(48);expect(geometry.labelSize).toBe(16);
      if(locale==='en'||locale==='ar'){
       await row.scrollIntoViewIfNeeded();await page.waitForTimeout(80);
       await row.screenshot({path:`${evidence}/icons-${info.project.name}-${locale}-${iconGroup.photo}-${icon.id}.png`});
      }
     }
     await v.locator('.technology-viewer__scroll').evaluate(e=>e.scrollTop=0);
    }else await expect(v.locator('.technology-viewer__icon-patch')).toHaveCount(0);
    const scroll=v.locator('.technology-viewer__scroll');
    if(locale==='en'||locale==='ar'&&(g===3||g===7)){
     await page.screenshot({path:`${evidence}/after-${info.project.name}-${locale}-${g}-${s}-top.png`});
     if(locale==='en')await v.locator('article').screenshot({path:`${evidence}/after-${info.project.name}-${locale}-${g}-${s}-article.png`});
     await scroll.evaluate(e=>{e.scrollTop=e.querySelector('.technology-viewer__illustration')!.getBoundingClientRect().height});await page.waitForTimeout(60);
     await page.screenshot({path:`${evidence}/after-${info.project.name}-${locale}-${g}-${s}-reading-start.png`});
    }
    const bottomScroll=v.locator('.technology-viewer__scroll');await bottomScroll.evaluate(e=>{e.scrollTop=e.scrollHeight});await page.waitForTimeout(60);
    const end=await v.locator('[data-description-block]').last().boundingBox(),pane=await scroll.boundingBox();expect(end!.y+end!.height).toBeLessThanOrEqual(pane!.y+pane!.height+1);
    if(locale==='en'||locale==='ar'&&(g===3||g===7)){
     await page.screenshot({path:`${evidence}/after-${info.project.name}-${locale}-${g}-${s}-reading-end.png`});
     if(g===3&&s===1||g===7&&s===1)await page.screenshot({path:`${evidence}/after-${info.project.name}-${locale}-${g}-${s}-reading.png`});
    }
    results.push({locale,group:technologyGroups[g].title,slide:s,...data});
   }
  }
  await expect(v.locator('footer button').last()).toBeDisabled();await page.keyboard.press('Escape');await expect(v).not.toBeVisible();
 }
 await writeFile(`${evidence}/readability-${info.project.name}.json`,JSON.stringify(results,null,2));
});

test('reading reflows at smaller and wider widths and doubled text size',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','one responsive WebKit matrix');
 const rows=[];
 for(const [width,height] of [[375,812],[402,560],[768,1024],[1440,900]]){
  await page.setViewportSize({width,height});await page.goto('/en');await openTechnology(page);const v=page.locator('#technology-viewer');const ready=()=>expect(v).toHaveAttribute('aria-busy','false');await ready();
  for(let g=0;g<10;g++){
   if(g){await v.locator('footer button').last().click();await ready();}
   if(g!==3&&g!==7)continue;
   await v.locator('header button').nth(1).click();await ready();await page.evaluate(()=>document.fonts.ready);
   const s=v.locator('.technology-viewer__scroll');await s.evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(100);
   const d=await v.evaluate(e=>({overflow:e.querySelector('.technology-viewer__scroll')!.scrollWidth>e.querySelector('.technology-viewer__scroll')!.clientWidth+1,fonts:[...e.querySelectorAll('[data-description-block]')].map(n=>({font:parseFloat(getComputedStyle(n).fontSize),clipped:n.scrollWidth>n.clientWidth+1})),photo:e.querySelector('article img')!.getBoundingClientRect().width}));expect(d.overflow).toBe(false);for(const b of d.fonts){expect([16,24]).toContain(b.font);expect(b.clipped).toBe(false)}expect(d.photo).toBeCloseTo(Math.min(width,941),0);
   await page.screenshot({path:`${evidence}/adaptation-${width}-${g}.png`});rows.push({width,height,group:g,...d});
  }
  await page.keyboard.press('Escape');
 }
 await page.setViewportSize({width:402,height:560});await page.goto('/ar');await openTechnology(page);const v=page.locator('#technology-viewer');for(let i=0;i<3;i++){await expect(v).toHaveAttribute('aria-busy','false');await v.locator('footer button').last().click()}await expect(v).toHaveAttribute('aria-busy','false');await v.locator('header button').nth(1).click();await expect(v).toHaveAttribute('aria-busy','false');
 // An explicit undersized override must hit the emergency floor, never silently shrink further.
 await v.locator('.technology-viewer__descriptions').evaluate(e=>(e as HTMLElement).style.setProperty('--technology-reading-font-size','8px'));
 expect(await v.locator('[data-description-block="cyber-body"]').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(14);
 await v.locator('.technology-viewer__descriptions').evaluate(e=>(e as HTMLElement).style.removeProperty('--technology-reading-font-size'));
 expect(await v.locator('[data-description-block="cyber-body"]').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBe(16);
 await page.addStyleTag({content:'.technology-reading .technology-description__copy{font-size:32px!important;line-height:1.5!important}.technology-reading h3.technology-description__copy{font-size:48px!important}'});
 const scroll=v.locator('.technology-viewer__scroll');await scroll.evaluate(e=>e.scrollTop=e.querySelector('.technology-viewer__illustration')!.getBoundingClientRect().height);await page.screenshot({path:`${evidence}/text-scale-200-ar-start.png`});
 expect(await scroll.evaluate(e=>e.scrollWidth>e.clientWidth+1)).toBe(false);expect(await v.locator('[data-description-block]').evaluateAll(es=>es.some(e=>e.scrollWidth>e.clientWidth+1))).toBe(false);
 await scroll.evaluate(e=>e.scrollTop=e.scrollHeight);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.waitForTimeout(100);
 await expect(v.locator('.technology-viewer__close')).toBeVisible();
 await page.screenshot({path:`${evidence}/text-scale-200-ar-end.png`});const end=await v.locator('[data-description-block]').last().boundingBox(),pane=await scroll.boundingBox();expect(end!.y+end!.height).toBeLessThanOrEqual(pane!.y+pane!.height+1);
 await v.locator('.technology-viewer__close').click();await expect(v).not.toBeVisible();
 await writeFile(`${evidence}/adaptation.json`,JSON.stringify({rows,textScale:'synthetic CSS doubling, not native Safari page zoom'},null,2));
});


test('paired artwork decode is atomic, retriable and Close remains usable',async({page},info)=>{
 test.skip(!info.project.name.includes('webkit'),'paired mobile readiness');
 const patch='**/reading-icons/noble-02-patch.png';let fail=true;
 await page.route(patch,route=>fail?route.abort('failed'):route.continue());
 await page.goto('/en');await openTechnology(page);const v=page.locator('#technology-viewer');await expect(v).toHaveAttribute('aria-busy','false');
 const first=await v.locator('article img').first().getAttribute('data-source');
 await v.locator('header button').nth(1).click();await expect(v.getByRole('button',{name:'Retry'})).toBeVisible();
 expect(await v.locator('article img').first().getAttribute('data-source')).toBe(first);await expect(v.locator('[data-reading-icon]')).toHaveCount(0);
 fail=false;await v.getByRole('button',{name:'Retry'}).click();await expect(v).toHaveAttribute('aria-busy','false');await expect(v.locator('[data-reading-icon]')).toHaveCount(5);
 await expect(v.locator('.technology-viewer__icon-patch')).toHaveAttribute('data-qa-decoded-resource','true');
 expect(await v.locator('[data-reading-icon] img').evaluateAll(images=>images.every(image=>(image as HTMLImageElement).dataset.qaDecodedResource==='true'))).toBe(true);
 await page.screenshot({path:`${evidence}/icons-retry-${info.project.name}.png`});
 await v.locator('.technology-viewer__close').click();await expect(v).not.toBeVisible();
});
