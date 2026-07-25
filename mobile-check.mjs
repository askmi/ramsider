import puppeteer from 'puppeteer'

const url = 'http://localhost:3000/en'

;(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  // Set mobile viewport
  await page.setViewport({
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  })

  await page.goto(url, { waitUntil: 'networkidle2' })

  // Take screenshots of different sections
  await page.screenshot({ path: 'mobile-hero.png', fullPage: false })

  // Scroll and capture more sections
  await page.evaluate(() => window.scrollBy(0, 600))
  await page.screenshot({ path: 'mobile-business.png', fullPage: false })

  await page.evaluate(() => window.scrollBy(0, 600))
  await page.screenshot({ path: 'mobile-products.png', fullPage: false })

  // Full page screenshot
  await page.screenshot({ path: 'mobile-full.png', fullPage: true })

  console.log('Mobile screenshots captured')

  await browser.close()
})()
