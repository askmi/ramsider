import { webkit } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'deliverables');
const baseURL = process.env.DEMO_URL ?? 'http://127.0.0.1:3011';
await mkdir(out, { recursive: true });

const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 402, height: 874 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  recordVideo: { dir: out, size: { width: 804, height: 1748 } },
});
const page = await context.newPage();
page.setDefaultTimeout(5000);
const ledger = [];
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto(`${baseURL}/en`, { waitUntil: 'domcontentloaded' });
// The local Next.js development badge is tooling chrome, not part of the site.
await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
await page.locator('#hero-title').waitFor();
await page.locator('.art img').first().evaluate(image => image.decode());
await page.evaluate(() => document.fonts.ready);
const started = Date.now();
const t = () => Number(((Date.now() - started) / 1000).toFixed(2));
const delay = ms => page.waitForTimeout(ms);
const mark = async (action, extra = {}) => ledger.push({
  time: t(), action, url: page.url(), scrollY: await page.evaluate(() => Math.round(scrollY)), ...extra,
});
const waitUntil = async seconds => { const ms = seconds * 1000 - (Date.now() - started); if (ms > 0) await delay(ms); };

async function reveal(id, ms = 460) {
  const locator = page.locator(`#${id}`);
  await locator.waitFor({ state: 'attached', timeout: 6000 });
  await page.evaluate(async ({ id, ms }) => {
    const element = document.getElementById(id);
    const target = Math.max(0, element.getBoundingClientRect().top + scrollY - innerHeight * 0.32);
    const from = scrollY;
    const start = performance.now();
    await new Promise(resolve => {
      function step(now) {
        const p = Math.min(1, (now - start) / ms);
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        scrollTo(0, from + (target - from) * eased);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }, { id, ms });
  await page.waitForFunction(() => [...document.images].filter(image => {
    const box = image.getBoundingClientRect();
    return box.bottom > 0 && box.top < innerHeight;
  }).every(image => image.complete && image.naturalWidth > 0), null, { timeout: 2500 }).catch(() => {});
  await mark(`show:${id}`);
}

async function tap(id, options = {}) {
  if (options.reveal !== false) await reveal(id, options.scrollMs ?? 330);
  await page.locator(`#${id}`).click({ timeout: 5000 });
  await delay(options.hold ?? 230);
  const openDialog = page.locator('dialog[open]');
  const dialogCount = await openDialog.count();
  let detail = {};
  if (dialogCount) {
    detail = { dialog: (await openDialog.first().locator('h2').first().innerText()).slice(0, 80) };
    await page.keyboard.press('Escape');
    await delay(100);
  }
  await mark(`click:${id}`, detail);
}

try {
  const css = await page.locator('#locale-toggle').evaluate(element => {
    const face = element.querySelector('.locale-toggle-face');
    const panel = document.querySelector('.locale-options');
    return {
      faceBackground: getComputedStyle(face).backgroundColor,
      panelBackground: panel ? getComputedStyle(panel).backgroundColor : null,
      title: document.title,
    };
  });
  await mark('capture-start', { css, viewport: { width: 402, height: 874, dpr: 3 } });

  // Hero and primary menu.
  await delay(900);
  await tap('hero-reserve', { reveal: false, hold: 380 });
  await page.locator('#navigation-toggle').click();
  await delay(430);
  await mark('menu-open', { open: await page.locator('.menu').evaluate(node => node.open) });
  await page.locator('#navigation-moment').click();
  await delay(300);
  await mark('menu-navigation-moment');
  await reveal('hero-title', 340);
  await waitUntil(5.0);

  // Actual route changes and visible copy.
  await tap('locale-toggle', { reveal: false, hold: 350 });
  await page.locator('#locale-option-ru').click();
  await page.waitForURL('**/ru');
  await page.locator('#hero-title').waitFor();
  await delay(420);
  await mark('locale-ru', { hero: (await page.locator('#hero-title').innerText()).slice(0, 95) });
  await delay(1750);
  await tap('locale-toggle', { reveal: false, hold: 280 });
  await page.locator('#locale-option-en').click();
  await page.waitForURL('**/en');
  await delay(350);
  await mark('locale-en', { hero: (await page.locator('#hero-title').innerText()).slice(0, 95) });
  await waitUntil(10.0);

  await reveal('fire', 700);
  await tap('fire-learn', { reveal: false, hold: 320 });
  await reveal('moment', 520);
  await waitUntil(15.0);
  await reveal('feeling', 650);
  await delay(360);
  await waitUntil(18.0);

  await tap('technology-experience', { hold: 430 });
  // One internal technology link represents the seven equivalent anchor links.
  await reveal('technology-experience', 250);
  await page.locator('#technology-experience').click();
  await page.locator('#unavailable-technology[open]').waitFor();
  await page.locator('#unavailable-technology a[href="#tech-features"]').click();
  await delay(220);
  await mark('technology-anchor');
  await reveal('tech-flow', 520);
  await waitUntil(23.0);

  await reveal('choice', 480);
  await tap('choice-learn', { hold: 290 });
  await reveal('anew', 500);
  await waitUntil(27.0);

  await tap('film-play', { hold: 300 });
  await tap('film-label', { hold: 220 });
  await reveal('beyond', 380);
  await tap('beyond-learn', { hold: 240 });
  await tap('technology-repeat', { hold: 230 });
  await waitUntil(32.0);

  await reveal('expressions', 460);
  await tap('expressions-compare', { hold: 500 });
  await tap('pro-explore', { hold: 300 });
  await tap('gold-explore', { hold: 300 });
  await waitUntil(40.0);

  await reveal('set', 470);
  await tap('set-explore', { hold: 350 });
  await waitUntil(45.0);

  await reveal('order', 480);
  await tap('order-create', { hold: 350 });
  await reveal('tested', 430);
  await waitUntil(50.0);

  await reveal('documents', 480);
  for (const id of ['document-electrical', 'document-emc', 'document-uae', 'document-rohs', 'document-telecom', 'documents-all']) {
    await tap(id, { hold: 500, scrollMs: 230 });
  }
  await waitUntil(59.0);

  await reveal('venues', 520);
  await reveal('hospitality', 380);
  await tap('hospitality-explore', { hold: 390 });
  await waitUntil(65.0);

  await reveal('faq', 440);
  for (const id of ['faq-preorder', 'faq-set', 'faq-shipping', 'faq-tracking', 'faq-support', 'faq-venue']) {
    await tap(id, { hold: 410, scrollMs: 200 });
  }
  await waitUntil(73.0);

  for (const id of ['account-personal', 'account-venue', 'project-ramsider', 'project-ramsmobile', 'project-ramswear', 'project-ramsfood']) {
    await tap(id, { hold: 550, scrollMs: 320 });
  }
  await waitUntil(84.0);

  await reveal('final', 500);
  await tap('final-create', { hold: 520 });
  await mark('page-bottom', { maxScroll: await page.evaluate(() => document.documentElement.scrollHeight - innerHeight) });
  await waitUntil(87.0);
  await tap('back-to-top', { reveal: false, hold: 240 });
  await delay(800);
  await mark('returned-to-top');
  await waitUntil(88.3);
} catch (error) {
  errors.push(String(error.stack ?? error));
  await mark('capture-error', { error: String(error) });
} finally {
  const duration = t();
  const sourceVideo = await page.video().path();
  await context.close();
  await browser.close();
  const report = { baseURL, duration, sourceVideo, ledger, errors };
  await writeFile(path.join(out, 'ramsider-demo-capture.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ duration, sourceVideo, actions: ledger.length, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}
