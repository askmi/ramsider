import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

// Set viewport to match typical desktop render width
await page.setViewportSize({ width: 1440, height: 3000 });
await page.goto('http://localhost:3002/en');

// Wait for the page to be fully loaded
await page.waitForLoadState('networkidle');

// Scroll to stats section
await page.evaluate(() => {
  const statsSection = document.querySelector('section');
  if (statsSection) {
    statsSection.scrollIntoView({ behavior: 'instant' });
  }
});

// Wait a bit for any animations
await page.waitForTimeout(1000);

// Take full page screenshot
await page.screenshot({ path: 'screenshot-full.png', fullPage: true });

console.log('Screenshot saved to screenshot-full.png');

await browser.close();
