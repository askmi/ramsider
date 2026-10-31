import { expect, test } from '@playwright/test';

test('presentation navigation retains glass and dismisses on outside input and page scroll', async ({ page }, testInfo) => {
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const menu = page.locator('.menu');
    const nav = menu.locator('nav');
    await page.locator('#navigation-toggle').click();
    await expect(menu).toHaveAttribute('open');
    const navSurface = await nav.evaluate(element => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, blur: style.backdropFilter, border: style.borderTopColor, radius: style.borderTopLeftRadius, shadow: style.boxShadow };
    });
    await page.screenshot({ path: `docs/evidence/nav-menu/nav-${locale}-${testInfo.project.name}.png` });

    const { width, height } = page.viewportSize()!;
    await page.mouse.click(width / 2, height - 5);
    await expect(menu).not.toHaveAttribute('open');

    await page.locator('#navigation-toggle').click();
    const internalScroll = await nav.evaluate(element => {
      element.scrollTop = 100;
      return { top: element.scrollTop, overflow: element.scrollHeight > element.clientHeight };
    });
    await expect(menu).toHaveAttribute('open');
    if (internalScroll.overflow) expect(internalScroll.top).toBeGreaterThan(0);
    expect(await page.evaluate(() => scrollY)).toBe(0);

    if (testInfo.project.name.includes('webkit')) {
      // Playwright cannot synthesize mouse wheels on mobile WebKit.
      await page.evaluate(() => scrollTo({ top: 500, behavior: 'instant' }));
    } else {
      await page.mouse.move(width / 2, height - 5);
      await page.mouse.wheel(0, 600);
    }
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await expect(menu).not.toHaveAttribute('open');

    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(page.locator('#locale-toggle')).toBeHidden();
    expect(navSurface.radius).toBe('11px');
    expect(navSurface.border).toBe('rgb(181, 140, 78)');
    expect(navSurface.blur).toBe('blur(4px)');
    expect(navSurface.shadow).not.toBe('none');
    await page.locator('#navigation-toggle').click();
    await expect(page.locator('#locale-options')).toBeHidden();
    await expect(menu).toHaveAttribute('open');
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open');
    await expect(page.locator('#navigation-toggle')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('open');
    await nav.locator('a[href="#hospitality-section"]').click();
    await expect(menu).not.toHaveAttribute('open');
    await expect(page).toHaveURL(/#hospitality-section$/);
  }
});

test('navigation links remain inside the panel in every locale', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'desktop-firefox');
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#navigation-toggle').click();
    const panel = page.locator('.menu nav');
    await expect(panel.locator('a[href^="#"]')).toHaveCount(3);
    const geometry = await panel.evaluate(element => ({ scroll: element.scrollWidth, width: element.clientWidth }));
    expect(geometry.scroll, `${locale} navigation overflows horizontally`).toBeLessThanOrEqual(geometry.width + 1);
  }
});
