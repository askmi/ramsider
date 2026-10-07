import {webkit,devices,expect} from '@playwright/test';
import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
const base=process.env.BASE_URL??'http://127.0.0.1:3021';
const out='docs/evidence/technology-viewer/full-width';
const browser=await webkit.launch();const results=[];
for(const [name,width,height,locale] of [['13-pro-expanded',390,664,'en'],['13-pro-mid',390,732,'en'],['13-pro-full',390,844,'en'],['13-pro-landscape',844,390,'en'],['13-pro-arabic',390,664,'ar'],['tablet',768,1024,'en']]){
 const context=await browser.newContext({...devices['iPhone 13 Pro'],viewport:{width,height}});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(`${base}/${locale}`);await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>innerWidth)).toBe(width);
 const open=page.locator('[data-technology-open]').first();await open.click();const viewer=page.locator('#technology-viewer');await expect(viewer).toBeVisible();
 const dims=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,viewer:document.querySelector('#technology-viewer').getBoundingClientRect().toJSON(),root:getComputedStyle(document.documentElement).backgroundColor}));
 expect(dims.scrollWidth).toBe(width);expect(dims.viewer.x).toBe(0);expect(dims.viewer.y).toBe(0);expect(dims.viewer.width).toBe(width);expect(dims.viewer.height).toBe(height);expect(dims.root).toBe('rgb(0, 0, 0)');
 if(width<700&&height>width){const frame=await viewer.locator('.technology-viewer__frame').boundingBox();expect(frame.x).toBe(0);expect(frame.width).toBe(width);}
 for(let i=0;i<4;i++){
 await viewer.locator('.technology-viewer__dots button').nth(i).click();await expect(viewer.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide',String(i+2).padStart(2,'0'));
 await viewer.locator('img').evaluateAll(async imgs=>{await document.fonts.ready;await Promise.all(imgs.map(i=>i.decode()));});
 if(i===0||name==='13-pro-expanded')await page.screenshot({path:`${out}/${name}-slide-${i+1}.png`});
 }
 // Black document plane when native modal/backdrop paint is excluded.
 const probe=await page.addStyleTag({content:'#technology-viewer[open],#technology-viewer[open] *{visibility:hidden!important}#technology-viewer[open]::backdrop{background:transparent!important}'});
 const backing=await page.screenshot();expect((await sharp(backing).removeAlpha().raw().toBuffer()).some(v=>v!==0)).toBe(false);if(name==='13-pro-expanded')await writeFile(`${out}/13-pro-black-backing.png`,backing);await probe.evaluate(e=>e.remove());
 if(name==='13-pro-expanded')for(const h of [732,844,664]){await page.setViewportSize({width:390,height:h});await expect(viewer).toHaveCSS('height',`${h}px`);await expect(page.locator('html')).toHaveCSS('background-color','rgb(0, 0, 0)');}
 await viewer.locator('.technology-viewer__close').click();await expect(viewer).not.toBeVisible();await expect(page.locator('main.canvas')).toBeVisible();await expect(open).toBeFocused();
 expect(errors).toEqual([]);results.push({name,...dims,allFourSlides:true,blackBacking:true,closeFocusRestored:true,errors});await context.close();
}
await browser.close();await writeFile(`${out}/mobile-checks.json`,JSON.stringify({base,nativeChromeVerified:false,results},null,2));console.log(JSON.stringify(results.map(({name})=>({name,result:'PASS'}))));
