import { expect, type Locator, type Page } from '@playwright/test';
import { waitForVisibleMedia } from './media';

/** Auto-scroll can expose pending page art: finish that barrier before activating a control. */
export async function openTechnology(page: Page, trigger: Locator = page.locator('[data-technology-open]').first()) {
  await trigger.scrollIntoViewIfNeeded();
  await waitForVisibleMedia(page);
  await trigger.click();
  await expect(page.locator('#technology-viewer')).toBeVisible();
}
