import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { waitForVisibleMedia } from './helpers/media';

const title = 'The Global Launch Is Coming';
const message = 'Official worldwide sales of RAMSIDER UNO devices begin on November 20, 2026. A new ritual is almost here.';
const scenarios = [
  ...['hero-reserve', 'order-create', 'final-create'].map(id => ({ id, dialogId: 'unavailable-commerce', title, message })),
  { id: 'set-explore', dialogId: 'unavailable-set', title: 'The Complete UNO Experience', message: 'Full details of the RAMSIDER UNO device lineup, features, and accessory set will be available from November 20, 2026 — the official launch of worldwide sales.' },
];

test('all four original buttons show their launch notices and restore their own focus', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/ar');
  await expect(page).toHaveURL(/\/en(?:[?#]|$)/);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await page.evaluate(() => document.fonts.ready);
  await waitForVisibleMedia(page);
  expect(await page.evaluate(() => innerWidth)).toBe(page.viewportSize()!.width);
  if (info.project.name.includes('iphone')) expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
  const dialog = page.locator('#unavailable-commerce');
  await expect(dialog).toBeHidden();
  const dir = 'screenshots/sales-launch'; await mkdir(dir, { recursive: true });
  await page.screenshot({ path: `${dir}/${info.project.name}-hero.png`, scale: 'css' });
  for (const { id, dialogId, title, message } of scenarios) {
    const dialog = page.locator(`#${dialogId}`);
    const trigger = page.locator(`#${id}`);
    await trigger.scrollIntoViewIfNeeded(); await waitForVisibleMedia(page);
    await trigger.click();
    await expect(dialog).toBeVisible(); await expect(dialog).toHaveAccessibleName(title);
    await expect(dialog.locator('p')).toHaveText(message);
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await page.screenshot({ path: `${dir}/${info.project.name}-${id}.png`, scale: 'css' });
    const close = dialog.getByRole('button', { name: 'Close', exact: true });
    await expect(close).toBeInViewport();
    await close.click(); await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
    for (const key of ['Enter', 'Space']) {
      await trigger.focus(); await page.keyboard.press(key);
      await expect(dialog).toBeVisible(); await expect(dialog).toContainText('November 20, 2026');
      await close.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
      await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
      await page.locator('#home-link').evaluate(el => (el as HTMLElement).focus());
      await expect(page.locator('#home-link')).not.toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden(); await expect(trigger).toBeFocused();
    }
  }
  await page.locator('#account-personal').scrollIntoViewIfNeeded();
  await waitForVisibleMedia(page); await page.locator('#account-personal').click();
  await expect(page.locator('#unavailable-account')).toHaveAccessibleName('Further information is needed');
  await expect(page.locator('#unavailable-account')).not.toContainText('November 20, 2026');
  await page.keyboard.press('Escape');
  await expect(page.locator('#account-personal')).toBeFocused();
  for (const viewport of [{ width: 320, height: 568 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const { id, dialogId } of [scenarios[0], scenarios[3]]) {
      const dialog = page.locator(`#${dialogId}`);
      await page.locator(`#${id}`).scrollIntoViewIfNeeded(); await waitForVisibleMedia(page);
      await page.locator(`#${id}`).click(); await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Close' })).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await page.screenshot({ path: `${dir}/${info.project.name}-${id}-${viewport.width}-reduced.png`, scale: 'css' });
      await page.keyboard.press('Escape');
    }
  }
  expect(errors).toEqual([]);
});
