import { expect, test } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

test('prefixed element fullscreen retains custom controls and exits cleanly', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Exercise the prefixed API with a deterministic browser adapter');
  await silenceTestMedia(context);
  await page.goto('/en');
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-media-hydrated'));
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready');
  await page.evaluate(() => {
    const host = document.querySelector<HTMLElement>('#film-player')!;
    let active: Element | null = null;
    Object.defineProperty(host, 'requestFullscreen', { configurable: true, value: undefined });
    Object.defineProperty(document, 'webkitFullscreenElement', { configurable: true, get: () => active });
    Object.defineProperty(host, 'webkitRequestFullscreen', { configurable: true, value: () => {
      setTimeout(() => { active = host; document.dispatchEvent(new Event('webkitfullscreenchange')); }, 30);
    } });
    Object.defineProperty(document, 'webkitExitFullscreen', { configurable: true, value: () => {
      active = null; document.dispatchEvent(new Event('webkitfullscreenchange'));
    } });
  });
  const button = page.locator('.film-fullscreen');
  await button.click();
  await expect.poll(() => page.evaluate(() => (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement?.id)).toBe('film-player');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window', 'true');
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.evaluate(() => (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement)).toBeNull();
});
