import { test, expect, type Page } from '@playwright/test';
import { silenceTestMedia } from './silent-media';
import { emulateCustomFullscreenLayout } from './fullscreen-layout-adapter';

test.use({ serviceWorkers: 'block' });
test.setTimeout(120000);
const gold = 'rgb(247, 201, 111)', white = 'rgb(255, 255, 255)';
async function color(page: Page, selector: string, expected: string, prop = 'color') {
  await expect.poll(() => page.locator(selector).first().evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), prop)).toBe(expected);
}
async function chrome(page: Page, ink: string) {
  await page.locator("#film-player").evaluate(el=>el.removeAttribute("userinactive"));
  await expect.poll(()=>page.locator(".film-player__top").evaluate(el=>getComputedStyle(el).opacity)).toBe("1");
  for (const selector of ['.film-player__identity','.film-player__close','.film-player__list-toggle','.film-previous','.film-next','.film-fullscreen','.film-gear']) await color(page, selector, ink);
  for (const selector of ['.film-play-toggle','.film-mute-toggle','.film-time','.film-options__trigger']) {
    await expect.poll(() => page.locator(selector).evaluate(el => getComputedStyle(el.shadowRoot!.querySelector('svg, span, slot') ?? el).color)).toBe(ink);
  }
  for (const selector of ['.film-seek','.film-volume']) {
    // WebKit does not recompute display:none shadow descendants until shown.
    if (!(await page.locator(selector).isVisible())) continue;
    for (const part of ['#progress','#thumb']) await expect.poll(() => page.locator(selector).evaluate((el, part) => getComputedStyle(el.shadowRoot!.querySelector(part)!).backgroundColor, part)).toBe(ink);
  }
  const icons=await page.locator('.film-play-toggle, .film-mute-toggle').evaluateAll(els=>els.flatMap(el=>Array.from(el.shadowRoot!.querySelectorAll('svg')).map(svg=>getComputedStyle(svg).fill)));
  expect(icons.every(c=>c===ink)).toBe(true);
}
test('both themes cover every player surface and inline controls do not overlap the picture', async ({ page }, info) => {
  test.skip(info.project.name==='desktop-firefox','Configured mobile WebKit and real Chromium fullscreen owners');
  await silenceTestMedia(page);
  const mobile=info.project.name.includes('iphone'); if(mobile) await emulateCustomFullscreenLayout(page);
  const width=info.project.name.includes('max')?440:mobile?402:390;
  await page.setViewportSize({width,height:874});await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();await page.locator('#film-play').click();
  await expect(page.locator('#product-film')).toHaveAttribute('data-theme','ramsider');
  for(const [theme,ink] of [['ramsider',gold],['default',white]]) {
    await page.locator('#product-film').evaluate((el,theme)=>el.setAttribute('data-theme',theme),theme);
    for(const selector of ['#product-film-title','.product-film__close','.film-gallery__duration','.film-gallery__caption','.film-gallery__item-number']) await color(page,selector,ink);
    await color(page,'.product-film__close',ink,'border-top-color');
    await color(page,'.film-gallery__play svg',ink,'fill');
    expect(await page.locator('.film-gallery__thumbnail').first().evaluate(el=>getComputedStyle(el,'::after').borderColor)).toBe(ink);
    await expect(page.locator('#product-film-title')).toHaveText('Ramsider Uno Product Introduction');
    const title=page.locator('#product-film-title'); await expect(title).toHaveCSS('font-size','18px');
    const h=await title.boundingBox(),x=await page.locator('.product-film__close').boundingBox();expect(h!.x+h!.width).toBeLessThanOrEqual(x!.x+1);
    await page.screenshot({path:`screenshots/video/theme/${info.project.name}-${theme}-gallery.png`});
    await page.locator('.film-gallery__hero').click();
    await expect(page.locator('#film-player')).toHaveAttribute('data-controls','ready',{timeout:30000});
    await expect.poll(()=>page.locator('video').evaluate(el=>(el as HTMLVideoElement).currentTime)).toBeGreaterThan(.1);
    await page.locator('video').evaluate(el=>(el as HTMLVideoElement).pause());
    await expect(page.locator('#product-film-hint')).toHaveCount(0);
    await expect(page.locator('.product-film__notes')).not.toBeVisible();
    await chrome(page,ink);
    const bounds=await page.locator('video').boundingBox(),seek=await page.locator('.film-seek').boundingBox();
    expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(seek!.y+1);expect(bounds!.width).toBeCloseTo(width,0);expect(bounds!.height).toBeCloseTo(width*9/16,0);
    await page.screenshot({path:`screenshots/video/theme/${info.project.name}-${theme}-inline.png`});
    await page.locator('.film-player__list-toggle').click(); await color(page,'.film-playlist__item span',ink);
    await page.screenshot({path:`screenshots/video/theme/${info.project.name}-${theme}-list.png`});
    await page.locator('.film-player__list-toggle').click();
    for(const fullscreen of [false,true]) {
      if(fullscreen){await page.setViewportSize({width:844,height:390});await page.locator('.film-fullscreen').click();}
      await chrome(page,ink);
      await page.locator('#film-settings-toggle').click();await expect(page.locator('#film-options-menu')).not.toHaveAttribute('hidden');
      await expect.poll(()=>page.locator('#film-options-menu').evaluate(el=>getComputedStyle(el).opacity)).toBe('1');
      await page.locator('#film-options-menu').evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).map(animation=>animation.finished.catch(()=>{})));});
      for(const selector of ['.film-menu-quality','.film-menu-speed','.film-menu-pip']) await color(page,selector,ink);
      await page.screenshot({path:`screenshots/video/theme/${info.project.name}-${theme}-${fullscreen?'fullscreen':'inline'}-menu.png`});
      await page.locator('.film-menu-quality').click();
      await expect(page.locator('#film-quality-options')).not.toHaveAttribute('hidden');
      await expect(page.locator("#film-quality-options media-chrome-menu-item").first()).toBeFocused();
      await page.waitForTimeout(300); // Media Chrome submenu slide transition.
      await page.keyboard.press('ArrowDown');
      const firstChoice=page.locator('#film-quality-options media-chrome-menu-item').first();
      await firstChoice.focus();
      await expect(firstChoice).toHaveCSS('outline-color',ink);
      await expect(firstChoice).toHaveCSS('outline-width','2px');
      await color(page,'.film-menu-back',ink);await color(page,'#film-quality-options media-chrome-menu-item',ink);
      await expect.poll(()=>page.locator('#film-quality-options media-chrome-menu-item').first().evaluate(el=>getComputedStyle(el.shadowRoot!.querySelector('svg')!).fill)).toBe(ink);
      await page.screenshot({path:`screenshots/video/theme/${info.project.name}-${theme}-${fullscreen?'fullscreen':'inline'}-quality.png`});
      await page.keyboard.press('Escape');
      if(await page.locator('#film-options-menu').getAttribute('hidden')===null) await page.keyboard.press('Escape');
      if(fullscreen) await page.locator('.film-fullscreen').click();
    }
    await page.setViewportSize({width,height:874});
    await page.locator('video').evaluate(el=>el.dispatchEvent(new CustomEvent('film-status',{detail:'error'})));
    await expect(page.locator('.film-recovery')).toBeVisible();await color(page,'.film-recovery',ink);await color(page,'.film-recovery button',ink);
    await page.screenshot({path:`screenshots/video/theme/${info.project.name}-${theme}-error.png`});
    await page.locator('video').evaluate(el=>{el.dispatchEvent(new Event('canplay'));el.dispatchEvent(new Event('ended'));});
    await expect(page.locator('.film-ended__replay')).toBeVisible();await color(page,'.film-ended__replay svg',ink,'stroke');
    await page.screenshot({path:`screenshots/video/theme/${info.project.name}-${theme}-replay.png`});
    await page.locator('.film-player__close').click();await expect(page.locator('video')).not.toHaveAttribute('src');
    await page.locator('#film-play').click();
  }
});
