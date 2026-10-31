import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

async function scene(page: Page, locale = 'en') {
  await page.goto(`/${locale}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-story-media-ready'));
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 2048 * Math.min(innerWidth, 941) / 941 - 24); });
  await expect(page.locator('.ember-scene__canvas')).toHaveAttribute('data-state', 'running', { timeout: 30000 });
  return page.locator('.ember-scene');
}

async function pixelChanges(a: Buffer, b: Buffer) {
  const first = await sharp(a).removeAlpha().raw().toBuffer();
  const next = await sharp(b).removeAlpha().raw().toBuffer();
  return first.reduce((sum, value, i) => sum + (Math.abs(value - next[i]) > 3 ? 1 : 0), 0);
}

test('real pixels move with hidden control, offscreen/modal stop, reduced motion restores original', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const root = await scene(page);
  const surface = root.locator('canvas'), button = root.locator('button');
  const box = (await root.boundingBox())!;
  const width = Math.min(page.viewportSize()!.width, 941);
  expect(box.width).toBeCloseTo(width * 480 / 941, 1);
  expect(Math.abs(box.height - box.width * 760 / 480)).toBeLessThan(1);
  expect(await page.evaluate(() => innerWidth)).toBe(page.viewportSize()!.width);
  await expect(button).toBeHidden();
  await expect(button).toHaveAttribute('hidden', '');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  const before = await surface.screenshot();
  await page.waitForTimeout(1000);
  expect(await pixelChanges(before, await surface.screenshot())).toBeGreaterThan(100);
  await page.locator('#fire-learn').focus();
  await page.keyboard.press('Tab');
  await expect(button).not.toBeFocused();
  await page.locator('#fire-learn').click();
  await expect(page.locator('#charcoal-viewer')).toBeVisible();
  await expect(surface).toHaveAttribute('data-state', 'paused');
  await page.keyboard.press('Escape');
  await expect(page.locator('#fire-learn')).toBeFocused();
  await expect(surface).toHaveAttribute('data-state', 'running');
  // Native dialog close restores the saved page position on its next animation frame.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(surface).toHaveAttribute('data-state', 'paused');
  const time = await surface.getAttribute('data-time');
  await page.waitForTimeout(400);
  expect(await surface.getAttribute('data-time')).toBe(time);
  await root.scrollIntoViewIfNeeded();
  await expect(surface).toHaveAttribute('data-state', 'running');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(root).toHaveAttribute('data-motion', 'reduced');
  await expect(surface).not.toBeVisible(); await expect(button).not.toBeVisible();
  // Compare the scene itself; unrelated back-to-top opacity can still settle after scrolling.
  await page.waitForTimeout(350);
  const reducedBox = (await root.boundingBox())!;
  const region = { left: Math.ceil(reducedBox.x), top: Math.ceil(reducedBox.y), width: Math.floor(reducedBox.width)-1, height: Math.floor(reducedBox.height)-1 };
  const original = await page.screenshot({ scale: 'css' });
  await root.evaluate(e => (e as HTMLElement).style.display = 'none');
  const withoutLayer = await page.screenshot({ scale: 'css' });
  expect(await pixelChanges(await sharp(original).extract(region).png().toBuffer(), await sharp(withoutLayer).extract(region).png().toBuffer())).toBe(0);
  await root.evaluate(e => (e as HTMLElement).style.display = '');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(surface).toBeVisible();
  await expect(surface).toHaveAttribute('data-state', 'running');
  await mkdir('screenshots/ember', { recursive: true });
  await page.screenshot({ path: `screenshots/ember/test-${info.project.name}.png`, scale: 'css' });
  expect(errors).toEqual([]);
});

test('no first-viewport mask, reduced-motion startup and failed GPU preserve static content', async ({ page }) => {
  test.setTimeout(90000);
  const masks: string[] = [];
  page.on('request', req => { if (req.url().includes('/art/ember/')) masks.push(req.url()); });
  await page.goto('/en', { waitUntil: 'load' });
  await page.waitForTimeout(700);
  expect(masks).toHaveLength(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('.ember-scene').scrollIntoViewIfNeeded();
  await expect(page.locator('.ember-scene')).toHaveAttribute('data-motion', 'reduced');
  await page.waitForTimeout(400);
  expect(masks).toHaveLength(0);
  await expect(page.locator('.ember-scene__toggle')).not.toBeVisible();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('.ember-scene__canvas')).toHaveAttribute('data-state', 'running');
  const supported = await page.locator('canvas.ember-scene__canvas').evaluate(e => {
    const gl = (e as HTMLCanvasElement).getContext('webgl')!;
    const extension = gl.getExtension('WEBGL_lose_context');
    if (!extension) return false;
    extension.loseContext(); return true;
  });
  if (supported) {
    await expect(page.locator('.ember-scene__canvas')).not.toBeVisible();
    await expect(page.locator('.ember-scene__toggle')).not.toBeVisible();
  }
  await expect(page.locator('#fire-learn')).toBeVisible();
});

test('all locale entries retain English hidden control and proportional adaptation', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'locale/adaptation matrix runs once on baseline WebKit');
  test.setTimeout(180000);
  for (const locale of ['en','ru','de','fr','es','it','tr','ar','zh','ja','ko']) {
    const root = await scene(page, locale);
    const button = root.locator('button');
    expect(await button.getAttribute('aria-label')).toBeTruthy();
    const bounds = (await root.boundingBox())!;
    expect(bounds.x).toBeCloseTo(402 * 260 / 941, 1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(button).toBeHidden();
    await expect(button).toHaveAttribute('aria-pressed', 'false');
  }
  await scene(page);
  for (const [width,height] of [[375,812],[402,650],[768,1024],[1440,900]]) {
    await page.setViewportSize({ width,height });
    await page.locator('.ember-scene').scrollIntoViewIfNeeded();
    await expect(page.locator('.ember-scene__canvas')).toHaveAttribute('data-state', 'running');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `screenshots/ember/adapt-${width}x${height}.png`, scale: 'css' });
  }
});


test('the right coal face visibly smolders independently of smoke', async ({ page }, info) => {
  test.setTimeout(90000);
  const root = await scene(page);
  await root.scrollIntoViewIfNeeded();
  const box = (await root.boundingBox())!;
  const scale = box.width / 480;
  // Relative to the actual canvas: remains inside the face on centered desktops too.
  const region = { left: Math.ceil(box.x + 260 * scale), top: Math.ceil(box.y + 445 * scale), width: Math.floor(130 * scale), height: Math.floor(205 * scale) };
  const frames: Buffer[] = [];
  const evidenceDir = process.env.EMBER_NATIVE_DIR ?? 'screenshots/ember/visible-smolder';
  await mkdir(evidenceDir, { recursive: true });
  for (let i = 0; i < 9; i++) {
    const image = await page.screenshot({ scale: 'css' });
    frames.push(await sharp(image).extract(region).removeAlpha().raw().toBuffer());
    if (i % 2 === 0) await sharp(image).toFile(`${evidenceDir}/native-${info.project.name}-${i}.png`);
    if (i < 8) await page.waitForTimeout(650);
  }
  let visiblePixels = 0;
  for (let pixel = 0; pixel < frames[0].length; pixel += 3) {
    const light = frames.map(f => .2126 * f[pixel] + .7152 * f[pixel + 1] + .0722 * f[pixel + 2]);
    if (Math.max(...light) - Math.min(...light) > 12) visiblePixels++;
  }
  // A few changed subpixel values or smoke movement cannot satisfy this check.
  await writeFile(`${evidenceDir}/native-${info.project.name}.json`, JSON.stringify({ nativeTime: true, frames: 9, intervalMs: 650, region, visiblePixels, threshold: 40 }, null, 2));
  expect(visiblePixels, 'right-face pixels with visible (>12/255) luminance variation').toBeGreaterThan(40);
});

// Independent source-space regions/probes: none includes the smoke above y335.
const faceRegions = {
  top: { x:195,y:338,w:115,h:35,min:5, probes:[[207,352],[214,350],[222,351],[229,350],[233,347]] },
  left: { x:145,y:437,w:69,h:115,min:12, probes:[[146,457],[155,457],[165,454],[174,450],[183,447],[189,443]] },
  junction: { x:230,y:378,w:55,h:72,min:5, probes:[[239,384],[247,388],[258,390],[269,393],[277,396]] },
  right: { x:330,y:400,w:45,h:55,min:5, probes:[[350,413],[353,421],[356,432],[360,443]] },
};

test('all three faces and their junctions have visible traveling crack glints', async ({ page }, info) => {
  test.setTimeout(90000);
  const root = await scene(page);
  await root.scrollIntoViewIfNeeded();
  const box = (await root.boundingBox())!, scale = box.width / 480;
  const width = page.viewportSize()!.width;
  const dir = process.env.EMBER_FACES_DIR ?? 'screenshots/ember/three-faces/native';
  await mkdir(dir, { recursive:true });
  const frames: Buffer[] = [];
  for (let i=0;i<11;i++) {
    const image = await page.screenshot({ scale:'css' });
    frames.push(await sharp(image).removeAlpha().raw().toBuffer());
    await sharp(image).toFile(`${dir}/${info.project.name}-${i}.png`);
    if(i<10) await page.waitForTimeout(450);
  }
  await page.emulateMedia({ reducedMotion:'reduce' });
  await expect(root).toHaveAttribute('data-motion','reduced');
  await page.waitForTimeout(350);
  const image = await page.screenshot({ scale:'css' });
  await sharp(image).toFile(`${dir}/${info.project.name}-static.png`);
  const original = await sharp(image).removeAlpha().raw().toBuffer();
  const results: Record<string,unknown> = {};
  const luminance = (f:Buffer,i:number) => .2126*f[i]+.7152*f[i+1]+.0722*f[i+2];
  for(const [name,a] of Object.entries(faceRegions)) {
    const region={left:Math.ceil(box.x+a.x*scale),top:Math.ceil(box.y+a.y*scale),width:Math.floor(a.w*scale),height:Math.floor(a.h*scale)};
    let moving=0,warm=0;
    for(let y=region.top;y<region.top+region.height;y++)for(let x=region.left;x<region.left+region.width;x++){
      const i=(y*width+x)*3, light=frames.map(f=>luminance(f,i));
      if(Math.max(...light)-Math.min(...light)>12)moving++;
      if(frames.some(f=>f[i]-original[i]>20&&luminance(f,i)-luminance(original,i)>10))warm++;
    }
    const peaks=frames.map(f=>{
      const scores=a.probes.map(([x,y])=>{
        const px=Math.round(box.x+x*scale),py=Math.round(box.y+y*scale);
        let value=0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const i=((py+dy)*width+px+dx)*3;
          if(f[i]-original[i]>12)value+=Math.max(0,luminance(f,i)-luminance(original,i));
        }
        return value;
      });
      const score=Math.max(...scores);
      return {index:score>8?scores.indexOf(score):-1,score};
    });
    const indices=peaks.filter(p=>p.index>=0).map(p=>p.index);
    const travelSpan=indices.length?Math.max(...indices)-Math.min(...indices):0;
    results[name]={region,moving,warm,minimum:a.min,peaks,travelSpan};
    expect.soft(moving,`${name}: temporal pixels`).toBeGreaterThanOrEqual(a.min);
    expect.soft(warm,`${name}: warm glints above static source`).toBeGreaterThanOrEqual(a.min);
    expect.soft(travelSpan,`${name}: brightest glint moves along independent path probes`).toBeGreaterThanOrEqual(2);
  }
  await writeFile(`${dir}/${info.project.name}.json`,JSON.stringify({nativeTime:true,frames:11,intervalMs:450,box,scale,results},null,2));
});
