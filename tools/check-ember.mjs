import { webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3072';
const dir = 'screenshots/ember';
await mkdir(dir, { recursive: true });
const browser = await webkit.launch();
const results = [];
for (const [name, width, height] of [['pro',402,874],['max',440,956]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, recordVideo: { dir, size: { width, height } } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${baseURL}/en`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.querySelectorAll('.art img')].slice(0,2).every(i=>i.hasAttribute('data-media-ready')));
  await page.evaluate(() => { document.documentElement.style.scrollBehavior='auto'; scrollTo(0,2048*Math.min(innerWidth,941)/941-24); });
  await page.waitForFunction(() => document.querySelector('.ember-scene__canvas')?.dataset.state === 'running', { timeout: 15000 });
  const geometry = await page.locator('.ember-scene').evaluate(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,innerWidth,dpr:devicePixelRatio,meta:document.querySelector('meta[name=viewport]')?.getAttribute('content')}));
  const times=[];
  for (let i=0;i<3;i++) {
    if (i) await page.waitForTimeout(2400);
    await page.screenshot({ path:`${dir}/${name}-frame-${i}.png`,scale:'css' });
    times.push(await page.locator('canvas.ember-scene__canvas').getAttribute('data-time'));
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('.ember-scene')?.getAttribute('data-motion')==='reduced');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:`${dir}/${name}-static.png`,scale:'css'});
  results.push({ name,geometry,times,errors,video:await page.video().path() });
  await context.close();
}
await browser.close();
await mkdir('docs/evidence/ember',{recursive:true});
await writeFile('docs/evidence/ember/visual.json',JSON.stringify({baseURL,results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
