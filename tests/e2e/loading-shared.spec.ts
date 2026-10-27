import {expect,test,type Locator} from '@playwright/test';
test.use({serviceWorkers:'block'});
async function appearance(status:Locator){return status.locator('.media-orbit__milk').evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {width:r.width,height:r.height,radius:s.borderRadius,background:s.backgroundImage,blur:s.backdropFilter,animation:s.animationName};});}
for(const locale of ['en','ar'])test(`gallery milk circles share appearance, RTL and reduced motion: ${locale}`,async({page},info)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 let release!:()=>void;const held=new Promise<void>(r=>{release=r;});
 await page.route('**/art/**/*.webp',async route=>{if(route.request().resourceType()==='fetch')await held;await route.continue().catch(()=>{});});
 try{
  await page.goto('/'+locale);await expect(page.locator('html')).toHaveAttribute('data-media-hydrated','');
  await page.locator('[data-wellness-open]').first().evaluate((e:HTMLElement)=>e.click());await expect(page.locator('.wellness-photo img').first()).toHaveAttribute('data-preview','ready');await page.locator('.wellness-photo img').first().evaluate((e:HTMLImageElement)=>e.src='data:image/webp;base64,AA==');
  const wellness=page.locator('#wellness-viewer .media-loading');await expect(wellness).toBeVisible();await expect(wellness.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');await expect.poll(async()=>(await appearance(wellness)).width).toBe(72);const reference=await appearance(wellness);expect(reference).toMatchObject({width:72,height:72,radius:'50%',blur:'blur(12px)',animation:'none'});expect(reference.background).toContain('conic-gradient');await page.locator('#wellness-viewer').evaluate((e:HTMLDialogElement)=>e.close());
  await page.locator('[data-section-previews]').evaluate(script=>{const data=JSON.parse(script.textContent!);data['/art/technology/slides/noble-01.webp'].src='data:image/webp;base64,AA==';script.textContent=JSON.stringify(data);});await page.locator('[data-technology-open]').first().evaluate((e:HTMLElement)=>e.click());const tech=page.locator('#technology-viewer .media-loading');await expect(tech).toBeVisible();expect(await appearance(tech)).toEqual(reference);await expect(tech).toHaveAttribute('aria-live','polite');if(locale==='ar')await expect(tech).toHaveAttribute('dir','rtl');await expect(tech.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');await expect(tech.locator('.media-loading__track')).toHaveCount(0);await page.screenshot({path:`screenshots/loading-flow/shared-${info.project.name}-${locale}.png`});await page.keyboard.press('Escape');
 }finally{release();}
});
