import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

test('responsive viewport, artwork, and primary actions', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/en');
  await page.locator('.art img').first().waitFor({ state: 'visible' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
      scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    scrollTo(0, document.body.scrollHeight);
    await Promise.all([...document.querySelectorAll<HTMLImageElement>('.art img, .tail-art img, .faq-row-art img')].map(async image => {
      // Hidden disclosure slices load only when expanded; do not await their closed-state load.
      if (!image.getClientRects().length) return;
      if (!image.currentSrc || !image.complete) await new Promise<void>((resolve, reject) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => reject(new Error(`Image failed: ${image.src}`)), { once: true });
      });
      await image.decode();
    }));
    scrollTo({ top: 0, behavior: 'instant' });
  });
  const profile = testInfo.project.name;
  const expectedWidth = profile.includes('pro-max') ? 440 : profile.includes('iphone') ? 402 : 1440;
  expect(await page.evaluate(() => innerWidth)).toBe(expectedWidth);
  expect(await page.evaluate(() => document.querySelector('meta[name="viewport"]')?.getAttribute('content'))).toContain('width=device-width');
  if (profile.includes('iphone')) expect(await page.evaluate(() => devicePixelRatio)).toBe(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(expectedWidth);
  const canvas = (await page.locator('.canvas').boundingBox())!;
  expect(canvas.height).toBeCloseTo(canvas.width * 32127 / 941, 0);

  await mkdir('screenshots/actual', { recursive: true });
  await page.screenshot({ path: `screenshots/actual/full-${profile}.png`, fullPage: true, scale: 'css' });

  await page.getByRole('button', { name: /reserve now/i }).click();
  await expect(page.getByText('The configurator, current prices')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('.menu summary').click();
  await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.menu')).not.toHaveAttribute('open');
  await page.locator('.menu summary').click();
  await page.getByRole('navigation', { name: 'Menu' }).locator('a[href="#moment"]').click();
  await expect(page.locator('.menu')).not.toHaveAttribute('open');
  const firstDocument = page.locator('.doc-card').first();
  await firstDocument.scrollIntoViewIfNeeded();
  const cardBox = await firstDocument.boundingBox();
  const buttonBox = await firstDocument.getByRole('button').boundingBox();
  expect(buttonBox!.height).toBeGreaterThan(cardBox!.height - 4);
  await firstDocument.getByRole('button').click({ position: { x: cardBox!.width / 2, y: 8 } });
  await expect(page.locator('#doc-detail-electrical')).toBeVisible();
  await expect(page.locator('#doc-detail-electrical')).toContainText('IEC 60335-1');
  await page.keyboard.press('Escape');
  await page.locator('.project-hit').first().click();
  await expect(page.locator('#project-detail-1')).toBeVisible();
  await expect(page.locator('#project-detail-1')).toContainText('Premium Intelligent');
  await page.keyboard.press('Escape');
  await page.locator('.key-explorePro').click();
  await expect(page.locator('#unavailable-pro')).toContainText('TiN-Coated Heater');
  await page.keyboard.press('Escape');
  await page.locator('.key-exploreGold').click();
  await expect(page.locator('#unavailable-gold')).toContainText('Platinum Sensors');
  await page.keyboard.press('Escape');
  await page.locator('.key-exploreSet').click();
  await expect(page.locator('#unavailable-set')).toContainText('accessory list');
  await page.keyboard.press('Escape');
  await page.locator('.account-hit').nth(1).click();
  await expect(page.locator('#unavailable-account')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('.faq-stack details').first().locator('summary').click();
  await expect(page.locator('.faq-stack details').first().getByText('Confirmed details are not available')).toBeVisible();
  expect(errors).toEqual([]);
});


test('back-to-top appears on scroll, stays in the viewport, and restores top and focus', async ({ page }) => {
  await page.goto('/en');
  const control = page.getByRole('button', { name: 'Back to top' });
  await expect(control).toHaveCount(0);
  await page.evaluate(() => scrollTo({ top: Math.max(1000, innerHeight), behavior: 'instant' }));
  await expect(control).toBeVisible();
  const box = (await control.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  if (test.info().project.name.includes('iphone')) {
    expect(page.viewportSize()!.height - box.y - box.height).toBeLessThanOrEqual(32);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await control.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
  await expect(control).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('home-link');
  await page.evaluate(() => scrollTo({ top: 1100, behavior: 'instant' }));
  await expect(control).toBeVisible();
  await control.focus();
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
  await expect(control).toHaveCount(0);
});

test('localized story buttons keep one-line labels inside proportionate surfaces', async ({ page }) => {
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const failures = await page.evaluate(() => {
      const canvas = document.querySelector('.canvas')!.getBoundingClientRect();
      const fallback = ({ ar: 'NotoButtonArabic', zh: 'NotoButtonSC', ja: 'NotoButtonJP', ko: 'NotoButtonKR' } as Record<string, string>)[document.documentElement.lang];
      return [...document.querySelectorAll<HTMLElement>('.story-button')].flatMap(button => {
        const label = button.querySelector<HTMLElement>('.button-label')!;
        const range = document.createRange();
        range.selectNodeContents(label);
        const fragments = [...range.getClientRects()].sort((a, b) => a.top - b.top);
        const lines: { bottom: number }[] = [];
        for (const fragment of fragments) {
          const last = lines.at(-1);
          if (last && fragment.top < last.bottom - .5) last.bottom = Math.max(last.bottom, fragment.bottom);
          else lines.push({ bottom: fragment.bottom });
        }
        const text = range.getBoundingClientRect();
        const box = button.getBoundingClientRect();
        const rtl = document.documentElement.dir === 'rtl';
        const startGap = rtl ? box.right - text.right : text.left - box.left;
        const endGap = rtl ? text.left - box.left : box.right - text.right;
        const surface = button.querySelector<HTMLElement>('.button-surface');
        const expectedAsset = `/${document.documentElement.lang === 'en' ? '' : `${document.documentElement.lang}/`}${button.id}.svg`;
        const invalid = lines.length !== 1 || getComputedStyle(label).whiteSpace !== 'nowrap'
          || box.left < canvas.left - 1 || box.right > canvas.right + 1
          || startGap < 2 || endGap < (button.classList.contains('has-arrow') ? 12 : 2)
          || (surface && !getComputedStyle(surface).backgroundImage.includes(expectedAsset))
          || (fallback && !getComputedStyle(label).fontFamily.includes(fallback));
        return invalid ? [`${document.documentElement.lang}/${button.id}: ${lines.length} lines, gaps ${startGap.toFixed(1)}/${endGap.toFixed(1)}`] : [];
      });
    });
    expect(failures).toEqual([]);
  }
});

for (const locale of ['ru', 'en']) test(`${locale} technology text groups are centered inside both fixed oval surfaces`, async ({ page }, testInfo) => {
  await page.goto(`/${locale}`);
  await page.evaluate(() => document.fonts.ready);
  const canvasWidth = await page.locator('.canvas').evaluate(element => element.getBoundingClientRect().width);
  for (const id of ['technology-experience', 'technology-repeat']) {
    const button = page.locator(`#${id}`);
    const box = (await button.boundingBox())!;
    const label = (await button.locator('.button-label').boundingBox())!;
    const caption = await button.evaluate(element => element.nextElementSibling?.getBoundingClientRect().toJSON());
    expect(caption, `${id} caption`).toBeTruthy();
    const groupCenter = (label.y + caption!.bottom) / 2;
    const ringCenter = box.y + box.height / 2 + (id === 'technology-experience' ? 7 * canvasWidth / 941 : 0);
    expect(Math.abs(groupCenter - ringCenter) * 941 / canvasWidth, `${id} group-to-ring offset in source pixels`).toBeLessThanOrEqual(4);
    expect(label.y + label.height).toBeLessThan(caption!.top);
    expect(box.height).toBeGreaterThanOrEqual(44);
    if (testInfo.project.name.includes('iphone')) {
      await button.scrollIntoViewIfNeeded();
      await page.evaluate(async () => {
        const visibleImages = [...document.querySelectorAll<HTMLImageElement>('.art img, .tail-art img')]
          .filter(image => image.getBoundingClientRect().top < innerHeight && image.getBoundingClientRect().bottom > 0);
        await Promise.all(visibleImages.map(async image => {
          if (!image.complete || !image.currentSrc) await new Promise<void>((resolve, reject) => {
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => reject(new Error(`Image failed: ${image.src}`)), { once: true });
          });
          await image.decode();
        }));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const visibleBox = (await button.boundingBox())!;
      const visibleRingCenter = visibleBox.y + visibleBox.height / 2 + (id === 'technology-experience' ? 7 * canvasWidth / 941 : 0);
      const visibleLabel = (await button.locator('.button-label').boundingBox())!;
      const visibleCaption = await button.evaluate(element => element.nextElementSibling!.getBoundingClientRect().toJSON());
      const painted = await page.screenshot();
      await button.evaluate(element => {
        (element.querySelector('.button-label') as HTMLElement).style.visibility = 'hidden';
        (element.nextElementSibling as HTMLElement).style.visibility = 'hidden';
      });
      const bare = await page.screenshot();
      await button.evaluate(element => {
        (element.querySelector('.button-label') as HTMLElement).style.visibility = '';
        (element.nextElementSibling as HTMLElement).style.visibility = '';
      });
      const paintedRaw = await sharp(painted).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const bareRaw = await sharp(bare).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const scale = paintedRaw.info.width / page.viewportSize()!.width;
      const left = Math.floor(Math.min(visibleLabel.x, visibleCaption.left) * scale);
      const right = Math.ceil(Math.max(visibleLabel.x + visibleLabel.width, visibleCaption.right) * scale);
      const top = Math.floor(Math.min(visibleLabel.y, visibleCaption.top) * scale);
      const bottom = Math.ceil(Math.max(visibleLabel.y + visibleLabel.height, visibleCaption.bottom) * scale);
      let inkTop = Infinity;
      let inkBottom = -Infinity;
      for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
        const index = (y * paintedRaw.info.width + x) * 3;
        const difference = Math.abs(paintedRaw.data[index] - bareRaw.data[index])
          + Math.abs(paintedRaw.data[index + 1] - bareRaw.data[index + 1])
          + Math.abs(paintedRaw.data[index + 2] - bareRaw.data[index + 2]);
        if (difference > 36) { inkTop = Math.min(inkTop, y); inkBottom = Math.max(inkBottom, y); }
      }
      expect(inkTop, `${id} visible glyphs found`).toBeLessThan(Infinity);
      const inkCenter = (inkTop + inkBottom) / (2 * scale);
      expect(Math.abs(inkCenter - visibleRingCenter) * 941 / canvasWidth, `${id} visible ink center in source pixels`).toBeLessThanOrEqual(6);
    }
    await button.click();
    await expect(page.locator('#technology-viewer:modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#technology-viewer:modal')).toHaveCount(0);
    await button.focus();
    await button.press('Enter');
    await expect(page.locator('#technology-viewer:modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  }
});

test('mapped exploration dialogs contain focus and restore their triggers', async ({ page }, testInfo) => {
  await page.goto('/en');
  await page.locator('#navigation-toggle').click();
  for (const link of await page.locator('.menu nav > a').all()) {
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press('Escape');
  for (const id of ['technology-experience', 'technology-repeat', 'expressions-compare', 'hero-reserve']) {
    const trigger = page.locator(`#${id}`);
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.locator('dialog:modal');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(/.+/);
    if (id.startsWith('technology')) await expect(dialog.locator('.technology-viewer__frame')).toHaveAttribute('src', /frame-template\.png/);
    if (id === 'expressions-compare') {
      await expect(dialog.getByRole('columnheader')).toHaveCount(2);
      await expect(dialog).toContainText('TiN-Coated Heater');
      await expect(dialog).toContainText('Platinum Sensors');
    }
    // Wrap both directions: native dialogs make the underlying page inert.
    const close = dialog.getByRole('button', { name: id.startsWith('technology') ? 'Close technology viewer' : 'Close' });
    await close.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog[open]'))).toBe(true);
    if (id === 'expressions-compare') await page.screenshot({ path: `screenshots/actual/comparison-${testInfo.project.name}.png`, scale: 'css' });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  await page.locator('#technology-repeat').click();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#technology-viewer .technology-viewer__stage img')).toHaveAttribute('src', /04\.webp/);
  await page.locator('#technology-viewer .technology-viewer__close').click();
  await expect(page.locator('dialog:modal')).toHaveCount(0);
  await page.goto('/ar');
  await page.locator('#expressions-compare').click();
  await expect(page.locator('dialog:modal')).toBeVisible();
  expect(await page.locator('dialog:modal').evaluate(el => getComputedStyle(el).direction)).toBe('rtl');
  expect(await page.locator('.model-comparison').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: `screenshots/actual/comparison-ar-${testInfo.project.name}.png`, scale: 'css' });
  await page.keyboard.press('Escape');
});

test('FAQ icons are independent and answers expand the page without an inner scroller', async ({ page }) => {
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    const stack = page.locator('.faq-stack'), rows = stack.locator('details');
    await expect(rows).toHaveCount(6);
    const state = () => stack.evaluate(element => ({
      height: element.getBoundingClientRect().height,
      scrollRange: element.scrollHeight - element.clientHeight,
      documentHeight: document.documentElement.scrollHeight,
      after: ['#account-personal', '#project-ramsider', '#final'].map(selector => document.querySelector(selector)!.getBoundingClientRect().top + scrollY),
    }));
    const initial = await state();
    const canvas = (await page.locator('.canvas').boundingBox())!;
    for (const summary of await rows.locator('summary').all()) {
      const box = (await summary.boundingBox())!;
      expect(box.x - canvas.x).toBeCloseTo(canvas.width * 61 / 941, 0);
    }
    const checkIcons = async (open: number[]) => {
      for (let i = 0; i < 6; i++) {
        const row = rows.nth(i);
        expect(await row.evaluate(element => (element as HTMLDetailsElement).open)).toBe(open.includes(i));
        expect(await row.locator('.faq-symbol').evaluate(element => getComputedStyle(element, '::before').content)).toBe(open.includes(i) ? '"×"' : '"−"');
      }
      const current = await state();
      expect(current.scrollRange).toBeLessThanOrEqual(1);
      const growth = current.height - initial.height;
      expect(current.documentHeight - initial.documentHeight).toBeCloseTo(growth, -0.5);
      for (let i = 0; i < current.after.length; i++) expect(current.after[i] - initial.after[i]).toBeCloseTo(growth, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await stack.evaluate(element => element.getBoundingClientRect().bottom < document.querySelector('#account-personal')!.getBoundingClientRect().top)).toBe(true);
    };
    await checkIcons([]);
    await rows.nth(0).locator('summary').click();
    await checkIcons([0]);
    await rows.nth(1).locator('summary').click();
    await checkIcons([0, 1]);
    // Click the visible close cross, while the other answer stays open.
    const summary = rows.nth(0).locator('summary');
    const box = (await summary.boundingBox())!;
    await summary.click({ position: { x: box.width * 0.94, y: box.height / 2 } });
    await checkIcons([1]);
    for (let i = 0; i < 6; i++) if (i !== 1) await rows.nth(i).locator('summary').click();
    await checkIcons([0, 1, 2, 3, 4, 5]);
    for (const row of await rows.all()) {
      await row.locator('p').scrollIntoViewIfNeeded();
      await expect(row.locator('p')).toBeVisible();
      await row.locator('summary').focus();
      await page.keyboard.press('Space');
      await expect(row).not.toHaveAttribute('open');
    }
    await checkIcons([]);
    await rows.nth(5).locator('summary').focus();
    await page.keyboard.press('Enter');
    await checkIcons([5]);
    await page.locator('#account-personal').click();
    await expect(page.locator('#unavailable-account:modal')).toBeVisible();
  }
});

test.describe('FAQ pointer-wheel input', () => {
  // Mobile WebKit cannot inject wheel; only this test uses desktop input at the same viewport/DPR.
  test.use({ isMobile: false, hasTouch: false });
  test('FAQ always scrolls the document in closed and multi-open states', async ({ page }) => {
    for (const locale of ['en', 'ar']) {
      await page.goto(`/${locale}`);
      await page.evaluate(() => document.fonts.ready);
      const stack = page.locator('.faq-stack'), rows = stack.locator('details');
      for (const expanded of [false, true]) {
        if (expanded) for (const row of await rows.all()) await row.locator('summary').click();
        for (const row of await rows.all()) for (const delta of [-100, 100]) {
          await row.evaluate(element => {
            const box = element.getBoundingClientRect();
            scrollTo({ top: scrollY + box.top - innerHeight / 2, behavior: 'instant' });
          });
          const box = (await row.boundingBox())!;
          await page.mouse.move(box.x + box.width / 2, box.y + 20);
          const before = await page.evaluate(() => scrollY);
          await page.mouse.wheel(0, delta);
          await expect.poll(async () => ((await page.evaluate(() => scrollY)) - before) * Math.sign(delta)).toBeGreaterThan(20);
          expect(await stack.evaluate(element => element.scrollTop)).toBe(0);
        }
      }
    }
  });
});
