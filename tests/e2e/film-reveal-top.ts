import {expect,type Page} from '@playwright/test';
/** Real pointer activity reveals the deliberately auto-hidden chrome before a top action. */
export async function revealFilmTop(page:Page){
 if(await page.locator('#film-player').evaluate(el=>el.hasAttribute('userinactive'))){
  const b=(await page.locator('video').boundingBox())!,x=b.x+b.width/2,y=b.y+b.height/2;
  if(await page.evaluate(()=>matchMedia('(pointer:coarse)').matches))await page.locator('video').tap({position:{x:b.width/2,y:b.height/2}});
  else{await page.mouse.move(x-2,y);await page.mouse.move(x,y);}
 }
 await expect.poll(()=>page.locator('.film-player__top').evaluate(el=>Number(getComputedStyle(el).opacity))).toBe(1);
}
