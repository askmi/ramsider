import { webkit } from '@playwright/test';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { readFile, writeFile } from 'node:fs/promises';

// Test every interior strip entering the viewport, including narrow adaptation.
// Native DPR pixels and per-row mismatch prevent a one-row seam from hiding
// under an otherwise small whole-image error percentage.
const browser = await webkit.launch();
const results = [];
for (const [width, height] of [[402,874],[440,956],[375,812],[402,600],[768,1024],[1440,900]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  await page.goto('http://127.0.0.1:3070/en');
  await page.locator('#fire-learn').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('.page-media-overlay'));
  await page.locator('#fire-learn').click();
  await page.waitForFunction(() => document.querySelectorAll('.charcoal-art[data-charcoal-ready=true]').length === 12);
  await page.evaluate(() => document.fonts.ready);
  const scroll = page.locator('.charcoal-viewer__scroll');
  const report = { width, height, cases: [] };
  for (let block = 1; block <= 4; block++) {
    const section = page.locator(`.charcoal-section--${block}`);
    const reference = await context.newPage();
    const src = `data:image/png;base64,${(await readFile(`screenshots/charcoal/clean-${block}.png`)).toString('base64')}`;
    await reference.setContent(`<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#efe4d3}img{position:absolute;display:block;height:auto;transform:translateZ(0)}</style><img src="${src}">`);
    await reference.locator('img').evaluate(e => e.decode());
    for (const part of [0,1,2]) {
      // Aim the tile's interior at the lower viewport before it has been fully shown.
      const target = await section.locator('.charcoal-tile').nth(part).evaluate(e => e.getBoundingClientRect().top);
      await scroll.evaluate((e, delta) => e.scrollTop += delta, target - height + 140);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const rect = await section.locator('.charcoal-art-host').evaluate(e => e.getBoundingClientRect().toJSON());
      const masks = await page.locator('.charcoal-copy h2,.charcoal-copy p,.charcoal-footer,.charcoal-viewer__close').evaluateAll(es => es.map(e => e.getBoundingClientRect().toJSON()));
      await reference.locator('img').evaluate((e, rect) => { e.style.top = `${rect.top}px`; e.style.left = `${rect.left}px`; e.style.width = `${rect.width}px`; }, rect);
      await reference.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const actual = await page.screenshot({ path: `screenshots/charcoal/tile-${width}x${height}-${block}-${part}.png` });
      const expected = await reference.screenshot();
      const a = await sharp(actual).ensureAlpha().raw().toBuffer();
      const b = await sharp(expected).ensureAlpha().raw().toBuffer();
      const diff = Buffer.alloc(a.length);
      pixelmatch(a,b,diff,width*3,height*3,{ threshold: .12 });
      let compared = 0, different = 0, maxRowMismatch = 0;
      for (let y = Math.max(0,Math.ceil((rect.top+2)*3)); y < Math.min(height*3,Math.floor((rect.bottom-2)*3)); y++) {
        let row = 0, bad = 0;
        for (let x = Math.ceil((rect.left+2)*3); x < Math.floor((rect.right-2)*3); x++) {
          if (masks.some(r => x/3 > r.left-3 && x/3 < r.right+3 && y/3 > r.top-3 && y/3 < r.bottom+3)) continue;
          const i = (y*width*3+x)*4;
          row++; if (diff[i] === 255 && diff[i+1] === 0 && diff[i+2] === 0) bad++;
        }
        compared += row; different += bad;
        if (row > rect.width*1.5) maxRowMismatch = Math.max(maxRowMismatch,bad/row);
      }
      const result = { block, part, compared, different, maxRowMismatch };
      report.cases.push(result);
      if (compared < 500 || maxRowMismatch > .08) {
        await sharp(diff,{raw:{width:width*3,height:height*3,channels:4}}).png().toFile(`screenshots/charcoal/tile-failed-diff-${width}-${block}-${part}.png`);
        throw new Error(`Tile paint/row seam failed ${JSON.stringify({width,height,...result})}`);
      }
    }
    await reference.close();
  }
  results.push(report); await context.close();
  console.log({width,height,cases:report.cases.length,maxRowMismatch:Math.max(...report.cases.map(r=>r.maxRowMismatch))});
}
await browser.close();
await writeFile('docs/evidence/charcoal/tiles-rendered.json',JSON.stringify(results,null,2)+'\n');
