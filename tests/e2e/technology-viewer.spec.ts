import { expect, test } from '@playwright/test';

test('technology viewer opens from both story controls and pages through clean images', async ({ page }, testInfo) => {
  await page.goto('/en');
  expect(await page.evaluate(() => window.innerWidth)).toBe(testInfo.project.use.viewport?.width);
  expect(await page.evaluate(() => window.devicePixelRatio)).toBe(testInfo.project.use.deviceScaleFactor ?? 1);
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).toContain('width=device-width');

  const openers = page.locator('[data-technology-open]');
  await expect(openers).toHaveCount(2);
  const viewer = page.locator('#technology-viewer');
  for (let triggerIndex = 0; triggerIndex < 2; triggerIndex++) {
    await openers.nth(triggerIndex).scrollIntoViewIfNeeded();
    await openers.nth(triggerIndex).click();
    await expect(viewer).toBeVisible();
    await expect(viewer.locator('.technology-viewer__frame')).toHaveAttribute('src', /frame-template\.png/);
    const dots = viewer.locator('.technology-viewer__dots button');
    await expect(dots).toHaveCount(4);
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
    for (const dot of await dots.all()) {
      const hit = await dot.boundingBox();
      expect(hit?.width).toBeGreaterThanOrEqual(44);
      expect(hit?.height).toBeGreaterThanOrEqual(44);
    }
    const closeHit = await viewer.locator('.technology-viewer__close').boundingBox();
    expect(closeHit?.width).toBeGreaterThanOrEqual(44);
    expect(closeHit?.height).toBeGreaterThanOrEqual(44);
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /02\.webp/);
    await expect.poll(() => viewer.locator('.technology-viewer__stage img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-entry-${triggerIndex + 1}.png` });

    const nextImage = viewer.locator('.technology-viewer__next-image');
    await expect(nextImage).toHaveAttribute('aria-label', 'Show next image');
    await nextImage.click();
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /03\.webp/);
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await dots.nth(3).click();
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /05\.webp/);
    await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true');
    await nextImage.focus();
    await page.keyboard.press('Enter');
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /02\.webp/);
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');

    const stage = viewer.locator('.technology-viewer__stage');
    const box = await stage.boundingBox();
    if (!box) throw new Error('Missing technology stage');
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * .8, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .2, y, { steps: 5 });
    await page.mouse.up();
    await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /03\.webp/);
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    if (triggerIndex === 0) {
      for (let slideIndex = 0; slideIndex < 4; slideIndex++) {
        await dots.nth(slideIndex).click();
        await expect.poll(() => viewer.locator('.technology-viewer__stage img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
        await expect(dots.nth(slideIndex)).toHaveAttribute('aria-current', 'true');
        await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-slide-${slideIndex + 1}.png` });
      }
      await dots.nth(2).focus();
      await page.keyboard.press('Enter');
      await expect(viewer.locator('.technology-viewer__stage img')).toHaveAttribute('src', /04\.webp/);
      await expect(dots.nth(2)).toHaveAttribute('aria-current', 'true');
    }
    await viewer.locator('.technology-viewer__next-group').click();
    await expect(viewer.getByRole('status')).toHaveText('The next technology is coming soon.');
    if (triggerIndex === 0) await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-next-group-placeholder.png` });
    await expect(viewer).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(viewer.getByRole('status')).toHaveCount(0);
    await viewer.locator('.technology-viewer__close').click();
    await expect(viewer).not.toBeVisible();
    await expect(openers.nth(triggerIndex)).toBeFocused();
  }
});

test('technology viewer supports touch pointers, Escape and Arabic framing', async ({ page }, testInfo) => {
  await page.goto('/ar');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-technology-open]').first().click();
  const viewer = page.locator('#technology-viewer');
  await expect(viewer).toBeVisible();
  const stage = viewer.locator('.technology-viewer__stage');
  const box = await stage.boundingBox();
  if (!box) throw new Error('Missing technology stage');
  const y = box.y + box.height / 2;
  await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: box.x + box.width * .2, clientY: y });
  await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: box.x + box.width * .8, clientY: y });
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.webp/);
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
  await expect(stage.locator('img')).toHaveAttribute('alt', /زعانف هوائية نشطة/);
  await page.keyboard.press('ArrowLeft');
  await expect(stage.locator('img')).toHaveAttribute('src', /04\.webp/);
  await page.keyboard.press('ArrowRight');
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.webp/);
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await page.screenshot({ path: `screenshots/actual/technology-viewer/${testInfo.project.name}-arabic-swipe.png` });
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await page.locator('[data-technology-open]').first().click();
  await expect(viewer).toBeVisible();
  await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 200, clientY: 500 });
  await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 200, clientY: 350 });
  await expect(viewer).toBeVisible();
  await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 200, clientY: 350 });
  await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 200, clientY: 550 });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole('status')).toHaveText('التقنية التالية ستتوفر قريباً.');
  await viewer.locator('.technology-viewer__next-group').focus();
  await page.keyboard.press('Enter');
  await expect(viewer.getByRole('status')).toBeVisible();
  await viewer.locator('.technology-viewer__close').click();
  await expect(viewer).not.toBeVisible();
});

test('previous artwork stays visible while the next slide loads', async ({ page }) => {
  await page.route('**/art/technology/03.webp', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.goto('/en');
  await page.locator('[data-technology-open]').first().click();
  const stage = page.locator('#technology-viewer .technology-viewer__stage');
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
  await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 300, clientY: 400 });
  await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 90, clientY: 400 });
  await expect(stage.locator('img')).toHaveAttribute('src', /02\.webp/);
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 1 \/ 4/);
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.webp/);
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 2 \/ 4/);
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
});

test('failed slide load does not skip the next image', async ({ page }) => {
  let requests = 0;
  await page.route('**/art/technology/03.webp', async route => {
    requests++;
    if (requests === 1) await route.abort();
    else await route.continue();
  });
  await page.goto('/en');
  await page.locator('[data-technology-open]').first().click();
  const stage = page.locator('#technology-viewer .technology-viewer__stage');
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
  const swipe = async () => {
    await stage.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 300, clientY: 400 });
    await stage.dispatchEvent('pointerup', { pointerType: 'touch', clientX: 90, clientY: 400 });
  };
  await swipe();
  await expect.poll(() => requests).toBe(1);
  await expect(stage.locator('img')).toHaveAttribute('src', /02\.webp/);
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 1 \/ 4/);
  await page.waitForTimeout(150);
  await swipe();
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.webp/);
  await expect(page.locator('.technology-viewer__dots button[aria-current="true"]')).toHaveAttribute('aria-label', /Image 2 \/ 4/);
});

test('swipe completes when the pointer leaves the artwork', async ({ page }) => {
  await page.goto('/en');
  await page.locator('[data-technology-open]').first().click();
  const stage = page.locator('#technology-viewer .technology-viewer__stage');
  await expect.poll(() => stage.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 941)).toBe(true);
  const box = await stage.boundingBox();
  if (!box) throw new Error('Missing technology stage');
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * .8, y);
  await page.mouse.down();
  await page.mouse.move(0, y, { steps: 5 });
  await page.mouse.up();
  await expect(stage.locator('img')).toHaveAttribute('src', /03\.webp/);
});
