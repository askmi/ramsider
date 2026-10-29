import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { technologyGroups } from '../../lib/technology-gallery';
import { locales } from '../../lib/i18n';
import { openTechnology } from './helpers/technology';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.setTimeout(240000);
test.beforeEach(async ({ page }) => silenceTestMedia(page));
const root = 'screenshots/technology-fit/after';
async function ready(page: Page, group: string, photo: number) {
  const viewer = page.locator('#technology-viewer');
  await expect(viewer).toHaveAttribute('data-group', group);
  await expect(viewer).toHaveAttribute('data-photo-index', String(photo));
  await expect(viewer).toHaveAttribute('aria-busy', 'false', { timeout: 30000 });
  await expect(viewer.locator('.technology-viewer__photo img')).toHaveAttribute('data-media-ready', '');
  await page.evaluate(() => document.fonts.ready);
  await expect(viewer.locator('.technology-viewer__loading')).toHaveCount(0);
}
async function fits(page: Page) {
  const geometry = await page.locator('#technology-viewer').evaluate(viewer => {
    const stage = viewer.querySelector('.technology-viewer__stage')!.getBoundingClientRect();
    const viewport = viewer.querySelector('.technology-viewer__scroll')!;
    const image = viewer.querySelector('img') as HTMLImageElement;
    const photo = image.getBoundingClientRect(), article = viewer.querySelector('article')!.getBoundingClientRect();
    const scale = Math.min(stage.width / image.naturalWidth, stage.height / image.naturalHeight);
    const boxes = [...viewer.querySelectorAll<HTMLElement>('.technology-description__box')];
    return { width: innerWidth, dpr: devicePixelRatio, viewportMeta: document.querySelector('meta[name=viewport]')?.getAttribute('content'), stage: stage.toJSON(), photo: photo.toJSON(), article: article.toJSON(), expected: { width: image.naturalWidth * scale, height: image.naturalHeight * scale }, source: [image.naturalWidth, image.naturalHeight], overflowY: viewport.scrollHeight - viewport.clientHeight, overflowX: viewport.scrollWidth - viewport.clientWidth, scrollTop: viewport.scrollTop, documentOverflow: document.documentElement.scrollWidth > innerWidth,
      clipped: boxes.filter(box => { const text = box.firstElementChild as HTMLElement; return text.scrollHeight > box.clientHeight + 1 || text.scrollWidth > box.clientWidth + 1; }).map(box => box.parentElement?.getAttribute('data-description-block')),
      layers: [...viewer.querySelectorAll('.technology-viewer__descriptions > svg')].map(el => el.getBoundingClientRect().toJSON()),
      outside: boxes.filter(box => { const r = box.getBoundingClientRect(); return r.top < photo.top - 1 || r.bottom > photo.bottom + 1 || r.left < photo.left - 1 || r.right > photo.right + 1; }).map(box => box.parentElement?.getAttribute('data-description-block')),
    };
  });
  expect(geometry.viewportMeta).toContain('width=device-width'); expect(geometry.documentOverflow).toBe(false);
  expect(geometry.overflowY).toBeLessThanOrEqual(1); expect(geometry.overflowX).toBeLessThanOrEqual(1); expect(geometry.scrollTop).toBe(0);
  expect(geometry.clipped).toEqual([]); expect(geometry.outside).toEqual([]);
  for (const axis of ['width', 'height'] as const) { expect(Math.abs(geometry.photo[axis] - geometry.expected[axis])).toBeLessThanOrEqual(1); expect(Math.abs(geometry.photo[axis] - geometry.article[axis])).toBeLessThanOrEqual(1); }
  expect(geometry.photo.top).toBeGreaterThanOrEqual(geometry.stage.top - 1); expect(geometry.photo.bottom).toBeLessThanOrEqual(geometry.stage.bottom + 1);
  expect(Math.abs((geometry.photo.left + geometry.photo.right) / 2 - (geometry.stage.left + geometry.stage.right) / 2)).toBeLessThanOrEqual(1);
  expect(Math.abs((geometry.photo.top + geometry.photo.bottom) / 2 - (geometry.stage.top + geometry.stage.bottom) / 2)).toBeLessThanOrEqual(1);
  for (const layer of geometry.layers) for (const axis of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(layer[axis] - geometry.photo[axis])).toBeLessThanOrEqual(1);
  return geometry;
}
async function walk(page: Page, capture: (group: string, photo: number) => Promise<void>) {
  const viewer = page.locator('#technology-viewer');
  for (const [index, group] of technologyGroups.entries()) {
    if (index) await viewer.locator('.technology-viewer__toolbar--bottom button').last().click();
    for (let photo = 0; photo < group.slides.length; photo++) {
      if (photo) await viewer.locator('.technology-viewer__toolbar--top > button').nth(1).click();
      await ready(page, group.title, photo); await capture(group.title, photo);
    }
  }
}

test('all 23 compositions fit Pro and Max including short height and rotation', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Both required mobile WebKit profiles');
  const max = info.project.name.includes('max'), width = max ? 440 : 402, height = max ? 956 : 874;
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); const rows: object[] = [];
  await mkdir(root, { recursive: true });
  for (const [w, h] of [[width, height], [width, 650], [height, width]]) {
    await page.setViewportSize({ width: w, height: h }); await page.goto('/en'); await openTechnology(page);
    await walk(page, async (group, photo) => {
      const g = await fits(page); expect(g.width).toBe(w); expect(g.dpr).toBe(3); rows.push({ group, slideIndex: photo, ...g });
      if (!max && w === width && h === height) await page.locator('.technology-viewer__content').screenshot({ path: `${root}/pro-${group}-${photo}.png` });
      if (['NobleCraft', 'CyberMind', 'TouchLink', 'PolyArmor'].includes(group) && photo === 0) await page.screenshot({ path: `${root}/${info.project.name}-${w}x${h}-${group}.png` });
    });
    await page.locator('.technology-viewer__close').click(); await expect(page.locator('#technology-viewer')).not.toBeVisible();
  }
  expect(errors).toEqual([]); await writeFile(`${root}/${info.project.name}-geometry.json`, JSON.stringify({ rows, errors }, null, 2));
});

test('all eleven locales keep every title, body and icon inside the fitted image', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One full locale owner, same source overlays on Max');
  const rows: object[] = []; await page.setViewportSize({ width: 390, height: 650 });
  for (const locale of locales) {
    await page.goto(`/${locale}`); await openTechnology(page);
    await walk(page, async (group, photo) => { rows.push({ locale, group, slideIndex: photo, ...await fits(page) });
      if (locale === 'ar' && photo === 0 && ['NobleCraft', 'TouchLink', 'PolyArmor'].includes(group)) await page.screenshot({ path: `${root}/arabic-${group}.png` });
    });
    await page.keyboard.press('Escape');
  }
  await writeFile(`${root}/locale-geometry.json`, JSON.stringify(rows, null, 2));
});

test('fit reacts to browser height, safe areas and desktop size while controls stay usable', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Responsive keyboard and pointer owner');
  await page.goto('/en'); await openTechnology(page); await ready(page, 'NobleCraft', 0);
  for (const [width, height] of [[390, 844], [390, 650], [390, 510], [844, 326], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width, height }); await fits(page);
    for (const selector of ['.technology-viewer__toolbar--top > button', '.technology-viewer__toolbar--bottom > button']) for (const button of await page.locator(`${selector}:not(:disabled)`).all()) {
      const box = (await button.boundingBox())!; expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
    }
  }
  await page.locator('.technology-viewer__canvas').evaluate(el => { (el as HTMLElement).style.setProperty('--toolbar-height', '80px'); (el as HTMLElement).style.setProperty('--bottom-height', '75px'); });
  await fits(page); // Synthetic safe-area geometry, not physical Safari chrome proof.
  await page.locator('.technology-viewer__scroll').focus(); await page.keyboard.press('ArrowDown'); await ready(page, 'HeatCore', 0); await fits(page);
  await page.keyboard.press('ArrowUp'); await ready(page, 'NobleCraft', 0); await fits(page);
  await page.keyboard.press('Escape'); await expect(page.locator('[data-technology-open]').first()).toBeFocused();
});
