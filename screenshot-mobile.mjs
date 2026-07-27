import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
// iPhone 12 Pro size
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:3000/en');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'hero-mobile.png', fullPage: true });
await browser.close();
console.log('Mobile screenshot saved');
