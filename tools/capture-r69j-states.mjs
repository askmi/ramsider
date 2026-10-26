import {webkit,devices} from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL??'http://127.0.0.1:3000';const browser=await webkit.launch();const rows=[];
for(const width of[402,440])for(const language of['en','ar']){
 const context=await browser.newContext({...devices['iPhone 17 Pro'],viewport:{width,height:width===402?874:956},deviceScaleFactor:3,reducedMotion:'reduce'});await context.addInitScript(language=>{sessionStorage.setItem('ramsider.age18.session.v3','confirmed');localStorage.setItem('ramsider.locale',language)},language);const page=await context.newPage();
 const folder=`screenshots/r69j/states-${width}`;await fs.mkdir(folder,{recursive:true});
 for(const source of[true,false]){
  await page.goto(source?'http://127.0.0.1:3190/reserve.html':`${base}/${language}/reserve`);await page.evaluate(()=>document.fonts.ready);if(source)await page.evaluate(()=>window.RamsiderOptionsReady);else await page.locator('[data-package-ready]').waitFor();
  for(const[id,label]of[['full-name','fields'],['country','country-consents'],['age','consents-actions']]){await page.locator(`#${id}`).evaluate(el=>el.closest('label')?.scrollIntoView({block:'start',behavior:'instant'})??el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`${folder}/${source?'source':'actual'}-${language}-${label}.png`});}
  if(!source){
   const select=await page.locator('#country').boundingBox();rows.push({width,language,countrySelect:select,heightAtLeast44:select.height>=44});
   await page.locator('#country').selectOption('AE');await page.locator('#age').check();await page.locator('#terms').check();await page.locator('#reserve-button').click();await page.locator('#confirmation').waitFor();await page.locator('#confirmation-title').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.screenshot({path:`${folder}/actual-${language}-preview.png`});
   await page.locator('#copy-number').evaluate(el=>el.scrollIntoView({block:'end',behavior:'instant'}));await page.screenshot({path:`${folder}/actual-${language}-preview-actions.png`});
  }
 }
 await context.close();
}
await browser.close();await fs.writeFile('docs/evidence/r69j/form-states.json',JSON.stringify({date:'2026-10-26',rows},null,2)+'\n');console.log({states:rows.length});
