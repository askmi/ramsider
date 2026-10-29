import { expect, type Page } from '@playwright/test';

/** Original HEVC has no transcoded substitute; cover its explicit error path too. */
export async function expectOriginalUnavailable(page: Page) {
  const unavailable = await page.locator('video').evaluate(el => {
    const v = el as HTMLVideoElement;
    return v.dataset.delivery === 'original' && !v.canPlayType(v.dataset.mediaType ?? '');
  });
  if (unavailable) {
    await expect(page.locator('.film-recovery')).toBeVisible();
    await expect(page.locator('video')).not.toHaveAttribute('src');
  }
  return unavailable;
}
