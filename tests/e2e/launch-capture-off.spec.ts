import { test, expect } from '@playwright/test';

test('explicit capture-OFF site retains notices without exposing lead collection', async ({ page }) => {
  test.skip(process.env.LEAD_CAPTURE_OFF_TESTS !== '1', 'Requires explicit capture-OFF build and LEAD_CAPTURE_OFF_TESTS=1.');
  let requests = 0;
  page.on('request', request => { if (request.url().includes('/api/launch-list')) requests++; });
  await page.goto('/en');
  await expect(page.locator('#launch-capture')).toHaveCount(0);
  await expect(page.locator('#launch-floating')).toHaveCount(0);
  await expect(page.locator('[data-launch-open]')).toHaveCount(0);
  await page.locator('#hero-reserve').click();
  await expect(page.locator('#unavailable-commerce')).toContainText('November 20, 2026');
  expect(requests).toBe(0);
});
