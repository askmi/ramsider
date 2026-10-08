import { expect, test } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { openTechnology } from './helpers/technology';

test('a partial first group resource prevents the whole ribbon revealing and reports aggregate progress', async ({ page }, info) => {
  const bytes = await readFile('public/art/technology/02.png');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const server = createServer(async (_request, response) => {
    response.writeHead(200, { 'content-type': 'image/png', 'content-length': bytes.length, 'access-control-allow-origin': '*' });
    response.write(bytes.subarray(0, Math.floor(bytes.length / 4)));
    await gate;
    response.end(bytes.subarray(Math.floor(bytes.length / 4)));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No streaming server');
  await page.route('**/art/technology/02.png', route => route.continue({ url: `http://127.0.0.1:${address.port}/photo.png` }));
  try {
    await page.goto('/en');
    await openTechnology(page);
    const viewer = page.locator('#technology-viewer');
    await expect(viewer).toHaveAttribute('aria-busy', 'true');
    await expect(viewer.locator('.technology-viewer__stage')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveCount(0);
    await expect(viewer.locator('.technology-viewer__title, .technology-viewer__descriptions')).toHaveCount(0);
    await expect(viewer.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '81');
    await expect(viewer.locator('.technology-viewer__next-image')).toBeDisabled();
    await expect(viewer.locator('.technology-viewer__dots button').first()).toBeDisabled();
    const scroll = await page.evaluate(() => scrollY);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    if (!info.project.use.isMobile) await page.mouse.wheel(0, 800);
    else expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
    await viewer.locator('.technology-viewer__stage').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 300, clientY: 500 });
    await viewer.locator('.technology-viewer__stage').dispatchEvent('pointerup', { pointerType: 'touch', clientX: 100, clientY: 500 });
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    await expect(viewer).toHaveAttribute('data-group', 'HeatCore');
    await page.screenshot({ path: `docs/evidence/technology-viewer/ribbons/${info.project.name}-pending.png` });
    release();
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    const image = viewer.locator('.technology-viewer__stage img').first();
    await expect(image).toHaveAttribute('data-source', '/art/technology/02.png');
    const delivered = await image.evaluate(async (element: HTMLImageElement) => {
      const buffer = await (await fetch(element.src)).arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    });
    expect(delivered).toBe(createHash('sha256').update(bytes).digest('hex'));
    await expect(viewer.getByRole('heading', { name: 'HeatCore Technology' })).toBeVisible();
    await page.screenshot({ path: `docs/evidence/technology-viewer/ribbons/${info.project.name}-ready.png` });
  } finally {
    release();
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('invalid first image has white backing and retry; close never traps the user', async ({ page }) => {
  let valid = false;
  await page.route('**/art/technology/02.png', route => valid ? route.continue() : route.fulfill({ contentType: 'image/png', body: Buffer.from('not an image') }));
  await page.goto('/en');
  await openTechnology(page);
  const viewer = page.locator('#technology-viewer');
  await expect(viewer.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(viewer.locator('.technology-viewer__stage img')).toHaveCount(0);
  await viewer.locator('.technology-viewer__close').click();
  await expect(viewer).not.toBeVisible();
  await openTechnology(page);
  await expect(viewer.getByRole('button', { name: 'Retry' })).toBeVisible();
  valid = true;
  await viewer.getByRole('button', { name: 'Retry' }).click();
  await expect(viewer).toHaveAttribute('aria-busy', 'false');
  await expect(viewer.locator('.technology-viewer__stage img').first()).toHaveAttribute('data-source', '/art/technology/02.png');
});

test('retry replaces a corrupt HTTP 200 retained in the real browser cache', async ({ page }, info) => {
  const bytes = await readFile('public/art/technology/02.png');
  let valid = false, requests = 0;
  const server = createServer((_request, response) => {
    requests++;
    const body = valid ? bytes : Buffer.from('cached corrupt image');
    response.writeHead(200, { 'content-type': 'image/png', 'content-length': body.length, 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' });
    response.end(body);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No cache server');
  const url = `http://127.0.0.1:${address.port}/photo.png`;
  // No page.route: routing disables HTTP caching and would miss this regression.
  await page.addInitScript(({ url }) => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init) => nativeFetch(input === '/art/technology/02.png' ? url : input, init);
  }, { url });
  try {
    await page.goto('/en');
    await openTechnology(page);
    const viewer = page.locator('#technology-viewer');
    await expect(viewer.getByRole('button', { name: 'Retry' })).toBeVisible();
    const beforeProbe = requests;
    expect(await page.evaluate(async url => (await fetch(url, { cache: 'force-cache' })).text(), url)).toBe('cached corrupt image');
    // WebKit's ephemeral mobile context does not retain this cross-origin response.
    // Desktop profiles must prove actual retention, rather than only a successful retry.
    if (info.project.use.browserName !== 'webkit') expect(requests).toBe(beforeProbe);
    info.annotations.push({ type: 'HTTP-cache', description: requests === beforeProbe ? 'Corrupt response retained: no probe network request' : 'Cross-origin cache not retained by mobile WebKit; network retry/reuse verified' });
    const before = requests;
    valid = true;
    await viewer.getByRole('button', { name: 'Retry' }).click();
    await expect(viewer).toHaveAttribute('aria-busy', 'false');
    await expect(viewer.locator('.technology-viewer__stage img').first()).toHaveAttribute('data-source', '/art/technology/02.png');
    expect(requests).toBe(before + 1);
    await viewer.locator('.technology-viewer__close').click();
    await openTechnology(page);
    await expect(viewer.locator('.technology-viewer__stage img').first()).toHaveAttribute('data-source', '/art/technology/02.png');
    expect(requests).toBe(before + 1);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});


test('a delayed next group retains the complete old ribbon, freezes scroll, and commits atomically',async({page},info)=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/art/technology/cybermind/02.png',async route=>{await gate;await route.continue();});
 try{
  await page.goto('/en');await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
  const scroller=viewer.locator('.technology-viewer__scroll');await page.keyboard.press('PageDown');const y=await scroller.evaluate(e=>e.scrollTop);expect(y).toBeGreaterThan(200);
  await viewer.locator('.technology-viewer__dots button').last().click();await expect(viewer).toHaveAttribute('aria-busy','true');
  await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer.locator('.technology-viewer__photo img')).toHaveCount(4);
  await expect(viewer.locator('.technology-viewer__title')).toHaveCount(1);await expect(viewer.locator('.technology-viewer__dots button[aria-current=true]')).toHaveAttribute('aria-label','HeatCore Technology');
  await expect(viewer.getByRole('progressbar')).toBeVisible();await page.keyboard.press('ArrowRight');await page.keyboard.press('End');
  await scroller.evaluate(e=>e.scrollTop+=100);await expect.poll(()=>scroller.evaluate(e=>e.scrollTop)).toBe(y);
  await page.screenshot({path:`docs/evidence/technology-viewer/ribbons/${info.project.name}-retained-pending.png`});
  release();await expect(viewer).toHaveAttribute('aria-busy','false');await expect(viewer).toHaveAttribute('data-group','CyberMind');await expect(viewer.locator('.technology-viewer__photo img')).toHaveCount(2);expect(await scroller.evaluate(e=>e.scrollTop)).toBe(0);
 }finally{release();}
});

test('failed optional group leaves landing usable and recovers with explicit retry without skipping',async({page})=>{
 let valid=false;let requests=0;
 await page.route('**/art/technology/cybermind/02.png',route=>{requests++;return valid?route.continue():route.fulfill({status:503,body:'not ready'});});
 await page.goto('/en');await expect(page.locator('.page-media-overlay')).toHaveCount(0);await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert','');
 await openTechnology(page);const viewer=page.locator('#technology-viewer');await expect(viewer).toHaveAttribute('aria-busy','false');
 await viewer.locator('.technology-viewer__dots button').last().click();await expect(viewer.getByRole('button',{name:'Retry'})).toBeVisible();await expect(viewer).toHaveAttribute('data-group','HeatCore');await expect(viewer.locator('.technology-viewer__photo img')).toHaveCount(4);
 await page.keyboard.press('ArrowRight');await expect(viewer).toHaveAttribute('data-group','HeatCore');
 const before=requests;valid=true;await viewer.getByRole('button',{name:'Retry'}).click();await expect(viewer).toHaveAttribute('aria-busy','false');await expect(viewer).toHaveAttribute('data-group','CyberMind');expect(requests).toBe(before+1);
 await viewer.locator('.technology-viewer__close').click();await expect(viewer).not.toBeVisible();
});

test('loading and retry remain reachable in every locale at a short phone height',async({page})=>{
 await page.setViewportSize({width:320,height:568});
 await page.route('**/art/technology/05.png',route=>route.fulfill({status:503,body:'held error'}));
 for(const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']){
  await page.goto(`/${locale}`);await openTechnology(page);const viewer=page.locator('#technology-viewer');const retry=viewer.locator('.technology-viewer__loading button');await expect(retry).toBeVisible();
  const box=await retry.boundingBox();expect(box).not.toBeNull();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.y).toBeGreaterThanOrEqual(88);expect(box!.x+box!.width).toBeLessThanOrEqual(320);expect(box!.y+box!.height).toBeLessThanOrEqual(568);await viewer.locator('.technology-viewer__close').click();
 }
});
