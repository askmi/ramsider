import { expect, test } from '@playwright/test';
import { openTechnology } from './helpers/technology';
const evidence='docs/evidence/technology-viewer/ribbons';

test('all six source planes fill viewport width with native proportions, joined edges and complete bottom access',async({page},info)=>{
 await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
 for(const [width,height] of [[402,874],[440,956],[402,664],[440,732],[375,812],[320,568],[844,390],[768,1024],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const group of [0,1]){
   await viewer.locator('.technology-viewer__dots button').nth(group).click();await expect(viewer).toHaveAttribute('data-group',group?'CyberMind':'HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');
   const g=await viewer.evaluate(element=>{
    const stage=element.querySelector('.technology-viewer__stage')!.getBoundingClientRect();const scroll=element.querySelector('.technology-viewer__scroll')!;
    const planes=[...element.querySelectorAll('.technology-viewer__content')].map(el=>{const r=el.getBoundingClientRect();const img=el.querySelector('img')!;const ir=img.getBoundingClientRect();return{width:r.width,height:r.height,top:r.top,bottom:r.bottom,imageWidth:ir.width,imageHeight:ir.height,source:[img.naturalWidth,img.naturalHeight]};});
    return{width:innerWidth,dpr:devicePixelRatio,meta:document.querySelector('meta[name=viewport]')?.getAttribute('content'),stage:{left:stage.left,right:stage.right,bottom:stage.bottom},planes,overflow:scroll.scrollWidth-scroll.clientWidth};
   });
   expect(g.width).toBe(width);expect(g.meta).toContain('width=device-width');expect(g.stage.left).toBe(0);expect(g.stage.right).toBe(width);expect(g.stage.bottom).toBe(height);expect(g.overflow).toBe(0);
   for(const [index,plane]of g.planes.entries()){
    expect(plane.width).toBe(width);expect(plane.imageWidth).toBe(width);expect(Math.abs(plane.height-width*1672/941)).toBeLessThan(1);expect(Math.abs(plane.imageHeight-plane.height)).toBeLessThan(.1);expect(plane.source).toEqual([941,1672]);
    if(index)expect(Math.abs(g.planes[index-1].bottom-plane.top-width*48/941)).toBeLessThan(.05);
   }
   await page.keyboard.press('End');const bottom=await viewer.locator('.technology-viewer__content').last().boundingBox();expect(Math.abs(bottom!.y+bottom!.height-height)).toBeLessThan(1);
   await page.keyboard.press('Home');expect(await viewer.locator('.technology-viewer__scroll').evaluate(e=>e.scrollTop)).toBe(0);
   if([320,375,768,844,1440].includes(width)&&group===1)await page.screenshot({path:`${evidence}/${info.project.name}-adapt-${width}x${height}.png`});
  }
 }
});

test('all source descriptions fit eleven locales in both ribbons without numbers or horizontal overflow',async({page},info)=>{
 for(const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']){
  await page.goto(`/${locale}`);await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
  for(const group of [0,1]){
   await viewer.locator('.technology-viewer__dots button').nth(group).click();await expect(viewer).toHaveAttribute('data-group',group?'CyberMind':'HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');await page.evaluate(()=>document.fonts.ready);
   await expect(viewer.locator('.technology-viewer__title')).toHaveCount(1);await expect(viewer.locator('.technology-viewer__descriptions')).toHaveCount(group?2:4);await expect(viewer.locator('.technology-description__number')).toHaveCount(0);
   const overflow=await viewer.locator('.technology-description__box').evaluateAll(boxes=>boxes.filter(box=>{const text=box.firstElementChild!;return text.scrollHeight>box.clientHeight+1||text.scrollWidth>box.clientWidth+1;}).map(box=>box.parentElement?.getAttribute('data-description-block')));
   expect(overflow).toEqual([]);
   const hits=await viewer.locator('.technology-viewer__dots button,.technology-viewer__close,.technology-viewer__next-image').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return{width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
   for(const hit of hits){expect(hit.width).toBeGreaterThanOrEqual(44);expect(hit.height).toBeGreaterThanOrEqual(44);expect(hit.left).toBeGreaterThanOrEqual(0);expect(hit.right).toBeLessThanOrEqual(info.project.use.viewport!.width);expect(hit.bottom).toBeLessThanOrEqual(88);}
   if(locale==='ar'){await expect(viewer.locator('.technology-description__box').first()).toHaveAttribute('dir','rtl');await page.screenshot({path:`${evidence}/${info.project.name}-ar-${group}.png`});}
  }
  await viewer.locator('.technology-viewer__close').click();
 }
});

test('native desktop wheel scrolls the ribbon without moving landing or switching groups',async({page},info)=>{
 test.skip(!!info.project.use.isMobile,'Native mobile pan is covered by Chromium protocol plus WebKit pointer/keyboard checks.');await page.setViewportSize({width:615,height:849});await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');const y=await page.evaluate(()=>scrollY);const scroller=viewer.locator('.technology-viewer__scroll');await scroller.hover();await page.mouse.wheel(0,500);await expect.poll(()=>scroller.evaluate(e=>e.scrollTop)).toBeGreaterThan(100);await expect.poll(async()=>{await page.mouse.wheel(0,1200);return scroller.evaluate(e=>Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop));}).toBeLessThan(1);await expect(viewer).toHaveAttribute('data-group','HeatCore');expect(await page.evaluate(()=>scrollY)).toBe(y);await expect.poll(async()=>{await page.mouse.wheel(0,-1200);return scroller.evaluate(e=>e.scrollTop);}).toBe(0);
});

test('native touch pans vertically, swipes horizontally and freezes during download', async ({ browser }, info) => {
  test.skip(info.project.use.browserName !== 'chromium', 'Chromium native touch protocol; WebKit/Firefox have no matching public swipe API.');
  const context = await browser.newContext({ viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/art/technology/cybermind/02.png', async route => { await gate; await route.continue(); });
  try {
    await page.goto(`${process.env.BASE_URL ?? 'http://127.0.0.1:3000'}/en`);
    await openTechnology(page);
    const viewer = page.locator('#technology-viewer');
    const scroller = viewer.locator('.technology-viewer__scroll');
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    const y = await page.evaluate(() => scrollY);
    const touch = await context.newCDPSession(page);
    const swipe = async (start: [number, number], end: [number, number]) => {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start[0], y: start[1] }] });
      for (let step = 1; step <= 10; step++) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start[0] + (end[0] - start[0]) * step / 10, y: start[1] + (end[1] - start[1]) * step / 10 }] });
        await page.waitForTimeout(16); // Real gesture duration; lets the browser recognize native panning.
      }
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    await swipe([220, 440], [220, 290]);
    await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(80);
    await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
    expect(await page.evaluate(() => scrollY)).toBe(y);
    await page.screenshot({ path: `${evidence}/native-touch-scrolled.png` });
    await swipe([70, 350], [300, 350]);
    await expect(viewer).toHaveAttribute('aria-busy', 'true');
    const frozen = await scroller.evaluate(element => element.scrollTop);
    await swipe([220, 440], [220, 290]);
    expect(await scroller.evaluate(element => element.scrollTop)).toBeCloseTo(frozen, 0);
    expect(await page.evaluate(() => scrollY)).toBe(y);
    await expect(viewer.locator('.technology-viewer__photo img').first()).toHaveAttribute('data-source', '/art/technology/02.png');
    await page.screenshot({ path: `${evidence}/native-touch-pending.png` });
    release();
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    await expect(viewer).toHaveAttribute('aria-busy','false');
    await expect(viewer.locator('.technology-viewer__photo img').first()).toHaveAttribute('data-source', '/art/technology/cybermind/01.png');
    expect(await scroller.evaluate(element => element.scrollTop)).toBe(0);
    await swipe([300, 350], [80, 350]);
    await expect(viewer.locator('.technology-viewer__photo img').first()).toHaveAttribute('data-source', '/art/technology/02.png');
    await swipe([300, 350], [80, 350]);
    await expect(viewer.locator('.technology-viewer__photo img').first()).toHaveAttribute('data-source', '/art/technology/02.png');
    await page.screenshot({ path: `${evidence}/native-touch-ready.png` });
    await viewer.locator('.technology-viewer__close').click();
    await page.goto(`${process.env.BASE_URL ?? 'http://127.0.0.1:3000'}/ar`);
    await openTechnology(page);
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    await swipe([80, 350], [300, 350]);
    await expect(viewer).toHaveAttribute('aria-busy','false');
    await expect(viewer.locator('.technology-viewer__photo img').first()).toHaveAttribute('data-source', '/art/technology/cybermind/01.png');
    await swipe([300, 350], [80, 350]);
    await expect(viewer.locator('.technology-viewer__photo img').first()).toHaveAttribute('data-source', '/art/technology/02.png');
    await swipe([220, 440], [220, 290]);
    await expect.poll(() => scroller.evaluate(element => element.scrollTop)).toBeGreaterThan(80);
    await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
    await page.screenshot({ path: `${evidence}/native-touch-arabic.png` });
  } finally { release(); await context.close(); }
});
