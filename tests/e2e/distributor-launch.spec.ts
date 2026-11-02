import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { waitForVisibleMedia } from './helpers/media';

test('distributor launch copy fits the reflection gap and preserves existing controls', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/ar');
  await expect(page).toHaveURL(/\/en(?:[?#]|$)/);
  await page.evaluate(() => document.fonts.ready);
  await waitForVisibleMedia(page);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const dir = process.env.DISTRIBUTOR_CAPTURE_DIR ?? 'screenshots/distributor-fit/default';
  const measurements: unknown[] = [];
  await mkdir(dir, { recursive: true });
  const section = page.locator('#distributor-launch');
  await expect(section).toHaveAccessibleName('Distributor Orders & Pre-Orders');
  await expect(section.locator('p').first()).toHaveText('8.5 Years In The Making');
  await expect(section.locator('h2')).toHaveText('Distributor Orders & Pre-Orders');
  await expect(section.locator('p').last()).toHaveText('Open November 2026');
  await expect(section.locator('button,a,input')).toHaveCount(0);
  expect(await section.evaluate(el => {
    const hero = document.querySelector('.key-hero')!;
    const fire = document.querySelector('.key-fire')!;
    return Boolean(hero.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
      && Boolean(el.compareDocumentPosition(fire) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  const initial = page.viewportSize()!;
  expect(await page.evaluate(() => devicePixelRatio)).toBe(info.project.use.deviceScaleFactor ?? 1);
  for (const viewport of [initial, { width: 320, height: 568 }, { width: 768, height: 1024 }, { width: 874, height: 402 }]) {
    await page.setViewportSize(viewport);
    await section.scrollIntoViewIfNeeded();
    await waitForVisibleMedia(page);
    await page.evaluate(async () => {
      await Promise.all([...document.images].filter(image => {
        const box = image.getBoundingClientRect(); return box.bottom > 0 && box.top < innerHeight;
      }).map(image => image.decode().catch(() => {})));
    });
    const geometry = await section.evaluate(el => {
      const canvas = document.querySelector('.canvas')!.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      const fire = document.querySelector('.key-fire')!.getBoundingClientRect();
      const copy = el.querySelector('.distributor-launch__copy')!.getBoundingClientRect();
      const glyphs = [...el.querySelectorAll('p,h2')].map(line => { const range = document.createRange(); range.selectNodeContents(line); return range.getBoundingClientRect(); });
      const text = { left: Math.min(...glyphs.map(r => r.left)), right: Math.max(...glyphs.map(r => r.right)), top: Math.min(...glyphs.map(r => r.top)), bottom: Math.max(...glyphs.map(r => r.bottom)) };
      // Visible alpha>=32 source bounds, independently measured from the immutable artwork.
      const sourceArcs = [[14,18,181,220],[519,177,686,379]];
      const arcs = [...el.querySelectorAll<HTMLImageElement>('.distributor-launch__orbit')].map((image, i) => {
        const frame=image.getBoundingClientRect(), [left,top,right,bottom]=sourceArcs[i];
        return { width:frame.width,height:frame.height,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,
          visible:{left:frame.left+left/701*frame.width,right:frame.left+right/701*frame.width,top:frame.top+top/401*frame.height,bottom:frame.top+bottom/401*frame.height},
          pointerEvents:getComputedStyle(image).pointerEvents,hidden:image.getAttribute('aria-hidden'),alt:image.alt };
      });
      const visible={left:Math.min(...arcs.map(a=>a.visible.left)),right:Math.max(...arcs.map(a=>a.visible.right)),top:Math.min(...arcs.map(a=>a.visible.top)),bottom:Math.max(...arcs.map(a=>a.visible.bottom))};
      return {
        width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
        y: (box.top - canvas.top) / canvas.width * 941,
        end: (box.bottom - canvas.top) / canvas.width * 941,
        fire: (fire.top - canvas.top) / canvas.width * 941,
        text, copy: {width:copy.width,height:copy.height}, arcs, visible,
        clearance:{left:text.left-visible.left,right:visible.right-text.right,top:text.top-visible.top,bottom:visible.bottom-text.bottom},
        lines: [...el.querySelectorAll('p,h2')].map(line => {
          const style = getComputedStyle(line);
          return { font: style.fontFamily, weight: style.fontWeight,
            typography: [style.fontFamily, style.fontSize, style.fontWeight, style.fontStyle, style.lineHeight, style.color, style.letterSpacing],
            fits: line.scrollWidth <= line.clientWidth + 1,
            top: line.getBoundingClientRect().top, bottom: line.getBoundingClientRect().bottom,
            height: line.getBoundingClientRect().height, lineHeight: parseFloat(style.lineHeight) };
        }),
      };
    });
    expect(geometry.width).toBe(viewport.width);
    expect(geometry.overflow).toBe(false);
    expect(geometry.y).toBeCloseTo(1730, 0);
    expect(geometry.end).toBeLessThan(2000);
    expect(geometry.fire).toBeCloseTo(2048, 0);
    expect(geometry.arcs).toHaveLength(2);
    for (const arc of geometry.arcs) {
      expect(arc.naturalWidth).toBe(701); expect(arc.naturalHeight).toBe(401);
      expect(Math.abs(arc.height-arc.width*401/701)).toBeLessThan(1);
      expect(arc.pointerEvents).toBe('none'); expect(arc.hidden).toBe('true'); expect(arc.alt).toBe('');
    }
    expect(geometry.copy.width).toBeCloseTo(geometry.text.right-geometry.text.left,0);
    expect(geometry.visible.right-geometry.visible.left).toBeLessThan((geometry.text.right-geometry.text.left)*1.35);
    expect(geometry.clearance.left).toBeGreaterThan(8); expect(geometry.clearance.right).toBeGreaterThan(8);
    expect(Math.abs(geometry.clearance.left-geometry.clearance.right)).toBeLessThan(2);
    expect(geometry.clearance.top).toBeGreaterThanOrEqual(0); expect(geometry.clearance.bottom).toBeGreaterThanOrEqual(0);
    expect(geometry.clearance.top).toBeLessThan(14); expect(geometry.clearance.bottom).toBeLessThan(14);
    expect(Math.abs(geometry.clearance.top-geometry.clearance.bottom)).toBeLessThan(3);
    if (viewport.width===402 || viewport.width===440) {
      expect(geometry.clearance.left).toBeLessThan(24); expect(geometry.clearance.right).toBeLessThan(24);
    }
    measurements.push({viewport,geometry});
    for (const line of geometry.lines) {
      expect(line.font).toContain('OpenSans'); expect(line.fits).toBe(true);
      expect(line.height).toBeLessThanOrEqual(line.lineHeight + 1);
    }
    expect(geometry.lines.map(line => line.weight)).toEqual(['400', '400', '400']);
    for (const line of geometry.lines) expect(line.typography).toEqual(geometry.lines[0].typography);
    const gaps = [geometry.lines[1].top - geometry.lines[0].bottom, geometry.lines[2].top - geometry.lines[1].bottom];
    expect(gaps[0]).toBeGreaterThan(0);
    expect(Math.abs(gaps[0] - gaps[1])).toBeLessThan(.1);
    await page.screenshot({ path: `${dir}/${info.project.name}-${viewport.width}.png`, scale: 'css' });
    if (viewport === initial) {
      await section.evaluate(el => {
        const canvas = el.closest('main')!.getBoundingClientRect();
        scrollTo(0, scrollY + canvas.top + 1300 / 941 * canvas.width);
      });
      await waitForVisibleMedia(page);
      await page.screenshot({ path: `${dir}/${info.project.name}-composition.png`, scale: 'css' });
    }
  }
  await page.setViewportSize(initial);
  await page.locator('#hero-reserve').scrollIntoViewIfNeeded(); await waitForVisibleMedia(page);
  await page.locator('#hero-reserve').click();
  await expect(page.locator('#unavailable-commerce')).toBeVisible();
  await expect(page.locator('#unavailable-commerce')).toContainText('November 20, 2026');
  await page.keyboard.press('Escape');
  await page.evaluate(() => scrollTo(0, 1600)); await waitForVisibleMedia(page);
  await page.locator('#launch-floating').click();
  await expect(page.locator('#launch-capture')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
  await writeFile(`${dir}/${info.project.name}-geometry.json`,JSON.stringify({measurements,errors},null,2));
});

test('launch announcement remains semantic with JavaScript disabled', async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: info.project.use.viewport });
  const page = await context.newPage();
  await page.goto(`${process.env.BASE_URL ?? 'http://127.0.0.1:3000'}/en`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: 'Distributor Orders & Pre-Orders' })).toContainText('Open November 2026');
  await context.close();
});
