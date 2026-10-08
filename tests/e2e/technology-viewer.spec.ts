import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { openTechnology } from './helpers/technology';

test('technology PNGs preserve every original pixel outside the title mask', async ({ request }) => {
  const originals = [
    ['02', 'HeatCore_02_THREE_HEATERS_941x1672.png'],
    ['03', 'HeatCore_03_ACTIVE_AIR_SAILS_941x1672.png'],
    ['04', 'HeatCore_04_PROGRAMMABLE_HEAT_PROFILES_941x1672.png'],
    ['05', 'HeatCore_05_GOLD_AND_TITANIUM_NITRIDE_941x1672.png'],
  ];
  const previous = JSON.parse(await readFile('docs/evidence/technology-viewer/original-png/assets.json', 'utf8'));
  const acceptedPhotos = JSON.parse(await readFile('docs/evidence/technology-viewer/live-title/assets.json', 'utf8'));
  for (const [id, filename] of originals) {
    const response = await request.get(`/art/technology/${id}.png`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    const original = await readFile(`design/references/tech_01/${filename}`);
    expect(createHash('sha256').update(original).digest('hex')).toBe(previous.items.find((item: { id: string }) => item.id === id).sourceSha256);
    const delivered = await readFile(`public/art/technology/${id}.png`);
    expect(createHash('sha256').update(delivered).digest('hex')).toBe(acceptedPhotos.items.find((item: { id: string }) => item.id === id).outputSha256);
    expect((await response.body()).equals(delivered)).toBe(true);
    const metadata = await sharp(delivered).metadata();
    expect([metadata.width, metadata.height, metadata.channels]).toEqual([941, 1672, 3]);
    expect(metadata.icc).toBeUndefined();
    const sourcePixels = await sharp(original).raw().toBuffer();
    const deliveredPixels = await sharp(delivered).raw().toBuffer();
    const mask = await sharp(`docs/evidence/technology-viewer/live-title/mask-${id}.png`).greyscale().raw().toBuffer();
    let outsideChanges = 0;
    let remainingDarkTitlePixels = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) {
        for (let c = 0; c < 3; c++) if (sourcePixels[i * 3 + c] !== deliveredPixels[i * 3 + c]) outsideChanges++;
      } else if (Math.max(...deliveredPixels.subarray(i * 3, i * 3 + 3)) < 130) remainingDarkTitlePixels++;
    }
    expect(outsideChanges).toBe(0);
    expect(remainingDarkTitlePixels).toBe(0);
    expect((await request.get(`/art/technology/${id}.webp`)).status()).toBe(404);
  }
});

test('CyberMind PNGs retain native RGB, alpha and resolution outside title glyphs', async ({ request }) => {
  const manifest = JSON.parse(await readFile('docs/evidence/technology-viewer/cybermind/assets.json', 'utf8'));
  for (const item of manifest.items) {
    const source = await readFile(item.source);
    const delivered = await readFile(item.output);
    expect(createHash('sha256').update(source).digest('hex')).toBe(item.sourceSha256);
    expect(createHash('sha256').update(delivered).digest('hex')).toBe(item.outputSha256);
    const metadata = await sharp(delivered).metadata();
    expect([metadata.width, metadata.height, metadata.channels]).toEqual([941,1672,item.channels]);
    expect(metadata.icc).toBeUndefined();
    const response = await request.get(`/art/technology/cybermind/${item.id}.png`);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/png');
    expect((await response.body()).equals(delivered)).toBe(true);
    const a = await sharp(source).raw().toBuffer(), b = await sharp(delivered).raw().toBuffer();
    const mask = await sharp(`docs/evidence/technology-viewer/cybermind/mask-${item.id}.png`).greyscale().raw().toBuffer();
    let outside = 0, alpha = 0, remainingLetters = 0;
    for (let i=0;i<mask.length;i++) {
      if (!mask[i]) for (let c=0;c<item.channels;c++) if (a[i*item.channels+c]!==b[i*item.channels+c]) outside++;
      if (item.channels===4 && a[i*4+3]!==b[i*4+3]) alpha++;
      if (mask[i] && Math.max(...b.subarray(i*item.channels,i*item.channels+3))<130) remainingLetters++;
    }
    expect([outside,alpha,remainingLetters]).toEqual([0,0,0]);
    expect((await request.get(`/art/technology/cybermind/${item.id}.webp`)).status()).toBe(404);
  }
});

test('all six photos warm after load without blocking the main page', async ({ page }) => {
  let releaseHero!: () => void, releasePhotos!: () => void;
  const heroGate = new Promise<void>(resolve => { releaseHero = resolve; });
  const photoGate = new Promise<void>(resolve => { releasePhotos = resolve; });
  const requests: string[] = [];
  await page.route('**/art/00.webp', async route => { await heroGate; await route.continue(); });
  await page.route(/\/art\/technology\/(?:cybermind\/0[12]|0[2-5])\.png$/, async route => {
    requests.push(route.request().url()); await photoGate; await route.continue();
  });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.page-media-overlay')).toBeVisible();
  expect(requests).toHaveLength(0);
  releaseHero(); await page.waitForLoadState('load');
  await expect.poll(() => requests.length).toBe(6);
  expect(requests.map(url => new URL(url).pathname).sort()).toEqual(['/art/technology/02.png', '/art/technology/03.png', '/art/technology/04.png', '/art/technology/05.png', '/art/technology/cybermind/01.png', '/art/technology/cybermind/02.png']);
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert');
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await openTechnology(page);
  await expect.poll(() => requests.length).toBe(6);
  expect(new Set(requests).size).toBe(6);
  releasePhotos();
  await expect(page.locator('#technology-viewer')).toHaveAttribute('aria-busy', 'false');
});

test('incomplete hero protects the main view before technology can be opened', async ({ page }) => {
  let releaseHero!: () => void;
  const gate = new Promise<void>(resolve => { releaseHero = resolve; });
  const requests = new Set<string>();
  await page.route('**/art/00.webp', async route => { await gate; await route.continue(); });
  page.on('request', request => { if (/\/technology\/(?:cybermind\/0[12]|0[2-5])\.png$/.test(request.url())) requests.add(request.url()); });
  await page.goto('/en', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.page-media-content')).toHaveAttribute('inert', '');
  await expect(page.locator('#technology-viewer')).not.toBeVisible();
  expect(requests.size).toBe(0);
  releaseHero();
  await openTechnology(page);
  await expect.poll(() => requests.size).toBe(6);
  await expect(page.locator('#technology-viewer')).toBeVisible();
});

test('both story controls open a complete ribbon with one title and two group controls', async ({ page }) => {
  await page.goto('/en');
  for (const id of ['technology-experience','technology-repeat']) {
    const trigger=page.locator(`#${id}`);
    await openTechnology(page,trigger);
    const viewer=page.locator('#technology-viewer');
    await expect(viewer).toHaveAttribute('aria-busy','false');
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveCount(4);
    await expect(viewer.locator('.technology-viewer__title')).toHaveCount(1);
    await expect(viewer.getByRole('heading',{name:'HeatCore Technology',exact:true})).toBeVisible();
    await expect(viewer.locator('.technology-viewer__dots button')).toHaveCount(2);
    await expect(viewer.locator('.technology-viewer__frame,.technology-viewer__next-group,.technology-viewer__previous-group,.technology-description__number')).toHaveCount(0);
    await viewer.locator('.technology-viewer__dots button').last().click();
    await expect(viewer).toHaveAttribute('data-group','CyberMind');
    await expect(viewer).toHaveAttribute('aria-busy','false');
    await expect(viewer.locator('.technology-viewer__photo img')).toHaveCount(2);
    await expect(viewer.locator('.technology-viewer__title')).toHaveCount(1);
    await expect(viewer.getByRole('heading',{name:'CyberMind Technology',exact:true})).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(viewer).toHaveAttribute('data-group','CyberMind');
    await page.keyboard.press('ArrowLeft');
    await expect(viewer).toHaveAttribute('data-group','HeatCore');
    await expect(viewer).toHaveAttribute('aria-busy','false');
    for(let i=0;i<8;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('#technology-viewer'))).toBe(true);}
    await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();await expect(trigger).toBeFocused();
  }
});

test('literal rightward group swipes are reversible, bounded, and independent of vertical or RTL scrolling',async({page})=>{
 for(const locale of ['en','ar']){
  await page.goto(`/${locale}`);await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
  const canvas=viewer.locator('.technology-viewer__canvas');
  const swipe=async(dx:number,dy=0)=>{await canvas.dispatchEvent('pointerdown',{pointerType:'touch',clientX:150,clientY:250});await canvas.dispatchEvent('pointerup',{pointerType:'touch',clientX:150+dx,clientY:250+dy});};
  await swipe(-100);await expect(viewer).toHaveAttribute('data-group','HeatCore');
  await swipe(100,200);await expect(viewer).toHaveAttribute('data-group','HeatCore');
  await swipe(100);await expect(viewer).toHaveAttribute('data-group','CyberMind');await expect(viewer).toHaveAttribute('aria-busy','false');
  await swipe(100);await expect(viewer).toHaveAttribute('data-group','CyberMind');
  await swipe(-100);await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer).toHaveAttribute('aria-busy','false');
  await page.keyboard.press('End');await expect.poll(()=>viewer.locator('.technology-viewer__scroll').evaluate(e=>e.scrollTop)).toBeGreaterThan(500);
  await expect(viewer).toHaveAttribute('data-group','HeatCore');await viewer.locator('.technology-viewer__next-image').click();await expect(viewer).toHaveAttribute('data-group','CyberMind');await expect(viewer).toHaveAttribute('aria-busy','false');
  expect(await viewer.locator('.technology-viewer__scroll').evaluate(e=>e.scrollTop)).toBe(0);
  await viewer.locator('.technology-viewer__close').click();
 }
});

test('all six post-load low-priority decoded images are reused offline across ribbons and reopening',async({page,context})=>{
 await page.addInitScript(()=>{
  const images:HTMLImageElement[]=[];const fetches:{url:string;priority?:string}[]=[];
  Object.assign(window,{__technologyWarmImages:images,__technologyFetches:fetches});
  const nativeFetch=window.fetch;window.fetch=(input,init)=>{const url=String(input);if(/\/technology\/(?:cybermind\/0[12]|0[2-5])\.png$/.test(url))fetches.push({url,priority:(init as RequestInit & {priority?:string})?.priority});return nativeFetch(input,init);};
  window.Image=new Proxy(window.Image,{construct(target,args){const image=Reflect.construct(target,args) as HTMLImageElement;images.push(image);return image;}});
 });
 await page.goto('/en');
 await expect.poll(()=>page.evaluate(()=>(window as unknown as {__technologyWarmImages:HTMLImageElement[]}).__technologyWarmImages.filter(i=>i.dataset.source&&i.complete&&i.naturalWidth===941).length)).toBe(6);
 const timings=await page.evaluate(()=>({load:(performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).loadEventStart,starts:performance.getEntriesByType('resource').filter(e=>/\/technology\/(?:cybermind\/0[12]|0[2-5])\.png$/.test(e.name)).map(e=>e.startTime),fetches:(window as unknown as {__technologyFetches:{priority:string}[]}).__technologyFetches}));
 expect(timings.starts).toHaveLength(6);expect(timings.starts.every(t=>t>=timings.load)).toBe(true);expect(timings.fetches.map(f=>f.priority)).toEqual(Array(6).fill('low'));
 await openTechnology(page);await expect(page.locator('#technology-viewer')).toHaveAttribute('aria-busy','false');await context.setOffline(true);
 for(const group of [1,0,1,0]){
  await page.locator('.technology-viewer__dots button').nth(group).click();await expect(page.locator('#technology-viewer')).toHaveAttribute('data-group',group?'CyberMind':'HeatCore');await expect(page.locator('#technology-viewer')).toHaveAttribute('aria-busy','false');
  expect(await page.locator('.technology-viewer__photo img').evaluateAll(elements=>elements.every(image=>(window as unknown as {__technologyWarmImages:HTMLImageElement[]}).__technologyWarmImages.includes(image as HTMLImageElement)))).toBe(true);
 }
 await page.locator('.technology-viewer__close').click();await openTechnology(page);await expect(page.locator('#technology-viewer')).toHaveAttribute('aria-busy','false');await expect(page.locator('.technology-viewer__photo img')).toHaveCount(4);
 expect(await page.evaluate(()=>(window as unknown as {__technologyFetches:unknown[]}).__technologyFetches.length)).toBe(6);await context.setOffline(false);
});
test('technology viewer hides landing paint beneath browser chrome and restores it on close', async ({ page }, testInfo) => {
  await page.goto('/en');
  // Expanded FAQ icons explicitly set visibility:visible and must also be hidden.
  await page.locator('#faq-preorder').click();
  const opener = page.locator('[data-technology-open]').first();
  await opener.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const original = await page.evaluate(() => ({ root: getComputedStyle(document.documentElement).backgroundColor, body: getComputedStyle(document.body).backgroundColor, height: document.documentElement.scrollHeight, y: scrollY }));
  await openTechnology(page, opener);
  const viewer = page.locator('#technology-viewer');
  await expect(viewer).toBeVisible();
  await expect(viewer).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  const paint = await page.locator('.dialog-controller > :not(#technology-viewer), .dialog-controller > :not(#technology-viewer) *').evaluateAll(elements => elements.filter(element => {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility === 'visible' && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0;
  }).map(element => element.tagName));
  expect(paint).toEqual([]);
  await viewer.locator('img').evaluateAll(async images => { await document.fonts.ready; await Promise.all(images.map(image => (image as HTMLImageElement).decode())); });
  await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-isolated-landing.png` });
  // Isolate the document plane to simulate the browser sampling outside modal paint.
  // This is a backing check, not an emulated screenshot of physical Safari chrome.
  const probe = await page.addStyleTag({ content: '#technology-viewer[open]{visibility:hidden!important} #technology-viewer[open] *{visibility:hidden!important} #technology-viewer[open]::backdrop{background:transparent!important}' });
  const backing = await page.screenshot();
  const { data, info } = await sharp(backing).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(info.channels).toBe(3);
  expect(data.some(value => value !== 0)).toBe(false);
  await probe.evaluate(element => (element as HTMLStyleElement).remove());
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(page.locator('html')).toHaveCSS('background-color', original.root);
  await expect(page.locator('body')).toHaveCSS('background-color', original.body);
  await expect(page.locator('main.canvas')).toBeVisible();
  await expect(page.locator('.faq-symbol').first()).toHaveCSS('visibility', 'visible');
  const restored = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, y: scrollY }));
  expect(restored.height).toBe(original.height);
  expect(restored.y).toBeCloseTo(original.y, 0);
  await opener.click();
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await viewer.locator('.technology-viewer__close').click();
  await expect(page.locator('html')).toHaveCSS('background-color', original.root);
});
