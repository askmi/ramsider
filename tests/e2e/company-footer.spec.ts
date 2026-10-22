import { expect, test, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'screenshots/company-footer';
const legalName = 'RAMSIDER SMOKING & TOBACCO HEATING DEVICES TRADING CO. L.L.C';
const address = 'Office No. D-28, Mohamed Hashem Alawi Al Saf Building, Al Murar, Dubai, UAE.';
const email = 'support@ramsider.com';
const partnersEmail = 'partners@ramsider.com';
const languages = ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko'];

async function ready(page: Page, locale = 'en') {
  await page.goto(`/${locale}`);
  await expect(page.locator('html')).toHaveAttribute('data-story-media-ready', '', { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
}

test('official company facts and localized footer fit the real browser', async ({ page }, info) => {
  test.setTimeout(180000);
  await mkdir(output, { recursive: true });
  const errors: string[] = [], pdfRequests: string[] = [], rows = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.url().includes('/company/') && r.url().endsWith('.pdf')) pdfRequests.push(r.url()); });
  const locales = info.project.name === 'iphone-17-pro-webkit' ? languages
    : info.project.name.includes('iphone') ? ['en', 'ru', 'de', 'ar'] : ['en', 'ar'];
  for (const locale of locales) {
    await ready(page, locale);
    const footer = page.getByRole('contentinfo');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.locator('.site-footer__name')).toHaveText(legalName);
    await expect(footer.locator('address p')).toHaveText(address);
    await expect(footer.locator('.site-footer__licence')).toHaveText('License No. 1050925');
    await expect(footer.locator('.site-footer__licence a')).toHaveCount(0);
    const paper = footer.locator('.site-footer__art');
    await expect(paper).toHaveAttribute('data-media-ready', '');
    const paperBox = (await paper.boundingBox())!, footerBox = (await footer.boundingBox())!;
    expect(paperBox.width).toBeCloseTo(footerBox.width, 1);
    expect(paperBox.height).toBeGreaterThanOrEqual(footerBox.height);
    expect(paperBox.height / paperBox.width).toBeCloseTo(2588 / 941, 2);
    await expect(page.locator('a[href*="/company/"], a[href*="LICENSE_2026_2027"]')).toHaveCount(0);
    await expect(footer.getByRole('link', { name: email, exact: true })).toHaveAttribute('href', `mailto:${email}`);
    await expect(footer.getByRole('link', { name: partnersEmail, exact: true })).toHaveAttribute('href', `mailto:${partnersEmail}`);
    await expect(footer.getByRole('link', { name: /Instagram/ })).toHaveAttribute('href', 'https://instagram.com/ramsider_official');
    await expect(footer.getByRole('link', { name: /YouTube/ })).toHaveAttribute('href', 'https://youtube.com/@ramsider_official');
    await expect(footer.locator('nav h3')).toHaveCount(0);
    const social = footer.locator('.site-footer__social');
    await expect(social).toHaveCount(2);
    const socialBoxes = await social.evaluateAll(nodes => nodes.map(el => {
      const box = el.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, text: el.textContent?.trim(), svg: el.querySelector('svg')?.getAttribute('aria-hidden') };
    }));
    expect(Math.abs(socialBoxes[0].y - socialBoxes[1].y)).toBeLessThan(1);
    for (const box of socialBoxes) { expect(box.width).toBe(44); expect(box.height).toBe(44); expect(box.text).toBe(''); expect(box.svg).toBe('true'); }
    await expect(page.locator('a[href^="tel:"], a[href^="sms:"]')).toHaveCount(0);
    await expect(page.locator('#unavailable-business')).toHaveCount(0);
    const result = await footer.evaluate(root => {
      const box = root.getBoundingClientRect(), css = getComputedStyle(root);
      const links = [...root.querySelectorAll('a')].map(a => {
        const b = a.getBoundingClientRect();
        return { href: a.href, width: b.width, height: b.height, clipped: b.left < box.left || b.right > box.right + 1 };
      });
      return { width: innerWidth, dpr: devicePixelRatio, footerHeight: box.height, viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'), overflow: document.documentElement.scrollWidth > innerWidth, font: css.fontFamily, direction: css.direction, bottomPadding: css.paddingBottom, background: css.backgroundColor, backgroundImage: css.backgroundImage, color: css.color, links, legalDirection: getComputedStyle(root.querySelector('bdi')!).direction };
    });
    expect(result.width).toBe(page.viewportSize()!.width);
    expect(result.viewport).toContain('width=device-width');
    expect(result.font).toMatch(/^OpenSans/);
    expect(result.direction).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    expect(result.legalDirection).toBe('ltr');
    expect(result.overflow).toBe(false);
    for (const link of result.links) { expect(link.height).toBeGreaterThanOrEqual(44); expect(link.clipped).toBe(false); }
    if (info.project.name.includes('iphone')) expect(result.dpr).toBe(3);
    if (locale === 'en' && info.project.name.includes('iphone')) expect(result.footerHeight).toBeLessThanOrEqual(info.project.name.includes('max') ? 434 : 444);
    await footer.screenshot({ path: `${output}/${info.project.name}-${locale}.png` });
    rows.push({ locale, ...result });
  }
  expect(pdfRequests).toEqual([]);
  expect(errors).toEqual([]);
  await writeFile(`${output}/${info.project.name}.json`, JSON.stringify({ rows, errors, pdfBeforeClick: pdfRequests.length }, null, 2));
});

test('support, business, keyboard and official social links use confirmed destinations', async ({ page, context, browserName }) => {
  await ready(page);
  await expect(page.locator('#hospitality-explore')).toHaveAttribute('href', `mailto:${email}`);
  await page.locator('.menu summary').click();
  await expect(page.locator('#navigation-contact')).toHaveAttribute('href', '#company-contact');
  await page.keyboard.press('Escape');
  for (const id of ['support', 'venue']) {
    await page.locator(`#faq-${id}`).click();
    const answer = page.locator(`#faq-${id}`).locator('..');
    await expect(answer.locator('a')).toHaveAttribute('href', `mailto:${email}`);
    expect((await answer.locator('a').boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(answer).not.toContainText('not available');
    await page.locator(`#faq-${id}`).click();
  }
  const footer = page.getByRole('contentinfo');
  await footer.scrollIntoViewIfNeeded();
  const mail = footer.getByRole('link', { name: email, exact: true });
  await mail.focus();
  // Safari's default keyboard mode uses Option-Tab to visit native links.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(footer.getByRole('link', { name: partnersEmail, exact: true })).toBeFocused();
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  const instagram = footer.getByRole('link', { name: /Instagram/ });
  await expect(instagram).toBeFocused();
  expect(await instagram.evaluate(e => e.matches(':focus-visible'))).toBe(true);
  for (const channel of ['instagram', 'youtube']) {
    await context.route(`https://${channel}.com/**`, r => r.abort());
    const link = footer.locator(`a[href^="https://${channel}.com/"]`);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const navigation = context.waitForEvent('request', r => r.url().startsWith(`https://${channel}.com/`));
    await link.focus();
    await page.keyboard.press('Enter');
    expect((await navigation).isNavigationRequest()).toBe(true);
    for (const popup of context.pages()) if (popup !== page) await popup.close();
  }
});

test('quick-navigation Contact scrolls to site contacts without opening email', async ({ page, context }, info) => {
  const externalNavigations: string[] = [];
  page.on('request', request => {
    if (request.isNavigationRequest() && /^https?:/.test(page.url()) && new URL(request.url()).origin !== new URL(page.url()).origin) externalNavigations.push(request.url());
  });
  const rows = [];
  await mkdir(output, { recursive: true });
  for (const locale of ['en', 'ru', 'ar']) {
    await ready(page, locale);
    const pages = context.pages().length;
    for (const keyboard of [false, true]) {
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      await page.locator('#navigation-toggle').click();
      const contact = page.locator('#navigation-contact');
      await expect(contact).toHaveAttribute('href', '#company-contact');
      if (keyboard) await contact.press('Enter');
      else await contact.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}#company-contact$`));
      await expect(page.locator('.menu')).not.toHaveAttribute('open');
      await expect(page.locator('#company-contact')).toBeInViewport();
      await expect.poll(() => page.locator('#contact-heading').evaluate(e => {
        const b = e.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight;
      })).toBe(true);
      expect(context.pages().length).toBe(pages);
      rows.push({ locale, keyboard, url: page.url(), menuClosed: true, contactHeadingVisible: true });
    }
    await page.screenshot({ path: `${output}/contact-navigation-${info.project.name}-${locale}.png` });
  }
  expect(externalNavigations).toEqual([]);
  await writeFile(`${output}/contact-navigation-${info.project.name}.json`, JSON.stringify({ rows, externalNavigations }, null, 2));
});

test('all localized server HTML keeps Contact navigation internal', async ({ request }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One server-HTML locale matrix.');
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    const response = await request.get(`/${locale}`);
    expect(response.status()).toBe(200);
    expect(await response.text()).toMatch(/id="navigation-contact" href="#company-contact"/);
  }
});

test('footer adapts at narrow and wide widths without covering final links', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'one responsive WebKit matrix');
  for (const width of [280, 320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 874 });
    await ready(page, width === 320 ? 'ar' : 'en');
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(page.getByRole('contentinfo')).toBeVisible();
    const footer = page.getByRole('contentinfo');
    await page.evaluate(() => document.documentElement.style.setProperty('--page-safe-bottom', '70px'));
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    expect((await footer.locator('.site-footer__art').boundingBox())!.height).toBeGreaterThanOrEqual((await footer.boundingBox())!.height);
    const last = page.getByRole('contentinfo').getByRole('link', { name: /YouTube/ });
    const a = (await last.boundingBox())!, b = (await page.locator('.back-to-top').boundingBox())!;
    expect(a.y + a.height).toBeLessThan(b.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${output}/adapt-${width}.png` });
  }
});

for (const failedAsset of ['11.webp', 'footer-paper.webp']) test(`contact mail links stay reachable while ${failedAsset} fails and Retry restores footer`, async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'mobile loading gate');
  let fail = true;
  await page.route(`**/art/${failedAsset}*`, route => fail ? route.abort() : route.continue());
  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('data-media-hydrated', '');
  await page.locator('.menu summary').click();
  await expect(page.locator('#navigation-contact')).toHaveAttribute('href', '#company-contact');
  await page.keyboard.press('Escape');
  await expect(page.locator('#hospitality-explore')).toHaveAttribute('href', `mailto:${email}`);
  const retry = page.locator('.page-media-overlay').getByRole('button', { name: 'Retry', exact: true });
  await expect.poll(async () => { await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); return retry.isVisible(); }).toBe(true);
  fail = false;
  await retry.click();
  await expect(page.locator('html')).toHaveAttribute('data-story-media-ready', '');
  await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: email, exact: true })).toBeVisible();
  await expect(page.getByRole('contentinfo').getByRole('link', { name: partnersEmail, exact: true })).toBeVisible();
  await expect(page.locator('.site-footer__art')).toHaveAttribute('data-media-ready', '');
});

test('company details and native contacts are available without JavaScript', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: info.project.use.viewport });
  try {
    const page = await context.newPage();
    await page.goto('/ar');
    const footer = page.getByRole('contentinfo');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.locator('.site-footer__name')).toHaveText(legalName);
    await expect(footer.getByRole('link', { name: email, exact: true })).toHaveAttribute('href', `mailto:${email}`);
    await expect(footer.getByRole('link', { name: partnersEmail, exact: true })).toHaveAttribute('href', `mailto:${partnersEmail}`);
    await expect(footer.getByRole('link', { name: /Instagram/ })).toHaveAttribute('href', 'https://instagram.com/ramsider_official');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});

test('expanded support and business answers stay readable and footer respects safe areas', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'required mobile answer screenshots');
  const answerLocales = info.project.name === 'iphone-17-pro-webkit' ? languages : ['en', 'ar', 'de'];
  for (const locale of answerLocales) {
    await ready(page, locale);
    for (const id of ['support', 'venue']) {
      await page.locator(`#faq-${id}`).click();
      const answer = page.locator(`#faq-${id}`).locator('..');
      const mail = answer.getByRole('link', { name: email, exact: true });
      const box = (await mail.boundingBox())!, container = (await answer.boundingBox())!;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(container.x);
      expect(box.x + box.width).toBeLessThanOrEqual(container.x + container.width);
      expect(await mail.evaluate(el => getComputedStyle(el).textDecorationLine)).toBe('underline');
    }
    if (['en', 'ar', 'de'].includes(locale)) await page.locator('.faq-stack').screenshot({ path: `${output}/faq-${info.project.name}-${locale}.png` });
    const footer = page.getByRole('contentinfo');
    await footer.evaluate(el => {
      el.style.setProperty('--footer-safe-left', '44px');
      el.style.setProperty('--footer-safe-right', '44px');
    });
    for (const inset of [0, 34, 70]) {
      await page.evaluate(value => document.documentElement.style.setProperty('--page-safe-bottom', `${value}px`), inset);
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      expect(await footer.evaluate(el => getComputedStyle(el).paddingBottom)).toBe(`${88 + inset}px`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const youtube = footer.getByRole('link', { name: /YouTube/ });
      const link = (await youtube.boundingBox())!, top = (await page.locator('.back-to-top').boundingBox())!;
      expect(top.y - link.y - link.height).toBeGreaterThanOrEqual(16);
      expect(await youtube.evaluate(el => {
        const b = el.getBoundingClientRect();
        return document.elementFromPoint(b.right - 8, b.top + b.height / 2)?.closest('a') === el;
      })).toBe(true);
    }
    if (locale === 'ar') await page.screenshot({ path: `${output}/safe-${info.project.name}-ar.png` });
  }
});

test('licence remains text and the private source PDF is not served', async ({ request, page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'one exact nonpublication check');
  await ready(page);
  await expect(page.locator('.site-footer__licence')).toHaveText('License No. 1050925');
  await expect(page.locator('.site-footer__licence a, a[href*=LICENSE_2026_2027]')).toHaveCount(0);
  const response = await request.get('/company/ramsider-commercial-licence-1050925.pdf');
  expect(response.status()).toBe(404);
});
