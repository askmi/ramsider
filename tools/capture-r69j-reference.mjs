import {webkit,devices} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await webkit.launch();const rows=[];const app=process.env.APP_BASE;const width=Number(process.env.WIDTH??402),height=width===440?956:874;const editorial=process.env.EDITORIAL==='1'?JSON.parse(await fs.readFile('lib/preorder/editorial-overrides.json','utf8')):null;const folder=(app?'candidate':editorial?'reference-editorial':'reference')+(width===402?'':`-${width}`);await fs.mkdir(`screenshots/r69j/${folder}`,{recursive:true});
const pages=['reserve','pro','gold','compare','product-card','capsules','terms','returns','privacy','delivery-policy','terms-of-sale','contact','age-gate'];
for(const language of ['en','ar']){
 const context=await browser.newContext({...devices['iPhone 17 Pro'],viewport:{width,height},deviceScaleFactor:3,reducedMotion:'reduce'});
 await context.addInitScript(language=>{sessionStorage.setItem('ramsider.age18.session.v3','confirmed');localStorage.setItem('ramsider.locale',language);},language);
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 for(const name of pages){
  const path=['privacy','delivery-policy','terms-of-sale','contact'].includes(name)?`${language}/${name}/index.html`:`${name}.html`;
  const route=name==='product-card'?'product-info':name;const response=await page.goto(app?`${app}/${language}/${route}`:`http://127.0.0.1:3190/${path}`);await page.evaluate(()=>document.fonts.ready);if(app){await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.locator('[data-package-ready]').waitFor();await page.locator('#uno-document').evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY,behavior:'instant'}));}else if(name==='reserve')await page.evaluate(()=>window.RamsiderOptionsReady);if(editorial){await page.evaluate(({editorial,language})=>{for(const lang of ['en','ar'])Object.assign(window.RAMSIDER_TRANSLATIONS[lang],editorial[lang]);window.RamsiderI18n.setLocale(language);},{editorial,language});}
  const actual=await page.evaluate(()=>({width:innerWidth,dpr:devicePixelRatio,language:document.documentElement.lang,height:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth-innerWidth}));
  if(response.status()!==200||actual.language!==language)throw Error(`Source reference ${name}/${language}`);
  await page.screenshot({path:`screenshots/r69j/${folder}/${name}-${language}-top.png`});
  const points=name==='reserve'?['accessories','reserve','final-payment']:name==='terms-of-sale'?[language==='ar'?'ar-section-4':'section-4',language==='ar'?'ar-section-7':'section-7']:name==='product-card'?['certificates']:name==='capsules'?['smart-qr']:name==='compare'?['shared']:[];
  for(const id of points){await page.locator(`[id="${id}"]`).evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`screenshots/r69j/${folder}/${name}-${language}-${id}.png`});}
  rows.push({name,...actual});
 }
 if(errors.length){await fs.writeFile(`screenshots/r69j/${folder}-browser-errors.json`,JSON.stringify(errors,null,2));throw Error(`${errors.length} browser errors, saved localdiagnostic`);}await context.close();
}
await browser.close();await fs.writeFile(`docs/evidence/r69j/${folder}.json`,JSON.stringify({date:'2026-10-26',mode:`WebKit${width}x${height}DPR3/reduced-motion for stable sourcegold phase`,source:app?'actualNextapp after Beta notice crop':editorial?'suppliedsource plus DECLARED authoredheading/PREVIEWtext overrides only; CSSunchanged':'provided site mirror,48files byteexact package mirror',rows},null,2)+'\n');console.log({references:rows.length});
