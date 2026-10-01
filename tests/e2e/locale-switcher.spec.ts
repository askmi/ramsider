import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const localeNames = ['English', 'Русский', 'Deutsch', 'Français', 'Español', 'Italiano', 'Türkçe', 'العربية', '中文', '日本語', '한국어'];
const captureDir = process.env.VISUAL_OUTPUT_DIR ?? 'screenshots/actual/locale-switcher';

test('language control matches its three states and keeps the reading position', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/en');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await document.querySelector<HTMLImageElement>('.art img')!.decode();
  });
  const expectedWidth = testInfo.project.name.includes('pro-max') ? 440 : testInfo.project.name.includes('iphone') ? 402 : 1440;
  expect(await page.evaluate(() => innerWidth)).toBe(expectedWidth);
  expect(await page.evaluate(() => document.querySelector('meta[name="viewport"]')?.getAttribute('content'))).toContain('width=device-width');
  if (testInfo.project.name.includes('iphone')) expect(await page.evaluate(() => devicePixelRatio)).toBe(3);

  const trigger = page.locator('#locale-toggle');
  const triggerBox = (await trigger.boundingBox())!;
  expect(triggerBox.width).toBeGreaterThanOrEqual(44);
  expect(triggerBox.height).toBeGreaterThanOrEqual(44);
  await expect(trigger.locator('.locale-code')).toHaveText('EN');
  const closedSurface = await trigger.locator('.locale-toggle-face').evaluate(element => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, border: style.borderTopWidth, shadow: style.boxShadow };
  });
  expect(closedSurface).toEqual({ background: 'rgba(0, 0, 0, 0)', border: '0px', shadow: 'none' });
  const wordmarkBox = (await page.locator('.wordmark').boundingBox())!;
  const menuBars = await page.locator('.menu summary span').all();
  const firstBar = (await menuBars[0].boundingBox())!;
  const lastBar = (await menuBars[1].boundingBox())!;
  const centers = [wordmarkBox.y + wordmarkBox.height / 2, triggerBox.y + triggerBox.height / 2, (firstBar.y + lastBar.y + lastBar.height) / 2];
  expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(3);
  const artworkLeft = Math.max(0, (expectedWidth - 941) / 2) + 475 / 941 * Math.min(expectedWidth, 941);
  expect(Math.abs(triggerBox.x - artworkLeft)).toBeLessThan(2);
  await mkdir(captureDir, { recursive: true });
  await page.screenshot({ path: `${captureDir}/hero-${testInfo.project.name}.png`, scale: 'css' });

  await trigger.click();
  const panel = page.getByRole('navigation', { name: 'Language' });
  await expect(panel).toBeVisible();
  const openBox = (await panel.boundingBox())!;
  const panelMaterial = await panel.evaluate(element => {
    const style = getComputedStyle(element);
    const label = getComputedStyle(element.querySelector('a')!);
    return { background: style.backgroundColor, filter: style.backdropFilter, border: style.borderTopColor, labelWeight: label.fontWeight, labelColor: label.color };
  });
  const channels = panelMaterial.background.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*(0?\.\d+)\)/);
  expect(channels).not.toBeNull();
  for (const channel of channels!.slice(1, 4)) expect(Number(channel)).toBeGreaterThan(220);
  expect(Number(channels![4])).toBeGreaterThan(0);
  expect(Number(channels![4])).toBeLessThan(0.5);
  expect(Number(panelMaterial.labelWeight)).toBeGreaterThanOrEqual(600);
  const labelChannels = panelMaterial.labelColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  expect(labelChannels).not.toBeNull();
  for (const channel of labelChannels!.slice(1)) expect(Number(channel)).toBeLessThan(80);
  expect(panelMaterial.filter).toContain('blur(');
  expect(panelMaterial.border).toBe('rgb(181, 140, 78)');
  await expect(panel.locator('a')).toHaveCount(11);
  await expect(panel.locator('.locale-check')).toHaveCount(0);
  const compactRows = await panel.evaluate(element => {
    const panelBox = element.getBoundingClientRect();
    return {
      panelWidth: panelBox.width,
      overflow: element.scrollWidth > element.clientWidth,
      rows: [...element.querySelectorAll('a')].map(link => {
        const flag = link.querySelector('.locale-flag')!.getBoundingClientRect();
        const name = link.querySelector('span:nth-child(2)')!.getBoundingClientRect();
        return { flagBeforeName: flag.right <= name.left, nameInside: name.right <= panelBox.right - 5, oneLine: getComputedStyle(link).whiteSpace === 'nowrap' };
      }),
    };
  });
  expect(compactRows.panelWidth).toBeLessThan(144);
  expect(compactRows.overflow).toBe(false);
  for (const row of compactRows.rows) expect(row).toEqual({ flagBeforeName: true, nameInside: true, oneLine: true });
  for (const name of localeNames) await expect(panel.getByRole('link', { name })).toBeVisible();
  for (const item of await panel.locator('a').all()) {
    const box = (await item.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(26);
  }
  if (testInfo.project.name.includes('iphone')) {
    const panelBox = (await panel.boundingBox())!;
    expect(panelBox.height).toBeGreaterThanOrEqual(285);
    expect(panelBox.height).toBeLessThanOrEqual(320);
  }
  await expect(panel.getByRole('link', { name: 'English' })).toHaveAttribute('aria-current', 'page');
  expect(await panel.getByRole('link', { name: 'English' }).evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  await page.screenshot({ path: `${captureDir}/open-${testInfo.project.name}.png`, scale: 'css' });
  if (testInfo.project.name.startsWith('desktop')) {
    await panel.getByRole('link', { name: 'Deutsch' }).hover();
    await page.screenshot({ path: `${captureDir}/hover-${testInfo.project.name}.png`, scale: 'css' });
  }
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.evaluate(element => (element as HTMLElement).blur());

  await page.evaluate(() => scrollTo({ top: 6500, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(6400);
  await expect(page.locator('.locale-switcher')).toHaveAttribute('data-scrolled', 'true');
  await page.evaluate(async () => {
    const image = [...document.querySelectorAll<HTMLImageElement>('.art img')].find(item => {
      const box = item.getBoundingClientRect();
      return box.bottom > 0 && box.top < innerHeight;
    });
    if (image) await image.decode();
  });
  const scrolledY = await page.evaluate(() => scrollY);
  const fixedBox = (await trigger.boundingBox())!;
  expect(fixedBox.y).toBeGreaterThanOrEqual(0);
  expect(fixedBox.y + fixedBox.height).toBeLessThanOrEqual(testInfo.project.use.viewport?.height ?? 900);
  expect(Math.abs(fixedBox.x - triggerBox.x)).toBeLessThan(1);
  expect(Math.abs(fixedBox.y - triggerBox.y)).toBeLessThan(1);
  await page.screenshot({ path: `${captureDir}/scrolled-${testInfo.project.name}.png`, scale: 'css' });

  await trigger.click();
  await expect(panel).toBeVisible();
  const scrolledOpenBox = (await panel.boundingBox())!;
  expect(Math.abs(scrolledOpenBox.x - openBox.x)).toBeLessThan(1);
  await panel.getByRole('link', { name: 'Русский' }).click();
  await expect(page).toHaveURL(/\/ru$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('#locale-toggle')).toHaveAttribute('aria-label', /Русский/);
  await expect.poll(async () => Math.abs((await page.evaluate(() => scrollY)) - scrolledY)).toBeLessThan(130);
  expect(errors).toEqual([]);
});

test('Arabic layout and narrow viewport keep the selector operable', async ({ page }, testInfo) => {
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await document.querySelector<HTMLImageElement>('.art img')!.decode();
  });
  if (testInfo.project.name.includes('iphone')) await page.screenshot({ path: `${captureDir}/arabic-hero-${testInfo.project.name}.png`, scale: 'css' });
  await page.locator('#locale-toggle').click();
  const panel = page.getByRole('navigation', { name: 'اللغة' });
  await expect(panel.getByRole('link', { name: 'العربية' })).toHaveAttribute('aria-current', 'page');
  await expect(panel.getByRole('link', { name: 'English' })).toBeVisible();
  if (testInfo.project.name.includes('iphone')) await page.screenshot({ path: `${captureDir}/arabic-open-${testInfo.project.name}.png`, scale: 'css' });
  await page.keyboard.press('Escape');
  await page.locator('#locale-toggle').evaluate(element => (element as HTMLElement).blur());
  await page.evaluate(() => scrollTo({ top: 6500, behavior: 'instant' }));
  await expect(page.locator('.locale-switcher')).toHaveAttribute('data-scrolled', 'true');
  await page.evaluate(async () => {
    const image = [...document.querySelectorAll<HTMLImageElement>('.art img')].find(item => {
      const box = item.getBoundingClientRect();
      return box.bottom > 0 && box.top < innerHeight;
    });
    if (image) await image.decode();
  });
  if (testInfo.project.name.includes('iphone')) await page.screenshot({ path: `${captureDir}/arabic-scrolled-${testInfo.project.name}.png`, scale: 'css' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
});

test('translucent language panel remains readable over product and dark artwork', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('iphone'));
  await mkdir(captureDir, { recursive: true });
  for (const locale of ['en', 'ar'] as const) {
    if (locale === 'ar' && testInfo.project.name !== 'iphone-17-pro-webkit') continue;
    await page.goto(`/${locale}`);
    await page.evaluate(() => document.fonts.ready);
    for (const [name, sourceY] of [['coal', 2800], ['amber', 15500], ['dark', 28800]] as const) {
      await page.evaluate(y => {
        const width = document.querySelector('.canvas')!.getBoundingClientRect().width;
        scrollTo({ top: y * width / 941, behavior: 'instant' });
      }, sourceY);
      await expect(page.locator('.locale-switcher')).toHaveAttribute('data-scrolled', 'true');
      if (name !== 'amber') {
        await expect(page.locator('.locale-switcher')).toHaveAttribute('data-dark', 'true');
        expect(await page.locator('.locale-code').evaluate(element => getComputedStyle(element).color)).toBe('rgb(255, 255, 255)');
      }
      await page.evaluate(async () => {
        const images = [...document.querySelectorAll<HTMLImageElement>('.art img, .tail-art img')];
        await Promise.all(images.filter(image => {
          const box = image.getBoundingClientRect();
          return box.bottom > 0 && box.top < innerHeight;
        }).map(image => image.decode().catch(() => undefined)));
      });
      await page.locator('#locale-toggle').click();
      const panel = page.locator('.locale-options');
      await expect(panel).toBeVisible();
      await expect(panel.locator('a')).toHaveCount(11);
      await page.screenshot({ path: `${captureDir}/${locale}-${name}-open-${testInfo.project.name}.png`, scale: 'css' });
      if (locale === 'en' && name === 'dark' && testInfo.project.name === 'iphone-17-pro-webkit') {
        await page.keyboard.press('ArrowDown');
        await expect(panel.getByRole('link', { name: 'Русский' })).toBeFocused();
        await page.screenshot({ path: `${captureDir}/en-dark-focus-iphone-17-pro-webkit.png`, scale: 'css' });
      }
      await page.keyboard.press('Escape');
    }
  }
});

test('closed code changes contrast at artwork boundaries', async ({ page }, testInfo) => {
  test.skip(!['iphone-17-pro-webkit', 'desktop-chromium'].includes(testInfo.project.name));
  await mkdir(captureDir, { recursive: true });
  for (const locale of ['en', 'ar'] as const) {
    await page.goto(`/${locale}`);
    const cases: Array<[string, number, boolean]> = locale === 'en'
      ? [['before-coal', 2600, false], ['coal', 2850, true], ['dark-patch', 7580, true], ['after-group-dark', 29325, false]]
      : [['rtl-before-coal', 2600, false], ['rtl-coal', 2790, true], ['rtl-after-coal', 3050, false]];
    if (testInfo.project.name === 'desktop-chromium') cases.push(['coffee-machine', 30500, locale === 'en']);
    for (const [name, sourceY, dark] of cases) {
    await page.evaluate(y => {
      const canvas = document.querySelector('.canvas')!.getBoundingClientRect();
      const tail = document.querySelector('.story-tail')!.getBoundingClientRect();
      const switcher = document.querySelector('.locale-switcher')!.getBoundingClientRect();
      const scale = canvas.width / 941;
      const top = y < 28207
        ? scrollY + canvas.top + y * scale
        : scrollY + tail.top + (y - 28207) * scale;
      scrollTo({ top: top - switcher.top - 22, behavior: 'instant' });
    }, sourceY);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page.locator('.locale-switcher')).toHaveAttribute('data-dark', String(dark));
    expect(await page.locator('.locale-code').evaluate(element => getComputedStyle(element).color))
      .toBe(dark ? 'rgb(255, 255, 255)' : 'rgb(41, 34, 31)');
      await page.screenshot({ path: `${captureDir}/boundary-${locale}-${name}-${testInfo.project.name}.png`, scale: 'css' });
    }
  }
});

test('narrow phones keep the closed control legible over dark artwork', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-17-pro-webkit');
  await mkdir(captureDir, { recursive: true });
  for (const width of [320, 350]) {
    await page.setViewportSize({ width, height: 874 });
    for (const locale of ['en', 'ar'] as const) {
      await page.goto(`/${locale}`);
      const positions = locale === 'ar' && width === 320
        ? [['before', 10000, false], ['dark', 10800, true], ['after', 11500, false]] as const
        : locale === 'ar'
          ? [['before', 2600, false], ['dark', 2800, true], ['after', 3050, false]] as const
          : [['before', 2600, false], ['dark', 2850, true], ['after', 3050, false]] as const;
      for (const [name, y, white] of positions) {
        await page.evaluate(sourceY => {
          const canvas = document.querySelector('.canvas')!.getBoundingClientRect();
          const switcher = document.querySelector('.locale-switcher')!.getBoundingClientRect();
          scrollTo({ top: scrollY + canvas.top + sourceY * canvas.width / 941 - switcher.top - 22, behavior: 'instant' });
        }, y);
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        await expect(page.locator('.locale-switcher')).toHaveAttribute('data-dark', String(white));
        await expect(page.locator('.locale-switcher')).toHaveAttribute('data-chevron-dark', String(white));
        expect(await page.locator('.locale-code').evaluate(element => getComputedStyle(element).color))
          .toBe(white ? 'rgb(255, 255, 255)' : 'rgb(41, 34, 31)');
        expect(await page.locator('.locale-chevron').evaluate(element => getComputedStyle(element).stroke))
          .toBe(white ? 'rgb(255, 255, 255)' : 'rgb(41, 34, 31)');
        const box = await page.locator('.locale-toggle').boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        await page.screenshot({ path: `${captureDir}/narrow-${width}-${locale}-${name}.png`, scale: 'css' });
      }
    }
  }
});

test('expanded FAQ card keeps a dark locale label', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-17-pro-webkit');
  await page.goto('/en');
  await page.locator('.faq-item details').first().evaluate(details => { (details as HTMLDetailsElement).open = true; });
  await page.locator('.faq-item').last().evaluate(item => {
    const switcher = document.querySelector('.locale-switcher')!.getBoundingClientRect();
    scrollTo({ top: scrollY + item.getBoundingClientRect().top - switcher.top - 22, behavior: 'instant' });
  });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator('.locale-switcher')).toHaveAttribute('data-dark', 'false');
});

test('header controls retain a common line at intermediate widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ['en', 'ar']) {
      await page.goto(`/${locale}`);
      await page.evaluate(() => document.fonts.ready);
      const wordmark = (await page.locator('.wordmark').boundingBox())!;
      const trigger = (await page.locator('#locale-toggle').boundingBox())!;
      const bars = await page.locator('.menu summary span').all();
      const firstBar = (await bars[0].boundingBox())!;
      const lastBar = (await bars[1].boundingBox())!;
      const centers = [wordmark.y + wordmark.height / 2, trigger.y + trigger.height / 2, (firstBar.y + lastBar.y + lastBar.height) / 2];
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  }
});

test('every locale has its matching flag and selected language', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-17-pro-webkit');
  const locales = ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko'];
  for (let index = 0; index < locales.length; index++) {
    await page.goto(`/${locales[index]}`);
    await expect(page.locator('#locale-toggle .locale-code')).toHaveText(locales[index].toUpperCase());
    await expect(page.locator('#locale-toggle .locale-flag')).toHaveText(/\S/);
    await page.locator('#locale-toggle').click();
    const selected = page.locator('.locale-options a[aria-current="page"]');
    await expect(selected).toHaveCount(1);
    await expect(selected).toHaveAttribute('href', `/${locales[index]}`);
    await expect(selected).toHaveAttribute('lang', locales[index]);
    await expect(selected).toContainText(localeNames[index]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(402);
  }
});

test('every language row accepts center and near-edge touches without choosing a neighbor', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-17-pro-webkit');
  const locales = ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko'];
  for (let index = 0; index < locales.length; index++) {
    for (const edge of ['top', 'bottom'] as const) {
      await page.goto('/en');
      await page.locator('#locale-toggle').tap();
      const option = page.locator(`.locale-options a[href="/${locales[index]}"]`);
      const box = (await option.boundingBox())!;
      await option.tap({ position: { x: box.width / 2, y: edge === 'top' ? 3 : box.height - 3 } });
      await expect(page).toHaveURL(new RegExp(`/${locales[index]}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', locales[index]);
    }
  }
});

test('keyboard focus, Escape, and Arabic alignment remain usable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-17-pro-webkit');
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`);
    const trigger = page.locator('#locale-toggle');
    await trigger.focus();
    await page.keyboard.press('Enter');
    const selected = page.locator('.locale-options a[aria-current="page"]');
    await expect(selected).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.locale-options a').nth(locale === 'en' ? 1 : 8)).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('.locale-options a').last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('.locale-options a').first()).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('.locale-options a').last()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.locator('#locale-options')).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(selected).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#locale-options')).toBeHidden();
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Space');
    await expect(selected).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#locale-options')).toBeHidden();
    if (locale === 'ar') {
      const box = (await trigger.boundingBox())!;
      const mirroredX = 402 - 475 / 941 * 402 - box.width;
      expect(Math.abs(box.x - mirroredX)).toBeLessThan(2);
    }
  }
  await page.goto('/en');
  await page.locator('#navigation-toggle').click();
  await expect(page.locator('.menu')).toHaveAttribute('open');
  await page.locator('#locale-toggle').click();
  await expect(page.locator('.menu')).not.toHaveAttribute('open');
  await expect(page.locator('#locale-options')).toBeVisible();
  await page.locator('#navigation-toggle').click();
  await expect(page.locator('#locale-options')).toBeHidden();
});

test('opening the list does not prefetch all routes and modified clicks keep the source tab', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/en');
  await page.waitForLoadState('networkidle');
  const routes: string[] = [];
  page.on('request', request => {
    if (request.url().includes('_rsc=') && /\/(?:ru|de|fr|es|it|tr|ar|zh|ja|ko)\?/.test(request.url())) routes.push(request.url());
  });
  await page.locator('#locale-toggle').click();
  await page.waitForTimeout(400);
  expect(routes).toEqual([]);
  await page.evaluate(() => {
    document.addEventListener('click', event => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('.locale-options a');
      if (link && event.metaKey) link.dataset.modifiedDefaultPrevented = String(event.defaultPrevented);
    });
  });
  const russian = page.locator('.locale-options a[href="/ru"]');
  await russian.click({ modifiers: ['Meta'] });
  await expect(russian).toHaveAttribute('data-modified-default-prevented', 'false');
  const english = page.locator('.locale-options a[href="/en"]');
  await english.click({ modifiers: ['Meta'] });
  await expect(english).toHaveAttribute('data-modified-default-prevented', 'false');
  await expect(page).toHaveURL(/\/en$/);
  expect(await page.evaluate(() => sessionStorage.getItem('ramsider:locale-scroll'))).toBeNull();
});

test('small phone, tablet, and desktop keep the panel in view', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    for (const locale of ['en', 'ar']) {
      await page.goto(`/${locale}`);
      await page.locator('#locale-toggle').click();
      const panel = page.locator('#locale-options');
      const box = (await panel.boundingBox())!;
      expect(box.x, `${locale} at ${width}px`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${locale} at ${width}px`).toBeLessThanOrEqual(width);
      expect(box.y + box.height, `${locale} at ${width}px`).toBeLessThanOrEqual(page.viewportSize()!.height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${locale} at ${width}px`).toBeLessThanOrEqual(width);
      await page.mouse.click(width / 2, page.viewportSize()!.height - 20);
      await expect(panel).toBeHidden();
    }
  }
  await page.setViewportSize({ width: 320, height: 280 });
  await page.goto('/en');
  await page.locator('#locale-toggle').click();
  const panel = page.locator('#locale-options');
  const box = (await panel.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(280);
  await panel.locator('a[href="/ko"]').click();
  await expect(page).toHaveURL(/\/ko$/);
  await page.setViewportSize({ width: 1440, height: 280 });
  await page.goto('/en');
  await page.locator('#locale-toggle').click();
  const shortDesktopPanel = page.locator('#locale-options');
  const desktopBox = (await shortDesktopPanel.boundingBox())!;
  expect(desktopBox.y + desktopBox.height).toBeLessThanOrEqual(268);
  await shortDesktopPanel.locator('a[href="/ko"]').click();
  await expect(page).toHaveURL(/\/ko$/);
});
