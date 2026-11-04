import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';
import { openFilmList, revealFilmTop } from './film-reveal-top';

const root = process.env.PROJECT_GROUP_CAPTURE_DIR ?? 'screenshots/video/projects/groups/acceptance';
const groups = {
  ramsider: ['project-ramsider-overview', 'project-ramsider-asmohookah', 'project-ramsider-sosuda', 'project-ramsider-cubos'],
  ramsmobile: ['project-ramsmobile-protos', 'project-ramsmobile-rev'],
  ramswear: ['project-ramswear'],
};
async function press(page: Page, selector: string) {
  if (await page.evaluate(() => matchMedia('(pointer:coarse)').matches)) await page.locator(selector).tap();
  else await page.locator(selector).click();
}
async function ready(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#product-film img[src]').evaluateAll(images => Promise.all(images.map(img => (img as HTMLImageElement).decode())));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function squareMedia(page: Page) {
  const result = await page.locator('#product-film').evaluate(panel => {
    const selectors = ['.film-gallery', '.product-film__header', '.film-gallery__main', '.film-gallery__hero', '.film-gallery__hero img', '.film-gallery__list', '.film-gallery__item', '.film-gallery__thumbnail', '.film-gallery__thumbnail img', '.film-player', 'video', '.film-playlist', '.film-playlist__item', '.film-playlist__item img', '.film-ended__next img'];
    const elements = [panel, ...selectors.flatMap(selector => [...panel.querySelectorAll(selector)])];
    return elements.map(el => { const css = getComputedStyle(el); return { element: el.className || el.tagName, corners: [css.borderTopLeftRadius, css.borderTopRightRadius, css.borderBottomLeftRadius, css.borderBottomRightRadius] }; });
  });
  for (const item of result) expect(item.corners, String(item.element)).toEqual(['0px', '0px', '0px', '0px']);
  for (const pseudo of await page.locator('.film-gallery__thumbnail').evaluateAll(items => items.map(el => getComputedStyle(el, '::after').borderRadius))) expect(pseudo).toBe('0px');
  return result;
}
async function members(page: Page, selector: string) {
  return page.locator(selector).evaluateAll(items => items.map(el => new URL(el.querySelector('img')!.getAttribute('src')!, location.href).pathname.split('/').at(-1)!.replace(/-thumb\.jpg$|\.jpg$/g, '')));
}
async function decoded(page: Page) {
  await expect.poll(() => page.locator('#product-film video').evaluate((video: HTMLVideoElement) => video.currentTime > .1 && video.videoWidth > 0 && video.readyState >= 2 && !video.error), { timeout: 60000 }).toBe(true);
}
test.use({ serviceWorkers: 'block', actionTimeout: 20000 });
test.setTimeout(240000);
test.beforeEach(async ({ page }) => { await silenceTestMedia(page); await mkdir(root, { recursive: true }); });

test('each project owns only its square preview and playlist with bounded navigation and replay', async ({ page }, info) => {
  const errors: string[] = [], requests: string[] = [], evidence = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/\/films\/project-/.test(request.url())) requests.push(new URL(request.url()).pathname); });
  await page.goto('/en?iphonePlayer=window');
  expect(await page.evaluate(() => innerWidth)).toBe(info.project.use.viewport!.width);
  if (info.project.name.includes('iphone')) expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
  for (const [group, ids] of Object.entries(groups)) {
    requests.length = 0;
    const opener = page.locator(`#project-${group}`); await opener.scrollIntoViewIfNeeded();
    await press(page, `#project-${group}`); await expect(page.locator('#product-film')).toBeVisible();
    expect(await members(page, '.film-gallery__item')).toEqual(ids);
    await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', ids[0]);
    expect(requests, 'No project media before Play').toEqual([]);
    await ready(page); const previewCorners = await squareMedia(page);
    const geometry = await page.locator('.film-gallery__hero img').evaluate(img => { const box = img.getBoundingClientRect(), frame = img.parentElement!.getBoundingClientRect(); return { width: box.width, height: box.height, innerWidth: frame.width }; });
    expect(Math.abs(geometry.width - geometry.innerWidth)).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.height - geometry.width * 9 / 16)).toBeLessThanOrEqual(1);
    expect(await page.locator('.film-gallery__play').evaluate(el => getComputedStyle(el).borderRadius)).toBe('50%');
    await page.screenshot({ path: `${root}/${info.project.name}-${group}-preview.png` });
    await press(page, '.film-gallery__hero'); await decoded(page);
    await expect(page.locator('.film-previous')).toBeDisabled();
    if (ids.length === 1) await expect(page.locator('.film-next')).toBeDisabled();
    else await expect(page.locator('.film-next')).toBeEnabled();
    await squareMedia(page); await page.screenshot({ path: `${root}/${info.project.name}-${group}-playing.png` });
    await press(page, '.film-fullscreen');
    if (info.project.name.includes('iphone')) await expect(page.locator('#film-player')).toHaveAttribute('data-full-window', 'true');
    else await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await openFilmList(page); expect(await members(page, '.film-playlist__item')).toEqual(ids);
    await ready(page); await squareMedia(page);
    await page.screenshot({ path: `${root}/${info.project.name}-${group}-list.png` });
    const last = page.locator('.film-playlist__item').last();
    if (ids.length > 1) {
      if (info.project.name.includes('iphone')) { await last.tap(); await last.tap(); }
      else { await last.click(); await last.click(); }
      await decoded(page);
    } else await page.keyboard.press('Escape');
    await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', ids.at(-1)!);
    await expect(page.locator('.film-next')).toBeDisabled();
    await page.keyboard.press('Escape');
    if (info.project.name.includes('iphone')) await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window');
    else await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
    await page.locator('#product-film video').evaluate((video: HTMLVideoElement) => { video.currentTime = video.duration - .5; return video.play(); });
    await expect(page.locator('.film-ended__replay')).toBeVisible({ timeout: 45000 });
    await expect(page.locator('.film-ended__next')).toHaveCount(0);
    await expect(page.locator('.film-next')).toBeDisabled(); await squareMedia(page);
    await page.screenshot({ path: `${root}/${info.project.name}-${group}-ended.png` });
    await press(page, '.film-ended__replay'); await decoded(page);
    const foreignRequests = requests.filter(path => !ids.some(id => path.startsWith(`/films/${id}/`)));
    expect(foreignRequests).toEqual([]);
    await revealFilmTop(page); await press(page, '.film-player__close');
    await expect(page.locator('#product-film')).not.toBeVisible(); await expect(opener).toBeFocused();
    await expect(page.locator('#product-film video')).not.toHaveAttribute('src');
    evidence.push({ group, ids, geometry, previewCorners, foreignRequests, lastFilm: ids.at(-1), endedReplay: true });
  }
  await page.locator('#film-play').scrollIntoViewIfNeeded(); await press(page, '#film-play');
  await expect(page.locator('.film-gallery__item')).toHaveCount(7); await expect(page.locator('#film-player')).toHaveAttribute('data-film-id', 'uno-introduction');
  await ready(page); await squareMedia(page); await page.screenshot({ path: `${root}/${info.project.name}-uno-square-preview.png` });
  await page.keyboard.press('Escape'); expect(errors).toEqual([]);
  await writeFile(`${root}/${info.project.name}-groups.json`, JSON.stringify({ groups: evidence, originalUNOCount: 7, errors }, null, 2));
});

test('square isolated galleries adapt to narrow short tablet and landscape windows', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Required Pro/Max states are covered by the first test');
  await page.goto('/en?iphonePlayer=window');
  for (const [width, height] of [[320, 640], [402, 560], [768, 1024], [874, 402], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    for (const [group, ids] of Object.entries(groups)) {
      await page.locator(`#project-${group}`).scrollIntoViewIfNeeded(); await press(page, `#project-${group}`);
      expect(await members(page, '.film-gallery__item')).toEqual(ids);
      await ready(page); await squareMedia(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${root}/${width}x${height}-${group}-preview.png` });
      await press(page, '.film-gallery__hero'); await decoded(page); await press(page, '.film-fullscreen');
      await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
      await openFilmList(page); expect(await members(page, '.film-playlist__item')).toEqual(ids);
      await ready(page); await squareMedia(page);
      const bounds = await page.locator('.film-playlist').boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(-1); expect(bounds!.y).toBeGreaterThanOrEqual(-1);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1); expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(height + 1);
      await page.screenshot({ path: `${root}/${width}x${height}-${group}-list.png` });
      await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
      await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
      // After native fullscreen exit the browser is still restoring inline geometry.
      // Exercise dialog Escape here; pointer Close is covered in the group lifecycle test.
      await page.keyboard.press('Escape'); await expect(page.locator('#product-film')).not.toBeVisible();
    }
  }
});
