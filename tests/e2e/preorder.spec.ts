import {test,expect,type Page} from '@playwright/test';
import {createHash} from 'node:crypto';
import legalOriginals from '../../docs/evidence/r69j/legal-originals.json' with {type:'json'};
const routes=['reserve','pro','gold','compare','product-info','capsules','terms','returns','privacy','delivery-policy','terms-of-sale','contact','age-gate'];
const locales=['en','ru','de','fr','es','it','tr','ar','zh','ja','ko'];
test.use({reducedMotion:'reduce'});
test.beforeEach(async({page})=>{await page.addInitScript(()=>sessionStorage.setItem('ramsider.age18.session.v3','confirmed'));});
async function ready(page:Page){await page.locator('#uno-document[data-package-ready]').waitFor();}
async function preview(page:Page){await page.locator('#country').selectOption('AE');await page.locator('#age').check();await page.locator('#terms').check();await page.locator('#reserve-button').click();await expect(page.locator('#confirmation')).toBeVisible();}

test('configuration: AED source schedules, query priority and both model states',async({page})=>{
 await page.goto('/en/reserve?model=gold&model=pro');await ready(page);
 await expect(page.locator('#model-gold')).toBeChecked();await expect(page.locator('[data-bind=name]')).toHaveCount(6);
 for(const el of await page.locator('[data-bind=name]').all())await expect(el).toHaveText('UNO Gold Line');
 await expect(page.locator('[data-bind=initial]').first()).toContainText('3,700');await expect(page.locator('[data-bind=final]').first()).toContainText('3,640');await expect(page.locator('[data-bind=total]').first()).toContainText('7,340');
 await expect(page.locator('[data-bind=initialAed]').first()).toContainText('999');await expect(page.locator('#pay-now')).toBeDisabled();
 await page.locator('#model-pro').check();await expect(page.locator('[data-bind=initial]').first()).toContainText('2,200');await expect(page.locator('[data-bind=final]').first()).toContainText('1,470');await expect(page.locator('[data-bind=total]').first()).toContainText('3,670');
 await page.reload();await ready(page);await expect(page.locator('#model-pro')).toBeChecked();
});

test('configuration: all eight accessories, pack exclusivity and unpriced AED totals',async({page})=>{
 await page.goto('/en/reserve?model=gold');await ready(page);await expect(page.locator('input[name=accessories]')).toHaveCount(8);
 await page.locator('#option-extra-battery').check();await page.locator('#option-self-fill-20').check();await page.locator('#option-self-fill-50').check();await expect(page.locator('#option-self-fill-20')).not.toBeChecked();
 await page.locator('#option-hose-mouthpiece-connector-set').check();await expect(page.locator('#accessories-total')).toContainText('request');await expect(page.locator('[data-bind=initial]').first()).toContainText('3,700');await expect(page.locator('[data-bind=initial]').first()).toContainText('request');await expect(page.locator('[data-bind=initialAed]').first()).toContainText('1,369');await expect(page.locator('#order-final')).toContainText('3,640');
 await page.locator('#model-pro').check();await expect(page.locator('[data-bind=initialAed]').first()).toContainText('869');await expect(page.locator('#order-final')).toContainText('1,470');await expect(page.locator('#order-total-reference')).toContainText('1,269');
 await page.locator('#country').selectOption('DE');await expect(page.locator('#order-total-reference')).toContainText('EUR');await expect(page.locator('#order-total-reference')).toContainText('USD');await expect(page.locator('#order-total')).toContainText('3,670');
});

test('configuration: canonical countries and restricted markets cannot submit',async({page})=>{
 await page.goto('/en/reserve');await ready(page);await expect(page.locator('#reserve-button')).toBeDisabled();expect(await page.locator('#country option').count()).toBeGreaterThan(240);await expect(page.locator('#country option[value=OTHER]')).toHaveCount(0);
 for(const code of['IN','TH','TR','QA']){await page.locator('#country').selectOption(code);await expect(page.locator('#reserve-button')).toBeDisabled();await expect(page.locator('#market-notice')).toBeVisible();await expect(page.locator('#confirmation')).toBeHidden();}
 await page.locator('#country').selectOption('AE');await expect(page.locator('#reserve-button')).toBeEnabled();
});

test('configuration: optional contacts, validation, truthful preview and edit reset',async({page})=>{
 const posts:string[]=[];page.on('request',r=>{if(r.method()!=='GET')posts.push(r.url());});
 await page.goto('/en/reserve');await ready(page);await page.locator('#country').selectOption('AE');await page.locator('#reserve-button').click();await expect(page.locator('#age')).toHaveAttribute('aria-invalid','true');await expect(page.locator('#terms')).toHaveAttribute('aria-invalid','true');
 await preview(page);await expect(page.locator('#reservation-number')).toHaveText('PREVIEW');await expect(page.locator('#confirmation-status')).toContainText('Nothing has been sent');await expect(page.locator('#pay-now')).toBeDisabled();expect(posts).toEqual([]);
 await page.locator('#email').fill('bad-email');await expect(page.locator('#confirmation')).toBeHidden();await page.locator('#reserve-button').click();await expect(page.locator('#email')).toHaveAttribute('aria-invalid','true');
 await page.locator('#email').fill('  person@example.com  ');await page.locator('#reserve-button').click();await expect(page.locator('#confirmation')).toBeVisible();await expect(page.locator('#email')).toHaveValue('person@example.com');expect(posts).toEqual([]);
});

test('configuration: EN AR keeps typed fields, errors, options and preview',async({page})=>{
 await page.goto('/en/reserve?model=gold&src=booklet');await ready(page);await page.locator('#full-name').fill('Alexandr');await page.locator('#option-self-fill-100').check();await page.locator('#country').selectOption('AE');await page.locator('#email').fill('bad');await page.locator('#age').check();await page.locator('#terms').check();await page.locator('#reserve-button').click();const error=await page.locator('#email-error').textContent();
 await page.locator('[data-language=ar]').first().click();await expect(page).toHaveURL(/\/ar\/reserve\?model=gold&src=booklet/);await expect(page.locator('.uno-package-root')).toHaveAttribute('dir','rtl');await expect(page.locator('#full-name')).toHaveValue('Alexandr');await expect(page.locator('#option-self-fill-100')).toBeChecked();await expect(page.locator('#country')).toHaveValue('AE');await expect(page.locator('#email-error')).not.toHaveText(error!);
 await page.locator('#email').fill('person@example.com');await page.locator('#reserve-button').click();await expect(page.locator('#confirmation')).toBeVisible();await page.locator('[data-language=en]').first().click();await expect(page.locator('#confirmation')).toBeVisible();await expect(page.locator('#reservation-number')).toHaveText('PREVIEW');await expect(page.locator('#confirmation-email')).toHaveText('person@example.com');await expect(page.locator('#option-self-fill-100')).toBeChecked();
});

test('age: direct access, legal escape, acceptance, reload and pageshow recheck',async({browser},testInfo)=>{
 const context=await browser.newContext({...testInfo.project.use});const page=await context.newPage();await page.goto('/en/reserve?model=gold');await ready(page);await expect(page.locator('[data-site-age-gate]')).toBeVisible();await expect(page.locator('[data-age-content]')).toBeHidden();
 await page.locator('[data-site-age-gate] a').click();await expect(page).toHaveURL(/\/en\/privacy#/);await page.locator('#uno-document[data-document=privacy][data-package-ready]').waitFor();await page.waitForLoadState('networkidle');await expect(page.locator('[data-site-age-gate]')).toHaveCount(0);
 await page.goto('/en/reserve?model=gold');await ready(page);await page.locator('[data-age-confirm]').click();await expect(page.locator('[data-age-content]')).toBeVisible();await page.reload();await ready(page);await expect(page.locator('[data-site-age-gate]')).toBeHidden();
 await page.evaluate(()=>{sessionStorage.removeItem('ramsider.age18.session.v3');dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));});await expect(page.locator('[data-site-age-gate]')).toBeVisible();await page.locator('[data-age-leave]').click();await expect(page).toHaveURL('about:blank');await context.close();
});

test('age: blocked storage and no JavaScript remain fail closed',async({browser},testInfo)=>{
 const context=await browser.newContext({...testInfo.project.use});await context.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};});const page=await context.newPage();await page.goto('/ar/reserve');await ready(page);await expect(page.locator('[data-site-age-gate]')).toBeVisible();await page.locator('[data-age-confirm]').click();await expect(page.locator('[data-age-content]')).toBeVisible();await page.locator('[data-language=en]').first().click();await expect(page.locator('[data-age-content]')).toBeVisible();await page.reload();await ready(page);await expect(page.locator('[data-site-age-gate]')).toBeVisible();await context.close();
 const nojs=await browser.newContext({...testInfo.project.use,javaScriptEnabled:false});const p=await nojs.newPage();await p.goto('/en/reserve');await expect(p.locator('[data-site-age-gate]')).toBeVisible();await expect(p.locator('[data-age-content]')).toBeHidden();await expect(p.locator('#reserve-button')).toBeDisabled();await p.locator('[data-site-age-gate] a').click();await expect(p.locator('h1')).toContainText('PRIVACY');await nojs.close();
});

test('age: standalone next stays on allowlisted same origin routes',async({page})=>{
 await page.goto('/en/age-gate?next=https%3A%2F%2Fevil.invalid%2Freserve.html');await ready(page);await page.locator('[data-age-confirm]').click();await expect(page).toHaveURL(/\/en\/compare$/);
 await page.goto('/en/age-gate?next=reserve.html%3Fmodel%3Dgold%23accessories');await ready(page);await page.locator('[data-age-confirm]').click();await expect(page).toHaveURL(/\/en\/reserve\?model=gold#accessories/);await expect(page.locator('#model-gold')).toBeChecked();
});

test('documents: EN AR route structure, no errors, no unpublished WhatsApp metadata and full contracts',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(const language of['en','ar'])for(const route of routes){const response=await page.goto(`/${language}/${route}`);expect(response?.status()).toBe(200);await ready(page);await expect(page.locator('footer')).toHaveCount(1);await expect(page.locator('[data-whatsapp-url]')).toHaveCount(0);await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  if(route==='terms-of-sale'){await expect(page.locator(`[data-sale-language=${language}]`)).toBeVisible();await expect(page.locator(`[data-sale-language=${language==='en'?'ar':'en'}]`)).toBeHidden();}
  if(language==='ar'&&['privacy','delivery-policy'].includes(route))await expect(page.locator('[lang=en][dir=ltr]').first()).toBeVisible();
 }
 expect(errors).toEqual([]);
});

test('integration: locale fallback, current footer destinations, CTA and new FAQ',async({page})=>{
 test.setTimeout(120000);
 for(const language of locales){await page.goto(`/${language}/terms`);await ready(page);await expect(page.locator('.uno-package-root')).toHaveAttribute('lang',language==='ar'?'ar':'en');if(!['en','ar'].includes(language))await expect(page.locator('[data-source-original]')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);}
 await page.goto('/en');await page.evaluate(()=>document.fonts.ready);
 for(const id of['hero-reserve','order-create','final-create'])await expect(page.locator(`#${id}`)).toHaveAttribute('href','/en/reserve');
 const links=page.locator('.site-footer__legal a');await expect(links).toHaveCount(8);const hrefs=await links.evaluateAll(nodes=>nodes.map(el=>el.getAttribute('href')));for(const route of['product-info','terms','returns','privacy','capsules','delivery-policy','terms-of-sale','contact'])expect(hrefs).toContain(`/en/${route}`);
 await page.locator('#faq-preorder').click();const text=page.locator('#faq-preorder').locator('..');await expect(text).toContainText('first card payment');await expect(text).not.toContainText('50 %');await expect(text.locator('a')).toHaveAttribute('href','/en/terms-of-sale');await expect(text.locator('span[lang=en]')).toBeVisible();
 await page.locator('#order-create').focus();await page.keyboard.press('Enter');await ready(page);await expect(page).toHaveURL(/\/en\/reserve$/);
});

test('integration: QR aliases preserve every query pair and old privacy moves forward',async({page})=>{
 for(const [path,target]of[['/?src=wall&campaign=a&campaign=b','/en/compare'],['/contact?src=flyer&campaign=a&campaign=b','/en/contact'],['/privacy?src=booklet','/en/privacy'],['/delivery-policy?src=wall','/en/delivery-policy'],['/terms-of-sale?src=booklet','/en/terms-of-sale'],['/ru/privacy-ru?src=old','/ru/privacy']]){
  await page.goto(path);await ready(page);const url=new URL(page.url());expect(url.pathname).toBe(target);const original=new URL(path,'https://qa.invalid');expect([...url.searchParams]).toEqual([...original.searchParams]);
 }
 await page.goto('/');await expect(page).toHaveURL(/\/en$/);
});

test('contact: mail links, disabled form and sanitized source without persistence or posts',async({page})=>{
 const posts:string[]=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
 for(const source of['flyer','booklet','presentation','bad value', 'x'.repeat(65)]){await page.goto(`/ar/contact?src=${encodeURIComponent(source)}`);await ready(page);await expect(page.locator('#contact-source')).toHaveValue(/^[A-Za-z0-9_-]{1,64}$/.test(source)?source:'');await expect(page.locator('#contact-form fieldset')).toHaveAttribute('disabled','');for(const control of await page.locator('#contact-form :is(input:not([type=hidden]),select,textarea,button)').all())await expect(control).toBeDisabled();await expect(page.locator('#contact-whatsapp')).toBeDisabled();}
 await expect(page.locator('a[href^="mailto:partners@ramsider.com"]')).toBeVisible();await expect(page.locator('a[href="mailto:support@ramsider.com"]')).toBeVisible();expect(posts).toEqual([]);
});

test('contract: source verbatim EN AR originals, proper anchors and language switch',async({page})=>{
 test.setTimeout(90000);
 for(const language of['en','ar']){
  await page.goto(`/${language}/terms-of-sale#clause-4.6.2`);await ready(page);const article=page.locator(`[data-sale-language=${language}]`);
  const normalize=(text:string)=>text.replace(/\s+/g,' ').trim();expect(createHash('sha256').update(normalize(await article.textContent()??'')).digest('hex')).toBe(legalOriginals.languages[language as 'en'|'ar'].normalizedTextSha256);
  const target=page.locator(`[id="${language==='ar'?'ar-':''}clause-4.6.2"]`);await expect(target).toBeVisible();expect((await target.boundingBox())!.y).toBeGreaterThanOrEqual(-1);expect((await target.boundingBox())!.y).toBeLessThan(80);
  const other=language==='en'?'ar':'en';await page.locator(`[data-language=${other}]`).first().click();await expect(page).toHaveURL(url=>url.pathname===`/${other}/terms-of-sale`&&url.hash===`#${other==='ar'?'ar-':''}clause-4.6.2`);await expect(page.locator(`[data-sale-language=${other}]`)).toBeVisible();
 }
});

test('clipboard: rejected API leaves selectable truthful preview and no stale completion',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('denied'))}});document.execCommand=()=>false;});await page.goto('/en/reserve');await ready(page);await preview(page);await page.locator('#copy-number').click();await expect(page.locator('#copy-status')).toContainText('PREVIEW');expect(await page.evaluate(()=>getSelection()?.toString())).toBe('PREVIEW');await page.locator('#option-extra-battery').check();await expect(page.locator('#confirmation')).toBeHidden();
});

test('adaptation: narrow phones, short height, safe areas, tablet, desktop and 200 percent layout',async({page},info)=>{
 test.skip(info.project.name!=='desktop-chromium','One Chromium adaptation matrix; both mobile WebKit profiles have dedicated route/state checks.');test.setTimeout(120000);
 for(const [width,height]of[[320,740],[375,812],[402,580],[768,1024],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const language of['en','ar'])for(const route of['reserve','compare','contact','terms-of-sale']){await page.goto(`/${language}/${route}`);await ready(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);if((width===375&&language==='en'&&route==='compare')||(width===768&&language==='ar'&&route==='terms-of-sale')||(width===1440&&language==='en'&&route==='reserve'))await page.screenshot({path:`screenshots/r69j/adaptation-${width}-${language}-${route}.png`});}
 }
 await page.setViewportSize({width:402,height:874});await page.goto('/ar/reserve');await ready(page);
 await page.locator('.uno-package').evaluate(el=>{(el as HTMLElement).style.setProperty('--up-safe-left','20px');(el as HTMLElement).style.setProperty('--up-safe-right','20px');(el as HTMLElement).style.setProperty('--up-safe-top','24px');(el as HTMLElement).style.setProperty('--up-safe-bottom','24px');});await page.locator('#country').scrollIntoViewIfNeeded();const box=(await page.locator('#country').boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(20);expect(box.x+box.width).toBeLessThanOrEqual(382);await page.screenshot({path:'screenshots/r69j/adaptation-safe-ar.png'});
 await page.goto('/en/reserve');await ready(page);await page.evaluate(()=>{document.documentElement.style.zoom='2'});await page.locator('#country').scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);await page.screenshot({path:'screenshots/r69j/adaptation-zoom200.png'});
});

test('keyboard: model radios, native selector, consents, focus and usable controls',async({page})=>{
 await page.goto('/en/reserve');await ready(page);await page.locator('#model-pro').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('#model-gold')).toBeChecked();
 await page.locator('#country').focus();await expect(page.locator('#country')).toBeFocused();await page.selectOption('#country','AE');await page.locator('#age').focus();await page.keyboard.press('Space');await expect(page.locator('#age')).toBeChecked();await page.locator('#terms').focus();await page.keyboard.press('Space');await expect(page.locator('#terms')).toBeChecked();await page.locator('#reserve-button').focus();expect(await page.locator('#reserve-button').evaluate(el=>el.matches(':focus-visible'))).toBe(true);await page.keyboard.press('Enter');await expect(page.locator('#confirmation')).toBeVisible();await expect(page.locator('#confirmation-title')).toBeFocused();
 for(const selector of['#country','#reserve-button','#copy-number','[data-language=en]']){const bounds=await page.locator(selector).first().boundingBox();if(bounds)expect(bounds.height).toBeGreaterThanOrEqual(44);}
});

test('gold: real intermediate motion resolves every keyframe and reduced motion stops it',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/en/compare');await ready(page);
 const missing=await page.evaluate(()=>{const names=new Set<string>();function visit(rules:CSSRuleList){for(const rule of [...rules]){if(rule instanceof CSSKeyframesRule)names.add(rule.name);if('cssRules'in rule)visit((rule as CSSGroupingRule).cssRules);}}for(const sheet of [...document.styleSheets])visit(sheet.cssRules);const missing=new Set<string>();for(const el of [...document.querySelectorAll('#uno-document *')])for(const pseudo of[null,'::before','::after'])for(const name of getComputedStyle(el,pseudo).animationName.split(',').map(v=>v.trim()))if(name!=='none'&&!names.has(name))missing.add(name);return [...missing];});expect(missing).toEqual([]);
 const line=page.locator('.up-section').first();const before=await line.evaluate(el=>getComputedStyle(el).backgroundPosition);await page.waitForTimeout(550);const after=await line.evaluate(el=>getComputedStyle(el).backgroundPosition);expect(after).not.toBe(before);await page.screenshot({path:`screenshots/r69j/${test.info().project.name}-gold-motion.png`});
 await page.emulateMedia({reducedMotion:'reduce'});expect(await line.evaluate(el=>getComputedStyle(el).animationName)).toBe('none');const state=await line.evaluate(el=>getComputedStyle(el).backgroundPosition);await page.waitForTimeout(150);expect(await line.evaluate(el=>getComputedStyle(el).backgroundPosition)).toBe(state);
 const language=page.locator('[data-language=en]').first();expect(await language.evaluate(el=>getComputedStyle(el).backgroundClip)).not.toBe('text');
});


test('history: Back reconciles locale, anchors and model without discarding typed fields',async({page})=>{
 await page.goto('/en/terms-of-sale#section-3');await ready(page);await page.evaluate(()=>{location.hash='#section-4'});await page.locator('[data-language=ar]').first().click();await expect(page).toHaveURL(/\/ar\/terms-of-sale#ar-section-4$/);await page.goBack();await expect(page).toHaveURL(/\/en\/terms-of-sale#section-3$/);await expect(page.locator('.uno-package-root')).toHaveAttribute('lang','en');await expect(page.locator('[data-sale-language=en]')).toBeVisible();
 await page.goto('/en/reserve?model=pro#configure');await ready(page);await page.locator('#full-name').fill('History draft');await page.locator('a[href="#reserve"]').first().focus();await page.keyboard.press('Enter');await page.locator('#model-gold').check();await page.locator('[data-language=ar]').first().click();await page.goBack();await expect(page).toHaveURL(/\/en\/reserve\?model=pro#configure$/);await expect(page.locator('.uno-package-root')).toHaveAttribute('lang','en');await expect(page.locator('#model-pro')).toBeChecked();await expect(page.locator('#full-name')).toHaveValue('History draft');await expect(page.locator('[data-bind=initial]').first()).toContainText('2,200');
});
