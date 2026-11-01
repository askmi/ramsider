import { expect, type Page } from '@playwright/test';

const media = (page: Page) => page.locator('#product-film video');

/** Reveal through real activity and verify the actual hit target before top actions. */
export async function revealFilmTop(page: Page) {
  const actionable = () => page.locator('.film-player__list-toggle').evaluate(el => {
    const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return (hit === el || el.contains(hit)) && getComputedStyle(el).pointerEvents !== 'none';
  });
  await expect.poll(async () => {
    if (await actionable()) return true;
    const box = (await media(page).boundingBox())!;
    if (await page.evaluate(() => matchMedia('(pointer:coarse)').matches)) await media(page).tap({ position: { x: box.width / 2, y: box.height / 2 } });
    else { await page.mouse.move(box.x + box.width / 2 - 2, box.y + box.height / 2); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); }
    return actionable();
  }, { intervals: [100, 250, 500], timeout: 5000 }).toBe(true);
  // Wait for an in-progress fade without tapping an already actionable video again.
  await expect.poll(() => page.locator('.film-player__top').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
}
export async function openFilmList(page: Page) {
  await revealFilmTop(page);
  if (await page.evaluate(() => matchMedia('(pointer:coarse)').matches)) await page.locator('.film-player__list-toggle').tap();
  else await page.locator('.film-player__list-toggle').click();
}
