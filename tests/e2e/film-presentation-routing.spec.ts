import {test,expect,devices} from '@playwright/test';
import {silenceTestMedia} from './silent-media';
import {mkdir} from 'node:fs/promises';
test('Android Chrome retains real element fullscreen and never selects iPhone mode',async({browser},info)=>{
 test.skip(info.project.name!=='desktop-chromium','Real Chromium API with Android mobile UA; not physical Android proof');
 const context=await browser.newContext({...devices['Pixel 7'],serviceWorkers:'block'});await silenceTestMedia(context);const page=await context.newPage();
 try{
  await page.goto('/en?iphonePlayer=window');await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();await page.locator('.film-gallery__hero').click();await expect(page.locator('#film-player')).toHaveAttribute('data-controls','ready');
  await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime),{timeout:20000}).toBeGreaterThan(.2);await page.locator('.film-fullscreen').click();await expect.poll(()=>page.evaluate(()=>document.fullscreenElement?.id)).toBe('film-player');
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');await page.locator('.film-options__trigger').click();await expect(page.locator('.film-menu-native')).toHaveCount(0);await page.keyboard.press('Escape');
  await mkdir('screenshots/video/iphone-window',{recursive:true});await page.screenshot({path:'screenshots/video/iphone-window/android-real-element.png'});await page.locator('.film-fullscreen').click();await expect.poll(()=>page.evaluate(()=>document.fullscreenElement===null)).toBe(true);
 }finally{await context.close();}
});
