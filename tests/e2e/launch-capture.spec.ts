import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { waitForVisibleMedia } from './helpers/media';

const dir = 'screenshots/lead-capture';
test.skip(process.env.LEAD_CAPTURE_TESTS !== '1', 'Requires capture-enabled local build and LEAD_CAPTURE_TESTS=1; capture can be explicitly disabled with LEAD_CAPTURE_ENABLED=false.');
async function openFrom(page: Page, id = 'hero-reserve') {
  const original = page.locator(`#${id}`);
  await original.scrollIntoViewIfNeeded();
  await original.click();
  const notice = page.locator(id === 'set-explore' ? '#unavailable-set' : '#unavailable-commerce');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('November 20, 2026');
  await notice.locator('[data-launch-open]').click();
  const form = page.locator('#launch-capture');
  await expect(form).toBeVisible();
  await expect(notice).toBeHidden();
  return form;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/en');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await page.evaluate(() => document.fonts.ready);
  await waitForVisibleMedia(page);
  await mkdir(dir, { recursive: true });
});

test('original four notices, mobile form choices, launcher and own focus', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  expect(await page.evaluate(() => innerWidth)).toBe(page.viewportSize()!.width);
  if (info.project.name.includes('iphone')) expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
  await expect(page.locator('#launch-floating')).toBeHidden();
  await page.screenshot({ path: `${dir}/${info.project.name}-hero.png`, scale: 'css' });
  for (const id of ['hero-reserve', 'order-create', 'final-create', 'set-explore']) {
    const form = await openFrom(page, id);
    await expect(form.getByRole('heading', { name: 'Join the UNO Launch List' })).toBeVisible();
    await expect(form.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(form.locator('input[name=phone]')).toHaveCount(0);
    await page.screenshot({ path: `${dir}/${info.project.name}-${id}-updates.png`, scale: 'css' });
    await form.getByRole('button', { name: 'Request a Call', exact: true }).click();
    await expect(form.locator('input[name=phone]')).toBeVisible();
    await expect(form.locator('input[name=email]')).toHaveCount(0);
    await expect(form.getByRole('checkbox')).not.toBeChecked();
    await form.getByRole('checkbox').check();
    await expect(form.locator('input[name=email]')).toBeVisible();
    await page.screenshot({ path: `${dir}/${info.project.name}-${id}-callback.png`, scale: 'css' });
    await form.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator(`#${id}`)).toBeFocused();
    // Return to the initial update route before each next original entrypoint.
    await openFrom(page, id);
    await form.getByRole('button', { name: 'Launch Updates', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator(`#${id}`)).toBeFocused();
    await page.keyboard.press('Space');
    const notice = page.locator(id === 'set-explore' ? '#unavailable-set' : '#unavailable-commerce');
    await expect(notice).toBeVisible();
    await notice.locator('[data-launch-open]').focus();
    await page.keyboard.press('Enter');
    await expect(form).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(`#${id}`)).toBeFocused();
  }
  await page.evaluate(() => scrollTo(0, 1600));
  const launcher = page.locator('#launch-floating');
  await expect(launcher).toBeVisible();
  const up = await page.locator('#back-to-top').boundingBox();
  const launch = await launcher.boundingBox();
  expect(launch!.y + launch!.height).toBeLessThan(up!.y);
  await page.screenshot({ path: `${dir}/${info.project.name}-launcher.png`, scale: 'css' });
  await launcher.focus(); await page.keyboard.press('Enter');
  const form = page.locator('#launch-capture');
  await expect(form).toBeVisible();
  await page.locator('#home-link').evaluate(el => (el as HTMLElement).focus());
  await expect(page.locator('#home-link')).not.toBeFocused();
  await page.keyboard.press('Escape');
  await expect(launcher).toBeFocused();
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('#navigation-toggle').click();
  await expect(launcher).toBeHidden();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('real unconfigured SMTP route shows unavailable, preserves fields, and permits manual retry', async ({ page }, info) => {
  const form = await openFrom(page);
  await form.locator('input[name=email]').fill('no-send@example.test');
  for (let i = 0; i < 2; i++) {
    const response = page.waitForResponse(r => r.url().includes('/api/launch-list') && r.request().method() === 'POST');
    await form.locator('button[type=submit]').click();
    const actual = await response;
    expect(actual.status()).toBe(503);
    expect(await actual.json()).toEqual({ accepted: false, confirmationRequired: false });
    await expect(form.getByRole('alert')).toContainText('temporarily unavailable');
    await expect(form.getByRole('alert')).toContainText('support@ramsider.com');
    await expect(form.locator('input[name=email]')).toHaveValue('no-send@example.test');
    await expect(form.locator('button[type=submit]')).toBeEnabled();
    expect(await page.evaluate(() => localStorage.getItem('uno-launch-2026-receipt-v1'))).toBeNull();
    await expect(form.getByRole('heading', { name: 'You’re on the Launch List' })).toHaveCount(0);
  }
  await page.screenshot({ path: `${dir}/${info.project.name}-real-missing-smtp.png`, scale: 'css' });
});

test.describe('Browser states with intercepted API responses', () => {
test.use({ serviceWorkers: 'block' });

test('UI contract fixtures: retry, single in-flight request, explicit acknowledgement and PII-free receipt', async ({ page }, info) => {
  // Interception proves browser states only. This is NOT a storage/durability integration test.
  const requests: { body: Record<string, unknown>; key: string | undefined }[] = [];
  let fail = true;
  let release: (() => void) | undefined;
  await page.route('**/api/launch-list', async route => {
    requests.push({ body: route.request().postDataJSON(), key: route.request().headers()['idempotency-key'] });
    if (fail) await route.fulfill({ status: 503, json: { accepted: false } });
    else {
      await new Promise<void>(resolve => { release = resolve; });
      await route.fulfill({ json: { accepted: true, confirmationRequired: false } });
    }
  });
  const form = await openFrom(page);
  await form.getByLabel('Email', { exact: true }).fill('visitor@example.test');
  await form.getByLabel('Name (optional)', { exact: true }).fill('Test Visitor');
  await form.getByRole('button', { name: 'Join the Launch List', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('temporarily unavailable');
  await expect(form.getByLabel('Email', { exact: true })).toHaveValue('visitor@example.test');
  expect(await page.evaluate(() => localStorage.getItem('uno-launch-2026-receipt-v1'))).toBeNull();
  await page.screenshot({ path: `${dir}/${info.project.name}-error.png`, scale: 'css' });
  fail = false;
  await form.getByRole('button', { name: 'Join the Launch List', exact: true }).click();
  await expect(form.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  await expect(form.locator('input[name=email]')).toBeDisabled();
  await expect.poll(() => requests.length).toBe(2);
  await form.locator('form').evaluate(el => el.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(requests).toHaveLength(2);
  expect(requests[0].key).toBeTruthy(); expect(requests[1].key).toBe(requests[0].key);
  expect(requests[1].body).toMatchObject({ intent: 'updates', emailOptIn: true, source: 'hero-reserve' });
  release!();
  await expect(form.getByRole('heading', { name: 'You’re on the Launch List' })).toBeVisible();
  await page.screenshot({ path: `${dir}/${info.project.name}-success.png`, scale: 'css' });
  const stored = await page.evaluate(() => localStorage.getItem('uno-launch-2026-receipt-v1'));
  expect(JSON.parse(stored!)).toEqual({ updates: true, callback: false, confirmation: false });
  expect(stored).not.toMatch(/visitor|@|Test/);
  await form.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#hero-reserve')).toBeFocused();
  await page.reload(); await page.evaluate(() => document.fonts.ready);
  await openFrom(page);
  await expect(form.getByRole('heading', { name: 'You’re on the Launch List' })).toBeVisible();
  expect(requests).toHaveLength(2);
});

test('UI contract fixtures: callback purpose and narrow/short accessible layouts', async ({ page }, info) => {
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/launch-list', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { accepted: true, confirmationRequired: true } });
  });
  const form = await openFrom(page);
  await form.getByRole('button', { name: 'Request a Call', exact: true }).click();
  await form.locator('input[name=phone]').fill('+44 7700 900123');
  await form.getByRole('checkbox').check();
  await form.getByLabel('Email', { exact: true }).fill('callback@example.test');
  await form.locator('button[type=submit]').click();
  await expect(form.getByRole('heading', { name: 'Check Your Email' })).toBeVisible();
  await expect(form.getByRole('status')).toContainText('Your call request has been received');
  expect(payload).toMatchObject({ intent: 'callback', emailOptIn: true, phone: '+44 7700 900123' });
  await form.getByRole('button', { name: 'Use a Different Contact' }).click();
  for (const viewport of [{ width: 320, height: 568 }, { width: 402, height: 390 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(form).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await form.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await form.locator('button[type=submit]').scrollIntoViewIfNeeded();
    await expect(form.locator('button[type=submit]')).toBeInViewport();
    await form.getByRole('button', { name: 'Close', exact: true }).scrollIntoViewIfNeeded();
    await expect(form.getByRole('button', { name: 'Close', exact: true })).toBeInViewport();
    await page.screenshot({ path: `${dir}/${info.project.name}-callback-${viewport.width}x${viewport.height}.png`, scale: 'css' });
  }
});

test('UI contract fixtures: callback alone never silently subscribes to email marketing', async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/launch-list', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { accepted: true, confirmationRequired: false } });
  });
  const form = await openFrom(page, 'order-create');
  await form.getByRole('button', { name: 'Request a Call', exact: true }).click();
  await form.locator('input[name=phone]').fill('+44 7700 900123');
  await form.locator('button[type=submit]').click();
  await expect(form.getByRole('heading', { name: 'Your Request Has Been Received' })).toBeVisible();
  expect(payload).toMatchObject({ intent: 'callback', emailOptIn: false, email: '', source: 'order-create' });
  await form.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#order-create')).toBeFocused();
  await openFrom(page, 'order-create');
  await expect(form.getByRole('button', { name: 'Launch Updates', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(form.locator('input[name=email]')).toBeVisible();
  await form.getByRole('button', { name: 'Request a Call', exact: true }).click();
  await expect(form.getByRole('heading', { name: 'Your Request Has Been Received' })).toBeVisible();
});

for (const dismissal of ['Done', 'Close', 'Escape']) test(`UI contract fixtures: floating success ${dismissal} returns visible focus`, async ({ page }, info) => {
  await page.route('**/api/launch-list', route => route.fulfill({ json: { accepted: true, confirmationRequired: false } }));
  await page.evaluate(() => scrollTo(0, document.getElementById('hero-reserve')!.getBoundingClientRect().bottom + scrollY + 24));
  await page.locator('#launch-floating').click();
  const form = page.locator('#launch-capture');
  await form.locator('input[name=email]').fill('floating@example.test');
  await form.locator('button[type=submit]').click();
  await expect(form.getByRole('heading', { name: 'You’re on the Launch List' })).toBeVisible();
  if (dismissal === 'Escape') await page.keyboard.press('Escape');
  else await form.getByRole('button', { name: dismissal, exact: true }).click();
  await expect(page.locator('#launch-floating')).toBeVisible();
  await expect(page.locator('#launch-floating')).toHaveText('Request Received');
  await expect(page.locator('#launch-floating')).toBeFocused();
  await page.screenshot({ path: `${dir}/${info.project.name}-floating-success-${dismissal}.png`, scale: 'css' });
});

test('UI contract fixtures: ambiguous SMTP delivery never claims success or blindly resends', async ({ page }, info) => {
  let attempts = 0;
  await page.route('**/api/launch-list', route => { attempts++; return route.fulfill({ status: 409, json: { accepted: false, confirmationRequired: false } }); });
  const form = await openFrom(page);
  await form.locator('input[name=email]').fill('uncertain@example.test');
  await form.locator('button[type=submit]').click();
  await expect(form.getByRole('alert')).toContainText('couldn’t confirm delivery');
  await expect(form.locator('button[type=submit]')).toBeDisabled();
  await page.screenshot({ path: `${dir}/${info.project.name}-uncertain-delivery.png`, scale: 'css' });
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('uno-launch-2026-receipt-v1')))!)).toEqual({ updates: false, callback: false, confirmation: false, uncertain: true });
  await page.keyboard.press('Escape'); await openFrom(page);
  await expect(form.getByRole('alert')).toContainText('couldn’t confirm delivery');
  await expect(form.locator('button[type=submit]')).toBeDisabled();
  expect(attempts).toBe(1);
  await page.reload(); await openFrom(page);
  await expect(form.getByRole('alert')).toContainText('couldn’t confirm delivery');
  await expect(form.locator('button[type=submit]')).toBeDisabled();
});

test('UI contract fixtures: a lost HTTP response is uncertain, not a fresh resend invitation', async ({ page }) => {
  await page.route('**/api/launch-list', route => route.abort('failed'));
  const form = await openFrom(page);
  await form.locator('input[name=email]').fill('lost-response@example.test');
  await form.locator('button[type=submit]').click();
  await expect(form.getByRole('alert')).toContainText('couldn’t confirm delivery');
  await expect(form.locator('button[type=submit]')).toBeDisabled();
});

test('UI contract fixtures: reload during a pending POST retains an unresolved request marker', async ({ page }) => {
  let release: (() => void) | undefined;
  await page.route('**/api/launch-list', async route => {
    await new Promise<void>(resolve => { release = resolve; });
    try { await route.abort(); } catch { /* The old document was deliberately discarded. */ }
  });
  const form = await openFrom(page);
  await form.locator('input[name=email]').fill('pending@example.test');
  await form.locator('button[type=submit]').click();
  await expect(form.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('uno-launch-2026-receipt-v1')))!)).toEqual({ updates: false, callback: false, confirmation: false, uncertain: true });
  await page.reload(); release?.();
  await openFrom(page);
  await expect(form.getByRole('alert')).toContainText('couldn’t confirm delivery');
  await expect(form.locator('button[type=submit]')).toBeDisabled();
});

test('UI contract fixtures: an earlier receipt cannot reset a later uncertain delivery', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/launch-list', route => {
    attempts++;
    return route.fulfill({ status: attempts === 1 ? 200 : 409, json: { accepted: attempts === 1, confirmationRequired: false } });
  });
  const form = await openFrom(page);
  await form.getByRole('button', { name: 'Request a Call', exact: true }).click();
  await form.locator('input[name=phone]').fill('+44 7700 900123');
  await form.locator('button[type=submit]').click();
  await expect(form.getByRole('heading', { name: 'Your Request Has Been Received' })).toBeVisible();
  await form.getByRole('button', { name: 'Launch Updates', exact: true }).click();
  await form.locator('input[name=email]').fill('later@example.test');
  await form.locator('button[type=submit]').click();
  await expect(form.getByRole('alert')).toContainText('couldn’t confirm delivery');
  await form.getByRole('button', { name: 'Request a Call', exact: true }).click();
  await expect(form.getByRole('button', { name: 'Use a Different Contact' })).toHaveCount(0);
  await form.getByRole('button', { name: 'Launch Updates', exact: true }).click();
  await expect(form.locator('button[type=submit]')).toBeDisabled();
  expect(attempts).toBe(2);
});

for (const state of ['uncertain', 'accepted']) test(`UI contract fixtures: another tab's ${state} receipt blocks a stale open form`, async ({ page, context }) => {
  let attempts = 0;
  await page.route('**/api/launch-list', route => { attempts++; return route.abort(); });
  const form = await openFrom(page);
  await form.locator('input[name=email]').fill('same-browser@example.test');
  const otherTab = await context.newPage();
  await otherTab.goto('/en');
  await otherTab.evaluate(uncertain => localStorage.setItem('uno-launch-2026-receipt-v1', JSON.stringify({ updates: !uncertain, callback: false, confirmation: false, ...(uncertain ? { uncertain: true } : {}) })), state === 'uncertain');
  await otherTab.close();
  await form.locator('button[type=submit]').click();
  if (state === 'uncertain') {
    await expect(form.getByRole('alert')).toContainText('couldn’t confirm delivery');
    await expect(form.locator('button[type=submit]')).toBeDisabled();
  } else await expect(form.getByRole('heading', { name: 'You’re on the Launch List' })).toBeVisible();
  expect(attempts).toBe(0);
});

});
