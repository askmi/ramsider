import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1080 });
await page.goto('http://localhost:3000/en');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'hero-screenshot.png', fullPage: false });
await browser.close();
console.log('Screenshot saved');
