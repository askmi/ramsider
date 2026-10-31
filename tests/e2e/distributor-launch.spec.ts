import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
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
  const dir = `screenshots/distributor-orbit/${process.env.LAUNCH_PUBLIC ? 'public' : 'local'}`;
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
      const orbit = el.querySelector<HTMLImageElement>('.distributor-launch__orbit')!;
      const frame = orbit.getBoundingClientRect();
      return {
        width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
        y: (box.top - canvas.top) / canvas.width * 941,
        end: (box.bottom - canvas.top) / canvas.width * 941,
        fire: (fire.top - canvas.top) / canvas.width * 941,
        orbit: { width: frame.width, height: frame.height, parentWidth: box.width,
          sourceY: (frame.top - canvas.top) / canvas.width * 941,
          sourceEnd: (frame.bottom - canvas.top) / canvas.width * 941,
          naturalWidth: orbit.naturalWidth, naturalHeight: orbit.naturalHeight,
          pointerEvents: getComputedStyle(orbit).pointerEvents, hidden: orbit.getAttribute('aria-hidden'), alt: orbit.alt },
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
    expect(geometry.orbit.naturalWidth).toBe(701); expect(geometry.orbit.naturalHeight).toBe(401);
    expect(geometry.orbit.width).toBeCloseTo(geometry.orbit.parentWidth, 0);
    expect(Math.abs(geometry.orbit.height - geometry.orbit.width * 401 / 701)).toBeLessThan(1);
    expect(geometry.orbit.sourceY).toBeCloseTo(1550, 0);
    expect(geometry.orbit.sourceEnd).toBeLessThan(geometry.fire);
    expect(geometry.orbit.pointerEvents).toBe('none'); expect(geometry.orbit.hidden).toBe('true'); expect(geometry.orbit.alt).toBe('');
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
});

test('launch announcement remains semantic with JavaScript disabled', async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: info.project.use.viewport });
  const page = await context.newPage();
  await page.goto(`${process.env.BASE_URL ?? 'http://127.0.0.1:3000'}/en`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('region', { name: 'Distributor Orders & Pre-Orders' })).toContainText('Open November 2026');
  await context.close();
});
