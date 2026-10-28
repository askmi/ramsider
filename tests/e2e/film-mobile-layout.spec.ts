import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.setTimeout(120000);
test.beforeEach(async ({ page }) => silenceTestMedia(page));

for (const orientation of ['portrait', 'landscape'] as const) {
  for (const locale of ['en', 'ar'] as const) {
    test(`${orientation} ${locale}: progress precedes controls and settings opens`, async ({ page }, info) => {
      test.skip(!['iphone-17-pro-webkit', 'iphone-17-pro-max-webkit'].includes(info.project.name), 'Mobile WebKit profiles');
      const max = info.project.name === 'iphone-17-pro-max-webkit';
      if (orientation === 'landscape') await page.setViewportSize(max ? { width: 956, height: 440 } : { width: 874, height: 402 });
      await page.goto(`/${locale}`);
      await page.locator('#film-play').scrollIntoViewIfNeeded();
      await page.locator('#film-play').click();
      await page.locator('.film-gallery__hero').click();
      const player = page.locator('#film-player');
      const video = page.locator('video');
      await expect(player).toHaveAttribute('data-controls', 'ready');
      await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
      await video.evaluate(v => (v as HTMLVideoElement).pause());
      const seek = page.locator('.film-seek');
      await expect(seek).toBeVisible();
      const seekBox = await seek.boundingBox();
      expect(seekBox).not.toBeNull();
      const selectors = ['.film-previous', '.film-play-toggle', '.film-next', '.film-mute-toggle', '.film-options__trigger', '.film-fullscreen'];
      if (orientation === 'landscape') selectors.push('.film-volume');
      else await expect(page.locator('.film-volume')).toBeHidden();
      for (const selector of selectors) {
        const control = page.locator(selector);
        await expect(control).toBeVisible();
        const box = await control.boundingBox();
        expect(box, selector).not.toBeNull();
        expect(box!.y, `${selector} must be below progress`).toBeGreaterThanOrEqual(seekBox!.y + seekBox!.height - 1);
        expect(box!.width, `${selector} touch width`).toBeGreaterThanOrEqual(44);
        expect(box!.height, `${selector} touch height`).toBeGreaterThanOrEqual(44);
      }
      const evidence = `screenshots/video/mobile-layout/${info.project.name}-${orientation}-${locale}`;
      await mkdir('screenshots/video/mobile-layout', { recursive: true });
      await expect.poll(() => page.locator('.film-transport').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${evidence}-controls.png` });
      await page.locator('#film-settings-toggle').click();
      const menu = page.locator('#film-options-menu');
      await expect(menu).toBeVisible();
      await expect(menu).not.toHaveAttribute('hidden');
      await expect.poll(() => menu.evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
      const playerBox = await player.boundingBox(), menuBox = await menu.boundingBox();
      expect(playerBox).not.toBeNull();
      expect(menuBox).not.toBeNull();
      expect(menuBox!.y).toBeGreaterThanOrEqual(playerBox!.y - 1);
      expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(playerBox!.y + playerBox!.height + 1);
      await page.screenshot({ path: `${evidence}-settings.png` });
    });
  }
}

test('rotation expands a playing film and restores portrait without interrupting playback', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'iphone-17-pro-max-webkit'].includes(info.project.name), 'Mobile WebKit profiles');
  const max = info.project.name === 'iphone-17-pro-max-webkit';
  const portrait = max ? { width: 440, height: 956 } : { width: 402, height: 874 };
  const landscape = { width: portrait.height, height: portrait.width };
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video'), player = page.locator('#film-player');
  await expect(player).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  const before = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
  await page.setViewportSize(landscape);
  await expect.poll(async () => (await player.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(landscape.width - 2);
  await expect.poll(() => video.evaluate((v, time) => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > time, before), { timeout: 30000 }).toBe(true);
  await mkdir('screenshots/video/mobile-layout', { recursive: true });
  await page.screenshot({ path: `screenshots/video/mobile-layout/${info.project.name}-rotated.png` });
  const rotated = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
  await page.setViewportSize(portrait);
  await expect.poll(async () => (await player.boundingBox())?.width ?? 0).toBeLessThanOrEqual(portrait.width + 1);
  await expect.poll(() => video.evaluate((v, time) => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > time, rotated), { timeout: 30000 }).toBe(true);
  await page.screenshot({ path: `screenshots/video/mobile-layout/${info.project.name}-restored.png` });
});

test('fullscreen rotation keeps playback and controls usable through exit', async ({ page }, info) => {
  test.skip(!['iphone-17-pro-webkit', 'iphone-17-pro-max-webkit'].includes(info.project.name), 'Mobile WebKit profiles');
  const max = info.project.name === 'iphone-17-pro-max-webkit';
  const portrait = max ? { width: 440, height: 956 } : { width: 402, height: 874 };
  const landscape = { width: portrait.height, height: portrait.width };
  await page.goto('/en');
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  const video = page.locator('video'), player = page.locator('#film-player');
  await expect(player).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.locator('.film-fullscreen').click();
  const expanded = () => page.evaluate(() => document.fullscreenElement?.id === 'film-player' || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true');
  await expect.poll(expanded).toBe(true);
  for (const size of [landscape, portrait]) {
    const before = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
    await page.setViewportSize(size);
    await expect.poll(expanded).toBe(true);
    await expect.poll(async () => (await player.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(size.width - 2);
    await expect.poll(() => video.evaluate((v, time) => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > time, before), { timeout: 30000 }).toBe(true);
    await page.locator('.film-play-toggle').hover();
    await expect(page.locator('.film-play-toggle')).toBeVisible();
    await expect(page.locator('.film-seek')).toBeVisible();
    await expect(page.locator('.film-fullscreen')).toBeVisible();
    await mkdir('screenshots/video/mobile-layout', { recursive: true });
    await page.screenshot({ path: `screenshots/video/mobile-layout/${info.project.name}-fullscreen-${size.width > size.height ? 'landscape' : 'portrait'}.png` });
  }
  await page.locator('.film-fullscreen').click();
  await expect.poll(expanded).toBe(false);
  expect(await video.evaluate(v => !(v as HTMLVideoElement).paused)).toBe(true);
});

for (const fullscreen of [false, true]) {
  test(`landscape ended card leaves seek and controls usable (${fullscreen ? 'fullscreen' : 'normal'})`, async ({ page }, info) => {
    test.skip(!['iphone-17-pro-webkit', 'iphone-17-pro-max-webkit'].includes(info.project.name), 'Mobile WebKit profiles');
    const max = info.project.name === 'iphone-17-pro-max-webkit';
    await page.setViewportSize(max ? { width: 956, height: 440 } : { width: 874, height: 402 });
    await page.goto('/en');
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click();
    await page.locator('.film-gallery__hero').click();
    const video = page.locator('video'), player = page.locator('#film-player');
    await expect(player).toHaveAttribute('data-controls', 'ready');
    await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
    if (fullscreen) {
      await page.locator('.film-fullscreen').click();
      await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id === 'film-player' || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
    }
    await video.evaluate(v => { const media = v as HTMLVideoElement; media.currentTime = media.duration - .3; });
    await expect(page.locator('#product-film')).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
    const card = page.locator('.film-ended'), seek = page.locator('.film-seek');
    await expect(card).toBeVisible();
    await expect(seek).toBeVisible();
    const cardBox = await card.boundingBox(), seekBox = await seek.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(seekBox).not.toBeNull();
    expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(seekBox!.y + 1);
    await mkdir('screenshots/video/mobile-layout', { recursive: true });
    await page.screenshot({ path: `screenshots/video/mobile-layout/${info.project.name}-ended-${fullscreen ? 'fullscreen' : 'normal'}.png` });
    await seek.click({ position: { x: seekBox!.width * .5, y: seekBox!.height * .5 } });
    await page.locator('#film-settings-toggle').click();
    await expect(page.locator('#film-options-menu')).toBeVisible();
  });
}

for (const fullscreen of [false, true]) {
  for (const action of ['replay', 'next', 'list'] as const) {
    test(`landscape ended ${action} is visible and works (${fullscreen ? 'fullscreen' : 'normal'})`, async ({ page }, info) => {
      test.skip(!['iphone-17-pro-webkit', 'iphone-17-pro-max-webkit'].includes(info.project.name), 'Mobile WebKit profiles');
      const max = info.project.name === 'iphone-17-pro-max-webkit';
      await page.setViewportSize(max ? { width: 956, height: 440 } : { width: 874, height: 402 });
      await page.goto('/en');
      await page.locator('#film-play').scrollIntoViewIfNeeded();
      await page.locator('#film-play').click();
      await page.locator('.film-gallery__hero').click();
      const video = page.locator('video'), dialog = page.locator('#product-film');
      await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
      await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
      if (fullscreen) {
        await page.locator('.film-fullscreen').click();
        await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id === 'film-player' || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
      }
      await video.evaluate(v => { const media = v as HTMLVideoElement; media.currentTime = media.duration - .3; });
      await expect(dialog).toHaveAttribute('data-view', 'ended', { timeout: 30000 });
      const card = page.locator('.film-ended'), seek = page.locator('.film-seek');
      const cardBox = await card.boundingBox(), seekBox = await seek.boundingBox();
      expect(cardBox).not.toBeNull(); expect(seekBox).not.toBeNull();
      const replay = page.locator('.film-ended__replay');
      await expect(card.locator('button')).toHaveCount(1);
      for (const button of [replay]) {
        await expect(button).toBeVisible();
        const box = await button.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44); expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.y).toBeGreaterThanOrEqual(cardBox!.y - 1);
        expect(box!.y + box!.height).toBeLessThanOrEqual(Math.min(cardBox!.y + cardBox!.height, seekBox!.y) + 1);
        expect(await button.evaluate(el => {
          const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return hit === el || !!hit && el.contains(hit);
        })).toBe(true);
      }
      await mkdir('screenshots/video/mobile-layout', { recursive: true });
      await page.screenshot({ path: `screenshots/video/mobile-layout/${info.project.name}-ended-actions-${fullscreen ? 'fullscreen' : 'normal'}.png` });
      if (action === 'list') {
        await page.locator('.film-player__list-toggle').click();
        await expect(page.locator('#film-playlist')).toBeVisible();
        await expect(dialog).toHaveAttribute('data-view', 'ended');
      } else {
        await (action === 'replay' ? replay : page.locator('.film-next')).click();
        await expect(dialog).toHaveAttribute('data-view', 'playing');
        if (action === 'next') await expect(page.locator('.film-player__identity')).toHaveText('Pure Gold');
        await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime < 10), { timeout: 30000 }).toBe(true);
      }
    });
  }
}
