import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'iphone-17-pro-webkit',
      use: { browserName: 'webkit', userAgent: devices['iPhone 17 Pro'].userAgent, viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    },
    {
      name: 'iphone-17-pro-max-webkit',
      use: { browserName: 'webkit', userAgent: devices['iPhone 17 Pro Max'].userAgent, viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    },
    {
      name: 'desktop-chromium',
      use: { browserName: 'chromium', launchOptions: { args: ['--mute-audio'] }, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'desktop-firefox',
      use: { browserName: 'firefox', viewport: { width: 1440, height: 900 } },
    },
  ],
});
