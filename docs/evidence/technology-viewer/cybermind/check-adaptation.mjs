import {webkit,expect} from '@playwright/test';import{writeFile}from'node:fs/promises';
const out='docs/evidence/technology-viewer/cybermind';const browser=await webkit.launch(),results=[];
const locales=['en','ru','de','fr','es','it','tr','ar','zh','ja','ko'];
const cases=[...locales.flatMap(locale=>[[locale,402,874],[locale,440,956]]),['en',320,700],['en',390,664],['en',390,732],['en',390,844],['ar',390,664],['en',768,1024],['en',844,390]];
try{for(const[locale,width,height]of cases){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:3021/${locale}`);expect(await page.evaluate(()=>innerWidth)).toBe(width);
 await page.locator('[data-technology-open]').first().click();const viewer=page.locator('#technology-viewer');await viewer.locator('.technology-viewer__next-group').click();await expect(viewer).toHaveAttribute('data-group','CyberMind');
 await viewer.locator('img').evaluateAll(async imgs=>{await document.fonts.ready;await Promise.all(imgs.map(img=>img.decode()));});
 const title=await viewer.locator('.technology-viewer__title svg text').evaluateAll(nodes=>nodes.map(node=>{const b=node.getBBox();return{x:b.x,y:b.y,width:b.width,height:b.height,stroke:getComputedStyle(node).stroke,paintOrder:getComputedStyle(node).paintOrder};}));
 for(const b of title){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThan(941);expect(b.y+b.height).toBeLessThan(300);}
 expect(title[1].stroke).toBe('rgb(255, 255, 255)');expect(title[1].paintOrder).toMatch(/^stroke(?: fill)?(?: markers)?$/);
 const previous=await viewer.locator('.technology-viewer__previous-group').boundingBox(),next=await viewer.locator('.technology-viewer__next-group').boundingBox();
 expect(previous.width).toBeGreaterThanOrEqual(43.99);expect(previous.height).toBeGreaterThanOrEqual(43.99);expect(previous.y+previous.height).toBeLessThanOrEqual(height+.02);expect(previous.x+previous.width).toBeLessThanOrEqual(next.x+.02);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await expect(viewer.locator('.technology-viewer__descriptions')).toHaveCount(0);await expect(viewer.locator('.technology-viewer__dots button')).toHaveCount(2);
 if((['ar','ru','ja'].includes(locale)&&width===402)||(locale==='en'&&![402,440].includes(width)))await page.screenshot({path:`${out}/${locale}-${width}x${height}-slide-1.png`});
 if(locale==='ar'){
  const stage=viewer.locator('.technology-viewer__stage');await stage.dispatchEvent('pointerdown',{pointerType:'touch',clientX:80,clientY:350});await stage.dispatchEvent('pointerup',{pointerType:'touch',clientX:280,clientY:350});await expect(stage.locator('img')).toHaveAttribute('src','/art/technology/cybermind/02.png');
 }
 await viewer.locator('.technology-viewer__previous-group').click();await expect(viewer).toHaveAttribute('data-group','HeatCore');
 await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();await expect(page.locator('[data-technology-open]').first()).toBeFocused();expect(errors).toEqual([]);
 results.push({locale,width,height,dpr:3,title,previous,next,overflow:false,descriptionCount:0,groupDots:2,closeRestoresFocus:true,errors,landscapeKnown0066:width>height});await context.close();
}await writeFile(`${out}/adaptation.json`,JSON.stringify(results,null,2)+'\n');console.log(`${results.length} locale/viewport states PASS`);}finally{await browser.close();}
