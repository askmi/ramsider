import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { waitForVisibleMedia } from './helpers/media';
const dir = 'screenshots/lead-capture/launcher-correction';
test.skip(process.env.LEAD_CAPTURE_TESTS !== '1', 'Requires capture-enabled build and LEAD_CAPTURE_TESTS=1.');
async function press(page: Page, info: TestInfo, point: { x: number; y: number }) {
  if (info.project.name.includes('iphone')) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}
test.beforeEach(async ({ page }) => {
  await mkdir(dir, { recursive: true });
  await page.goto('/en'); await page.evaluate(() => document.fonts.ready); await waitForVisibleMedia(page);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 1600); });
  await expect(page.locator('#launch-floating')).toBeVisible();
});
test('contact icon matches Up and opens on actual SVG, padding and lower-edge presses across safe areas', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const button = page.locator('#launch-floating'); const up = page.locator('#back-to-top'); const form = page.locator('#launch-capture');
  await expect(button).toHaveAccessibleName('Contact RAMSIDER');
  await expect(button).toHaveText(''); await expect(button.locator('svg')).toHaveCount(1);
  for (const safe of [0, 34, 80]) {
    await page.evaluate(n => { document.documentElement.style.setProperty('--page-safe-bottom', `${n}px`); (document.activeElement as HTMLElement)?.blur(); }, safe);
    await page.mouse.move(0, 0);
    const comparison = await page.evaluate(() => {
      const properties = ['width', 'height', 'backgroundColor', 'borderRadius', 'borderColor', 'boxShadow', 'backdropFilter', 'padding'] as const;
      const read = (id: string) => { const el = document.getElementById(id)!; const s = getComputedStyle(el); const svg = getComputedStyle(el.querySelector('svg')!); return { ...Object.fromEntries(properties.map(p => [p, s[p]])), iconWidth: svg.width, iconHeight: svg.height }; };
      return { contact: read('launch-floating'), up: read('back-to-top') };
    });
    expect(comparison.contact).toEqual(comparison.up);
    const b = (await button.boundingBox())!; const u = (await up.boundingBox())!;
    expect(b.width).toBe(48); expect(b.height).toBe(48); expect(b.x).toBe(u.x); expect(u.y - b.y - b.height).toBeCloseTo(12, 1);
    if (safe === 34) await page.screenshot({ path: `${dir}/${info.project.name}-icons.png`, scale: 'css' });
    for (const target of ['svg', 'padding', 'lower-edge']) {
      const box = (await button.boundingBox())!; const svg = (await button.locator('svg').boundingBox())!;
      const point = target === 'svg' ? { x: svg.x + svg.width / 2, y: svg.y + svg.height / 2 } : { x: target === 'padding' ? box.x + 8 : box.x + box.width / 2, y: target === 'padding' ? box.y + box.height / 2 : box.y + box.height - 2 };
      const hit = await page.evaluate(p => document.elementFromPoint(p.x, p.y)?.closest('button')?.id, point);
      expect(hit).toBe('launch-floating'); await press(page, info, point);
      await expect(form).toBeVisible(); expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1500);
      if (safe === 34 && target === 'lower-edge') await page.screenshot({ path: `${dir}/${info.project.name}-tap-open.png`, scale: 'css' });
      await form.getByRole('button', { name: 'Close', exact: true }).click(); await expect(button).toBeFocused();
    }
  }
  for (const key of ['Enter', 'Space']) { await button.focus(); await page.keyboard.press(key); await expect(form).toBeVisible(); await page.keyboard.press('Escape'); await expect(button).toBeFocused(); }
  await page.emulateMedia({ reducedMotion: 'reduce' }); await up.click(); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0); await expect(button).toBeHidden();
  expect(errors).toEqual([]);
});
test('compact pair remains separate and contact opens at narrow, short, tablet and landscape sizes', async ({ page }, info) => {
  for (const size of [{ width: 320, height: 568 }, { width: 402, height: 390 }, { width: 768, height: 1024 }, { width: 874, height: 402 }]) {
    await page.setViewportSize(size); await page.evaluate(() => { document.documentElement.style.setProperty('--page-safe-bottom', '34px'); scrollTo(0, 1600); });
    const button = page.locator('#launch-floating'); await expect(button).toBeVisible();
    const b = (await button.boundingBox())!; const up = (await page.locator('#back-to-top').boundingBox())!;
    expect(b.width).toBe(48); expect(b.height).toBe(48); expect(up.y - b.y - b.height).toBeCloseTo(12, 1); expect(b.y).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${dir}/${info.project.name}-${size.width}x${size.height}.png`, scale: 'css' });
    await press(page, info, { x: b.x + b.width / 2, y: b.y + b.height - 2 }); await expect(page.locator('#launch-capture')).toBeVisible();
    await page.locator('#launch-capture').getByRole('button', { name: 'Close', exact: true }).click(); await expect(button).toBeFocused();
  }
});
test('accepted and unresolved status retains an icon-only accessible opener', async ({ page }, info) => {
  for (const uncertain of [false, true]) {
    await page.evaluate(value => localStorage.setItem('uno-launch-2026-receipt-v1', JSON.stringify({ updates: !value, callback: false, confirmation: false, ...(value ? { uncertain: true } : {}) })), uncertain);
    await page.reload(); await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 1600); });
    const button = page.locator('#launch-floating'); await expect(button).toBeVisible(); await expect(button).toHaveText(''); await expect(button).toHaveAccessibleName(uncertain ? 'Request Status' : 'Request Received');
    const b = (await button.boundingBox())!; expect(b.width).toBe(48);
    await press(page, info, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
    const form = page.locator('#launch-capture'); await expect(form).toBeVisible();
    if (uncertain) await expect(form.getByRole('alert')).toContainText('couldn’t confirm delivery');
    else await expect(form.getByRole('heading', { name: 'You’re on the Launch List' })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(button).toBeFocused();
  }
});
