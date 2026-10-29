import { expect, test, type Page } from '@playwright/test';

/** Negative-path coverage only; successful film acceptance requires real frames. */
export async function expectOriginalUnavailable(page: Page) {
  if (await page.locator('video').getAttribute('data-delivery') !== 'original') return false;
  // These configured profiles use known decoder-less bundled builds.
  // A recovery on WebKit or system Chrome must fail normal playback assertions.
  if (!['desktop-chromium', 'desktop-firefox'].includes(test.info().project.name) || test.info().project.use.channel) return false;
  await expect.poll(async () => {
    const picture = await page.locator('video').evaluate(el => {
      const v = el as HTMLVideoElement;
      return v.videoWidth > 0 && v.videoHeight > 0;
    });
    return picture || await page.locator('.film-recovery').isVisible();
  }, { timeout: 20000 }).toBe(true);
  const unavailable = await page.locator('.film-recovery').isVisible();
  if (unavailable) {
    await expect(page.locator('.film-recovery')).toBeVisible();
    await expect(page.locator('video')).not.toHaveAttribute('src');
  }
  return unavailable;
}
