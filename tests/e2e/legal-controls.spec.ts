import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const root = process.env.LEGAL_CONTROLS_CAPTURE_DIR ?? 'screenshots/legal-documents/2026-11-18/page-controls';

for (const name of ['privacy', 'terms', 'delivery']) {
  test(`${name} offers Home above return-to-top without a Contact launcher`, async ({ page }, info) => {
  await mkdir(`${root}/${info.project.name}`, { recursive: true });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const checks = [];
    await page.goto(`/en/${name}`); await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => innerWidth)).toBe(page.viewportSize()!.width);
    if (info.project.name.includes('iphone')) expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
    const home = page.getByRole('link', { name: 'Home', exact: true });
    const up = page.getByRole('button', { name: 'Back to top', exact: true });
    await expect(home).toBeVisible(); await expect(home).toHaveAttribute('href', '/en');
    await expect(up).toHaveCount(0); await expect(page.locator('.contact-launcher')).toHaveCount(0);
    const nav = page.getByRole('navigation', { name: 'Documents', exact: true });
    await expect(nav).toBeVisible(); await expect(nav.locator('h2')).toHaveCount(0);
    expect(await nav.innerText()).not.toContain('Documents');
    await page.waitForTimeout(500); // Let mobile WebKit commit the fixed-control compositing layer.
    await page.screenshot({ path: `${root}/${info.project.name}/${name}-top.png` });
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(up).toBeVisible();
    const homeBox = (await home.boundingBox())!, upBox = (await up.boundingBox())!;
    expect(homeBox.width).toBe(48); expect(homeBox.height).toBe(48);
    expect(upBox.width).toBe(48); expect(upBox.height).toBe(48);
    expect(homeBox.x).toBe(upBox.x); expect(upBox.y - homeBox.y).toBe(60);
    for (const target of [home, up, ...await nav.locator('a').all()]) {
      expect(await target.evaluate(el => {
        const b = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));
      })).toBe(true);
    }
    await page.waitForTimeout(500); // Screenshot paint must follow the settled scroll, not only layout.
    await page.screenshot({ path: `${root}/${info.project.name}/${name}-footer.png` });
    await up.click(); await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(1);
    await expect(page.locator('#home-link')).toBeFocused(); await expect(up).toHaveCount(0);
    if (info.project.name.includes('iphone')) {
      await home.tap();
    } else {
      await home.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      await expect(home).toBeFocused(); expect(await home.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
      await page.keyboard.press('Enter');
    }
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator('html')).toHaveAttribute('data-story-media-ready', '', { timeout: 60000 });
    checks.push({ name, homeBox, upBox, homeNavigation: true, scrollAndFocus: true });
    expect(errors).toEqual([]);
    await writeFile(`${root}/${info.project.name}/${name}-controls.json`, JSON.stringify({ checks, errors }, null, 2));
  });
}

test('control stack adapts to safe areas and preserves main-page controls', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Single responsive owner; primary screenshots above');
  await mkdir(`${root}/adaptation`, { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/delivery'); await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      document.documentElement.style.setProperty('--page-safe-bottom', '70px');
      scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    });
    const up = page.getByRole('button', { name: 'Back to top' }); await expect(up).toBeVisible();
    const upBox = (await up.boundingBox())!;
    expect(900 - upBox.y - upBox.height).toBe(86);
    for (const link of await page.locator('.site-footer__documents a').all()) {
      expect(await link.evaluate(el => {
        const b = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2));
      })).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `${root}/adaptation/delivery-${width}-safe70.png` });
    await up.click(); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  }
  await page.goto('/en');
  await expect(page.locator('.home-launcher')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-story-media-ready', '', { timeout: 60000 });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  if (process.env.LEAD_CAPTURE_ENABLED === 'false' || process.env.LEAD_CAPTURE_OFF_TESTS === '1') {
    await expect(page.locator('.contact-launcher')).toHaveCount(0);
  } else {
    await expect(page.locator('.contact-launcher')).toBeVisible();
  }
  await expect(page.locator('.back-to-top')).toBeVisible();
  await expect(page.locator('.site-footer__documents h2')).toHaveCount(0);
  await page.screenshot({ path: `${root}/adaptation/main-footer.png` });
});
