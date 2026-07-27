import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 605, height: 1280 });
await page.goto('http://localhost:3000/en');
await page.waitForTimeout(2000);
await page.screenshot({ path: 'screenshot-605-full.png', fullPage: true });
await browser.close();
console.log('Full page screenshot saved');
