import {expect,test} from '@playwright/test';
import en from '../../lib/preorder/en.json' with {type:'json'};
import ar from '../../lib/preorder/ar.json' with {type:'json'};
import {silenceTestMedia} from './silent-media';
const dictionaries={en,ar};
const features={pro1:'compare.part7',pro2:'pro.text17',pro3:'pro.text18',pro4:'pro.text19',pro5:'pro.text20',gold1:'gold.text16',gold2:'compare.part8',gold3:'gold.text18',gold4:'gold.text19',gold5:'gold.text20'} as const;
const payments={proInitial:['compare.text45','pro.initial.reference'],goldInitial:['gold.price.initial','gold.initial.reference'],proFinal:['compare.text52','pro.final.reference'],goldFinal:['compare.text55','gold.final.reference']} as const;
test.beforeEach(async({page})=>{await silenceTestMedia(page);await page.addInitScript(()=>sessionStorage.setItem('ramsider.age18.session.v3','confirmed'));});
test('landing source features and AED payments stay in their columns',async({page},info)=>{
 for(const language of ['en','ar'] as const){
  await page.goto(`/${language}`);await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>innerWidth)).toBe(info.project.use.viewport!.width);
  for(const [key,source] of Object.entries(features))await expect(page.locator(`.key-${key}`)).toHaveText(dictionaries[language][source as keyof typeof en]);
  for(const [key,[amount,reference]] of Object.entries(payments)){
   const el=page.locator(`.key-${key}`);await expect(el.locator('.home-payment__amount')).toContainText(dictionaries[language][amount]);await expect(el.locator('.home-payment__reference')).toHaveText(dictionaries[language][reference]);
   expect(await el.evaluate(el=>{const box=el.getBoundingClientRect();return [...el.querySelectorAll('span')].every(span=>{const range=document.createRange();range.selectNodeContents(span);return [...range.getClientRects()].every(rect=>rect.left>=box.left-1&&rect.right<=box.right+1)})})).toBe(true);
  }
  expect(await page.locator('.key-pro2b,.key-gold1b,.key-gold2b,.key-gold3b').count()).toBe(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('old product card aliases preserve locale, query and hash',async({page})=>{
 for(const language of ['en','ar']){const response=await page.goto(`/${language}/product-card?src=review#included`);expect(response?.status()).toBe(200);await expect(page).toHaveURL(new RegExp(`/${language}/product-info\\?src=review#included$`));await expect(page.locator('#included')).toBeVisible();}
});
test('Arabic anchors and language switch route to source sections',async({page})=>{
 for(const [name,anchor] of [['pro','technology'],['gold','technology'],['capsules','faq-ranges'],['compare','order'],['reserve','configure'],['product-info','included']] as const){
  await page.goto(`/ar/${name}#${anchor}`);await page.locator('#uno-document[data-package-ready]').waitFor();await expect(page.locator(`#${anchor}`)).toBeVisible();await expect(page.locator('.uno-package-root')).toHaveAttribute('dir','rtl');await page.locator('[data-language=en]').first().click();await expect(page).toHaveURL(new RegExp(`/en/${name}#${anchor}$`));await expect(page.locator(`#${anchor}`)).toBeVisible();await page.locator('[data-language=ar]').first().click();await expect(page).toHaveURL(new RegExp(`/ar/${name}#${anchor}$`));
 }
});
test('all home locales use current source facts with a truthful language tag',async({page},info)=>{
 test.skip(info.project.name!=='iphone-17-pro-webkit','Locale matrix runs once on the Pro baseline.');
 for(const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']){
  await page.goto(`/${locale}`);const language=locale==='ar'?'ar':'en';
  for(const [key,source] of Object.entries(features)){const node=page.locator(`.key-${key}`);await expect(node).toHaveText(dictionaries[language][source as keyof typeof en]);await expect(node).toHaveAttribute('lang',language);}
  for(const [key,[amount,reference]] of Object.entries(payments)){const node=page.locator(`.key-${key}`);await expect(node).toHaveAttribute('lang',language);await expect(node).toContainText(dictionaries[language][amount]);await expect(node).toContainText(dictionaries[language][reference]);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
test('Arabic homepage certificate controls retain their six PDF destinations',async({page})=>{
 await page.goto('/ar');for(const [id,path]of Object.entries({electrical:'electrical-safety',emc:'emc',uae:'uae-conformity',rohs:'rohs',telecom:'uae-telecom',all:'all-certificates'})){
  const link=page.locator(id==='all'?'#documents-all':`#document-${id}`);await expect(link).toHaveAttribute('href',`/certificates/${path}.pdf`);await expect(link).toHaveAttribute('target','_blank');
 }
});
test('adaptation: changed content stays separate at phone, tablet and desktop widths',async({page},info)=>{
 test.skip(info.project.name!=='desktop-chromium','Adaptive matrix is run once with explicit viewport sizes.');
 for(const width of [320,375,402,440,768,1440])for(const language of ['en','ar']){
  await page.setViewportSize({width,height:900});await page.goto(`/${language}`);await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  for(const model of ['pro','gold']){
   for(let i=1;i<5;i++){
    const [a,b]=await Promise.all([page.locator(`.key-${model}${i}`).boundingBox(),page.locator(`.key-${model}${i+1}`).boundingBox()]);expect(a!.y+a!.height).toBeLessThanOrEqual(b!.y+1);
   }
   const [last,button]=await Promise.all([page.locator(`.key-${model}5`).boundingBox(),page.locator(`#${model}-explore`).boundingBox()]);expect(last!.y+last!.height).toBeLessThanOrEqual(button!.y+1);
  }
  for(const key of Object.keys(payments)){
   expect(await page.locator(`.key-${key}`).evaluate(el=>{const box=el.getBoundingClientRect();return [...el.querySelectorAll('span')].every(span=>{const range=document.createRange();range.selectNodeContents(span);return [...range.getClientRects()].every(rect=>rect.left>=box.left-1&&rect.right<=box.right+1)})})).toBe(true);
  }
 }
});
test('shipping FAQ keeps the current delivery link and no pending-text notice',async({page})=>{
 await page.goto('/en#faq-shipping');const row=page.locator('#faq-shipping').locator('..');await page.locator('#faq-shipping').click();await expect(row).not.toContainText('full text pending');await expect(row).toContainText('§6.3');await expect(row.locator('a')).toHaveAttribute('href','/en/delivery-policy');
});
