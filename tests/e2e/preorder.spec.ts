import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const routes = ['reserve', 'pro', 'gold', 'compare', 'product-info', 'terms', 'returns', 'privacy', 'privacy-ru'];
const languages = ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko'];
async function ready(page: import('@playwright/test').Page) {
  await page.locator('[data-reservation-ready]').waitFor();
}

test('query priority, both model states and all source bindings', async ({ page }) => {
  await page.goto('/en/reserve?model=gold&model=pro'); await ready(page);
  await expect(page.locator('#model-gold')).toBeChecked();
  await expect(page.locator('[data-bind="name"]')).toHaveCount(6);
  for (const item of await page.locator('[data-bind="name"]').all()) await expect(item).toHaveText('UNO Gold Line');
  await expect(page.locator('#bind-total-1')).toHaveText('$1,999');
  await expect(page.locator('#bind-initial-1')).toHaveText('$999');
  await expect(page.locator('#bind-final-1')).toHaveText('$1,000');
  await expect(page.locator('#bind-finalAed-1')).toContainText('3,670');
  await expect(page.locator('#bind-hose-1')).toHaveText('White braided hose · titanium mouthpiece');
  await page.locator('#model-pro').check();
  await expect(page.locator('#bind-initial-1')).toHaveText('$599');
  await expect(page.locator('#bind-final-1')).toHaveText('$400');
  await expect(page.locator('#bind-initialAed-1')).toContainText('2,200');
  await expect(page.locator('#bind-finalAed-1')).toContainText('1,470');
  await expect(page.locator('#bind-reservoir-1')).toHaveText('Tinted reservoir');
  await page.reload(); await ready(page); await expect(page.locator('#model-gold')).toBeChecked();
  for (const query of ['', '?model=GOLD', '?model=bad']) {
    await page.goto(`/en/reserve${query}`); await ready(page); await expect(page.locator('#model-pro')).toBeChecked();
  }
  await page.goto('/en/reserve?model=gold'); await ready(page);
  await page.goto('/en/compare'); await page.goBack(); await ready(page);
  await expect(page.locator('#model-gold')).toBeChecked();
});

test('accessible validation, preview only, market restrictions and draft reset', async ({ page }) => {
  const network: string[] = [];
  page.on('request', request => { if (['fetch', 'xhr'].includes(request.resourceType()) && !request.url().includes('_rsc=')) network.push(request.url()); });
  await page.goto('/en/reserve'); await ready(page);
  await expect(page.locator('#age')).not.toBeChecked(); await expect(page.locator('#terms')).not.toBeChecked();
  await page.locator('#reserve-button').click();
  await expect(page.locator('#full-name')).toBeFocused();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(5);
  await page.locator('#full-name').fill('Test Buyer'); await page.locator('#email').fill('invalid');
  await page.locator('#country').selectOption('AE'); await page.locator('#age').check(); await page.locator('#terms').check();
  await page.locator('#reserve-button').click(); await expect(page.locator('#email')).toBeFocused();
  await page.locator('#email').fill('buyer@example.test');
  for (const country of ['IN', 'TH', 'TR', 'QA', 'OTHER']) {
    await page.locator('#country').selectOption(country);
    await expect(page.locator('#payment-option')).toBeHidden(); await expect(page.locator('#invoice-note')).toBeHidden();
    await expect(page.locator('#market-notice')).toHaveText('We will contact you about delivery options');
  }
  await page.locator('#reserve-button').click();
  await expect(page.locator('#confirmation')).toBeVisible();
  await expect(page.locator('#confirmation-title')).toBeFocused();
  await expect(page.locator('#reservation-number')).toHaveText('PREVIEW');
  await expect(page.locator('#next-payment-copy')).toHaveText('We will contact you about delivery options');
  await page.locator('#copy-number').click(); await expect(page.locator('#copy-status')).not.toBeEmpty();
  await page.locator('#country').selectOption('AE');
  await expect(page.locator('#confirmation')).toBeHidden();
  await expect(page.locator('#pay-now')).toBeDisabled();
  await page.locator('#reserve-button').click();
  await expect(page.locator('#next-payment-copy')).toHaveText('Preview only. No invoice has been sent.');
  await page.locator('#model-gold').check(); await expect(page.locator('#confirmation')).toBeHidden();
  await page.locator('#reserve-button').click(); await expect(page.locator('#bind-total-1')).toHaveText('$1,999');
  await page.locator('#full-name').fill('Changed Draft'); await expect(page.locator('#confirmation')).toBeHidden();
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
  expect(network.filter(url => !url.includes('/__nextjs'))).toEqual([]);
});

test('all nine routes, working links, correct fonts and screenshot evidence', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const dir = path.join('screenshots/preorder/final', testInfo.project.name); await fs.mkdir(dir, { recursive: true });
  const report = [];
  for (const route of routes) {
    const response = await page.goto(`/en/${route}`); expect(response?.status()).toBe(200);
    if (route === 'reserve') await ready(page);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const metrics = await page.locator('h1').evaluate(h => ({ font: getComputedStyle(h).fontFamily, size: getComputedStyle(h).fontSize, width: innerWidth, dpr: devicePixelRatio }));
    expect(metrics.font).toContain('OpenSans');
    await page.locator('#uno-document').screenshot({ path: path.join(dir, `${route}.png`) });
    const badLinks = await page.locator('#uno-document a[href^="/"]').evaluateAll(links => links.map(a => a.getAttribute('href')).filter(h => h?.endsWith('.html') || h?.includes('/en/en/')));
    expect(badLinks).toEqual([]); report.push({ route, ...metrics });
  }
  expect(errors).toEqual([]);
  await fs.writeFile(path.join(dir, 'metrics.json'), JSON.stringify(report, null, 2));
});

test('locale content, native privacy, RTL chrome and responsive widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-17-pro-webkit', 'One real mobile profile exercises locale/narrow matrix; other profiles cover route/state matrix.');
  test.setTimeout(180_000);
  for (const language of languages) {
    for (const route of ['reserve', 'compare', 'privacy']) {
      await page.goto(`/${language}/${route}`);
      if (route === 'reserve') await ready(page);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${language}/${route}`).toBe(true);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      if (language === 'ar') await expect(page.locator('.up-beta')).toHaveAttribute('dir', 'rtl');
    }
  }
  for (const width of [320, 375, 402, 440, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 956 });
    for (const route of ['reserve', 'compare', 'pro', 'privacy-ru']) {
      await page.goto(`/ru/${route}`); await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}/${route}`).toBe(true);
    }
  }
  await page.setViewportSize({ width: 402, height: 874 }); await page.goto('/ru/reserve'); await ready(page);
  await expect(page.locator('h1')).toHaveText('Создайтесвой UNO.');
  await expect(page.locator('#full-name').locator('..')).toContainText('Имя и фамилия');
  await page.goto('/ru/privacy-ru'); await expect(page.locator('article')).toHaveAttribute('data-policy-original', /RU/);
});

test('no JavaScript locks form safely and keeps documents available', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ ...testInfo.project.use, javaScriptEnabled: false });
  const page = await context.newPage(); await page.goto('/en/reserve?model=gold');
  await expect(page.locator('#model-controls')).toHaveAttribute('disabled', ''); await expect(page.locator('#reservation-controls')).toHaveAttribute('disabled', '');
  await expect(page.locator('#model-gold')).toBeDisabled(); await expect(page.locator('#full-name')).toBeDisabled(); await expect(page.locator('#reserve-button')).toBeDisabled();
  await expect(page.locator('.up-no-script')).toBeVisible();
  await expect(page.locator('.up-no-script')).toContainText('JavaScript is off');
  await page.locator('a[href="/en/terms"]').first().click(); await expect(page.locator('h1')).toContainText('Pre-order');
  await context.close();
});

test('both Create Your UNO buttons, hero, model and comparison links reach the real pages', async ({ page }) => {
  test.setTimeout(120_000);
  const destinations = [
    ['order-create', '/en/reserve'], ['final-create', '/en/reserve'], ['hero-reserve', '/en/reserve'],
    ['expressions-compare', '/en/compare'], ['pro-explore', '/en/pro'], ['gold-explore', '/en/gold'], ['set-explore', '/en/product-info#included'],
  ];
  for (const [id, destination] of destinations) {
    await page.goto('/en');
    const target = page.locator(`#${id}`); await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveAttribute('href', destination);
    // Required landing media guard settles foreground images before pointer/keyboard input.
    await expect.poll(() => page.evaluate(() => !document.querySelector('.media-progress-guard[data-blocked="true"]')), { timeout: 15000 }).toBe(true);
    await target.focus(); await page.keyboard.press('Enter');
    await expect.poll(() => new URL(page.url()).pathname + new URL(page.url()).hash).toBe(destination);
    await expect(page.locator('#uno-document')).toBeVisible();
  }
  for (const model of ['pro', 'gold']) {
    await page.goto(`/en/${model}`);
    const order = page.locator(`a[href="/en/reserve?model=${model}"]`).first(); await order.click(); await ready(page);
    await expect(page.locator(`#model-${model}`)).toBeChecked();
  }
  await page.goto('/ru');
  await expect(page.locator('#order-create')).toHaveAttribute('href', '/ru/reserve');
  await expect(page.locator('.site-footer__legal a')).toHaveCount(4);
  await page.locator('.faq-stack details').nth(1).evaluate(el => (el as HTMLDetailsElement).open = true);
  await expect(page.locator('.faq-stack details').nth(1)).toContainText('одноразовых капсул');
});

test('country target, keyboard, enlarged text and preview screenshots', async ({ page }, testInfo) => {
  await page.goto('/en/reserve?model=gold'); await ready(page); await page.evaluate(() => document.fonts.ready);
  const country = page.locator('#country'); await country.scrollIntoViewIfNeeded();
  expect((await country.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.locator('#full-name').focus(); await page.keyboard.type('Keyboard Buyer');
  await page.keyboard.press('Tab'); await expect(page.locator('#email')).toBeFocused(); await page.keyboard.type('buyer@example.test');
  await page.keyboard.press('Tab'); await expect(country).toBeFocused(); await country.selectOption('AE');
  await page.keyboard.press('Tab'); await expect(page.locator('#phone')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.locator('#age')).toBeFocused(); await page.keyboard.press('Space');
  await page.keyboard.press('Tab'); await expect(page.locator('#terms')).toBeFocused(); await page.keyboard.press('Space');
  await page.locator('#reserve-button').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#confirmation-title')).toBeFocused();
  await page.screenshot({ path: `screenshots/preorder/preview-${testInfo.project.name}.png`, fullPage: true });
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll<HTMLElement>('.uno-package, .uno-package *')].map(element => [element, parseFloat(getComputedStyle(element).fontSize)] as const);
    for (const [element, size] of sizes) element.style.setProperty('font-size', `${size * 2}px`, 'important');
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('both policy originals and verified certificate resources remain reachable', async ({ page, request }) => {
  await page.goto('/ru/privacy-ru');
  await expect(page.locator('.up-legal-footer a[href="/ru/privacy"]')).toHaveText('Privacy (EN)');
  await expect(page.locator('.up-legal-footer a[href="/ru/privacy-ru"]')).toContainText('Конфиденциальность');
  await page.locator('.up-legal-footer a[href="/ru/privacy"]').click();
  await expect(page.locator('.uno-package')).toHaveAttribute('lang', 'en');
  await page.goto('/en/product-info');
  for (const href of ['/certificates/uae-conformity.pdf', '/certificates/rohs.pdf', '/certificates/uae-telecom.pdf']) {
    await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1);
    const response = await request.head(href); expect(response.status()).toBe(200); expect(response.headers()['content-type']).toContain('pdf');
  }
  await page.goto('/en/reserve?model=gold'); await ready(page);
  await page.locator('.up-beta a[lang="ru"]').click(); await ready(page);
  await expect(page.locator('#model-gold')).toBeChecked(); await expect(page).toHaveURL(/\/ru\/reserve\?model=gold$/);
});
