import { expect, type Page } from '@playwright/test';

/** Allow scroll/visibility observers to settle, then wait for the actual input gate. */
export async function waitForVisibleMedia(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
  await expect(page.locator('.page-media-content')).not.toHaveAttribute('inert', '');
}
