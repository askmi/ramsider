import {test,expect,type Page} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {waitForVisibleMedia} from './helpers/media';
import {t,type Locale} from '../../lib/i18n';
import {silenceTestMedia} from './silent-media';
const root=process.env.INFO_DIALOG_CAPTURE_DIR??'screenshots/info-dialogs/default';
const panels=['unavailable-commerce','unavailable-account','unavailable-compare','unavailable-pro','unavailable-gold','unavailable-set','project-detail-4'];
async function press(page:Page,selector:string){if(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches))await page.locator(selector).tap();else await page.locator(selector).click();}
async function open(page:Page,id:string){const trigger=id==='unavailable-commerce'?page.locator('#hero-reserve'):page.locator(`.canvas [popovertarget="${id}"]`).first();await trigger.scrollIntoViewIfNeeded();await waitForVisibleMedia(page);await trigger.click();await expect(page.locator(`#${id}`)).toBeVisible();return trigger;}
async function check(page:Page,id:string){
 const d=page.locator(`#${id}`),close=d.locator('.availability__close');
 await expect(close).toHaveAccessibleName(t(await page.locator('html').getAttribute('lang') as Locale,'close'));
 await expect(close).toHaveClass('availability__close');await expect(close).toHaveText('×');
 const geometry=await d.evaluate(el=>{const box=el.getBoundingClientRect(),button=el.querySelector('.availability__close')!,r=button.getBoundingClientRect(),title=el.querySelector('h2')!.getBoundingClientRect(),body=el.querySelector('.availability__body')!,b=body.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{width:r.width,height:r.height,top:r.top-box.top,right:box.right-r.right,titleGap:r.left-title.right,hit:hit===button||button.contains(hit),bodyOverlap:r.bottom>b.top+.5,overflow:el.scrollWidth>el.clientWidth+1,bodyHorizontalOverflow:body.scrollWidth>body.clientWidth+1,viewportOverflow:document.documentElement.scrollWidth>innerWidth};});
 expect(geometry.width).toBe(44);expect(geometry.height).toBe(44);expect(geometry.top).toBeCloseTo(9,0);expect(geometry.right).toBeCloseTo(9,0);expect(geometry.titleGap).toBeGreaterThanOrEqual(11);expect(geometry.hit).toBe(true);expect(geometry.bodyOverlap).toBe(false);expect(geometry.overflow).toBe(false);expect(geometry.bodyHorizontalOverflow).toBe(false);expect(geometry.viewportOverflow).toBe(false);
 const body=d.locator('.availability__body');await body.focus();await page.keyboard.press('End');
 await expect.poll(()=>body.evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-2)).toBe(true);
 const last=body.locator(':scope > *').last();await expect(last).toBeInViewport();
 const after=await close.boundingBox();expect(after!.y).toBeCloseTo((await d.boundingBox())!.y+9,0);
 return geometry;
}
test.beforeEach(async({page})=>{await silenceTestMedia(page);await mkdir(root,{recursive:true});});
test('all information dialogs have an independent top-right X and reachable content',async({page},info)=>{
 test.setTimeout(180000);const posts:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/api/launch-list'))posts.push(r.url());});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/en');await page.evaluate(()=>document.fonts.ready);const results=[];
 for(const id of panels){const trigger=await open(page,id);if(id==='unavailable-commerce'||id==='unavailable-compare')await page.screenshot({path:`${root}/${info.project.name}-${id}-initial.png`});results.push({id,geometry:await check(page,id)});if(id==='unavailable-commerce'||id==='unavailable-compare')await page.screenshot({path:`${root}/${info.project.name}-${id}-keyboard-scroll.png`});
 const close=page.locator(`#close-${id}`);await close.focus();for(let i=0;i<5;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement===document.body||Boolean(document.activeElement?.closest('dialog[open]')))).toBe(true);}
 await page.locator('#home-link').evaluate(el=>(el as HTMLElement).focus());await expect(page.locator('#home-link')).not.toBeFocused();await press(page,`#close-${id}`);await expect(page.locator(`#${id}`)).not.toBeVisible();await expect(trigger).toBeFocused();await trigger.press('Enter');await expect(page.locator(`#${id}`)).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator(`#${id}`)).not.toBeVisible();await expect(trigger).toBeFocused();}
 await open(page,'unavailable-commerce');const join=page.locator('#unavailable-commerce [data-launch-open]');if(await join.count()){await join.scrollIntoViewIfNeeded();await join.click();await expect(page.locator('#launch-capture')).toBeVisible();await expect(page.locator('#unavailable-commerce')).not.toBeVisible();await page.locator('#launch-capture').getByRole('button',{name:'Close',exact:true}).click();await expect(page.locator('#launch-capture')).not.toBeVisible();}
 expect(errors).toEqual([]);expect(posts).toEqual([]);await writeFile(`${root}/${info.project.name}.json`,JSON.stringify({results,errors,posts},null,2));
});
test('information close remains accessible in narrow short landscape and tablet windows',async({page},info)=>{
 test.skip(info.project.name!=='desktop-chromium','Required Pro and Max are checked by the first test');test.setTimeout(120000);await page.goto('/en');await page.evaluate(()=>document.fonts.ready);const results=[];
 for(const [width,height]of[[320,568],[402,300],[874,402],[768,1024],[1440,900]]){await page.setViewportSize({width,height});for(const id of ['unavailable-commerce','unavailable-compare','unavailable-set']){await open(page,id);results.push({width,height,id,geometry:await check(page,id)});await page.screenshot({path:`${root}/${width}x${height}-${id}.png`});await press(page,`#close-${id}`);await expect(page.locator(`#${id}`)).not.toBeVisible();}}
 await writeFile(`${root}/adaptation.json`,JSON.stringify(results,null,2));
});


test('all locale entries preserve English routing and real Arabic panels keep the X on the right',async({page},info)=>{
 test.skip(info.project.name==='iphone-17-pro-max-webkit','Pro and Chromium cover retained localized markup; Max English actual covered separately');test.setTimeout(120000);
 const locales=['en','ru','de','fr','es','it','tr','ar','zh','ja','ko'];
 for(const locale of locales){const response=await page.request.get(`/${locale}`,{maxRedirects:0});if(locale==='en')expect(response.ok()).toBe(true);else{expect([307,308]).toContain(response.status());expect(response.headers().location).toBe('/en');}}
 // Local SSG fixture only: production intentionally redirects locale entries to English.
 await page.route('**/ar',async route=>route.fulfill({contentType:'text/html',body:await readFile('.next/server/app/ar.html','utf8')}));await page.goto('/ar');await page.evaluate(()=>document.fonts.ready);await expect(page.locator('html')).toHaveAttribute('dir','rtl');const results=[];
 for(const id of panels){await open(page,id);results.push({id,geometry:await check(page,id)});if(id==='unavailable-commerce'||id==='unavailable-compare')await page.screenshot({path:`${root}/${info.project.name}-ar-${id}.png`});await press(page,`#close-${id}`);await expect(page.locator(`#${id}`)).not.toBeVisible();}
 await writeFile(`${root}/${info.project.name}-locale-rtl.json`,JSON.stringify({locales,results,policy:'English redirects retained; Arabic SSG local-only fixture'},null,2));
});
