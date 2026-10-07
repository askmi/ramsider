import { webkit, expect } from '@playwright/test';
import sharp from 'sharp';
import { writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = 'https://ramsider-main.vercel.app';
const out = 'docs/evidence/technology-viewer/full-width';
const results = [];
const browser = await webkit.launch();
const bounded = async (task, label) => {
  let timer;
  try { return await Promise.race([task, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`180s resource deadline: ${label}`)), 180000); })]); }
  finally { clearTimeout(timer); }
};
try {
  for (const [name, width, height] of [['13-pro',390,664], ['pro',402,874], ['pro-max',440,956]]) {
    console.log(`${name}: start`);
    const context = await browser.newContext({ viewport: { width,height }, deviceScaleFactor:3, isMobile:true, hasTouch:true });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const ids = ['02','03','04','05'];
    const resources = ids.map(id => page.waitForResponse(r => r.url() === `${base}/art/technology/${id}.png`, { timeout:180000 }));
    await page.goto(`${base}/en`);
    await page.locator('[data-technology-open]').first().click();
    const viewer = page.locator('#technology-viewer');
    await expect(viewer).toBeVisible();
    await expect(page.locator('html')).toHaveCSS('background-color','rgb(0, 0, 0)');
    await expect(page.locator('main.canvas')).not.toBeVisible();
    const frame = await viewer.locator('.technology-viewer__frame').boundingBox();
    const stage = await viewer.locator('.technology-viewer__stage').boundingBox();
    expect(frame).not.toBeNull(); expect(stage).not.toBeNull();
    expect(frame.x).toBeCloseTo(0,1); expect(frame.width).toBeCloseTo(width,1);
    expect(stage.x).toBeCloseTo(width*29/941,1); expect(stage.width).toBeCloseTo(width*883/941,1);
    // Observe the actual original-image requests; do not duplicate their transfers through API GETs.
    const photos = await Promise.all(resources.map(async (resource, i) => {
      const res = await resource; expect(res.ok()).toBe(true);
      expect(res.headers()['content-type']).toContain('image/png');
      const bytes = await bounded(res.body(), `${name}/${ids[i]}`);
      expect(bytes.equals(await readFile(`public/art/technology/${ids[i]}.png`))).toBe(true);
      console.log(`${name}: ${ids[i]} original PNG ready (${bytes.length}B)`);
      return { id:ids[i], bytes:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex') };
    }));
    const slides = [];
    for (let i=0; i<4; i++) {
      await viewer.locator('.technology-viewer__dots button').nth(i).click();
      await expect(viewer.locator('.technology-viewer__descriptions')).toHaveAttribute('data-slide',ids[i], { timeout:30000 });
      await bounded(viewer.locator('img').evaluateAll(async imgs => { await document.fonts.ready; await Promise.all(imgs.map(img => img.decode())); }), `${name}/${ids[i]} decode`);
      const actual = await page.screenshot();
      if (i===0) await writeFile(`${out}/public-${name}-slide-1.png`,actual);
      let changedChannels = null;
      if (name!=='13-pro') {
        const a = await sharp(actual).raw().toBuffer();
        const b = await sharp(`${out}/${name}-slide-${i+1}.png`).raw().toBuffer();
        expect(a.length).toBe(b.length); changedChannels=0;
        for (let j=0; j<a.length; j++) if (a[j]!==b[j]) changedChannels++;
        expect(changedChannels).toBe(0);
      }
      slides.push({ ...photos[i],changedChannels });
    }
    const probe = await page.addStyleTag({ content:'#technology-viewer[open],#technology-viewer[open] *{visibility:hidden!important}#technology-viewer[open]::backdrop{background:transparent!important}' });
    expect((await sharp(await page.screenshot()).removeAlpha().raw().toBuffer()).some(v=>v!==0)).toBe(false);
    await probe.evaluate(el=>el.remove());
    await viewer.locator('.technology-viewer__close').click();
    await expect(page.locator('main.canvas')).toBeVisible();
    await expect(page.locator('html')).toHaveCSS('background-color','rgb(211, 183, 159)');
    expect(errors).toEqual([]);
    results.push({name,width,height,dpr:3,blackBacking:true,closeRestoresLanding:true,frame,stage,slides,errors});
    await context.close(); console.log(`${name}: PASS`);
  }
  await writeFile(`${out}/public-checks.json`,JSON.stringify({base,sha:process.env.DEPLOYMENT_SHA,nativeChromeVerified:false,results},null,2)+'\n');
  console.log('Public contour/cutout, backing/restore, original PNGs and eight Pro/Max RGB0 screenshots PASS');
} finally { await browser.close(); }
