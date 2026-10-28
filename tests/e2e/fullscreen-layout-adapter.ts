import type { Page } from '@playwright/test';

/** Mobile Playwright WebKit cannot present native fullscreen. This adapter tests
 * custom HTML layout/lifecycle only; it is never proof of Safari system chrome. */
export async function emulateCustomFullscreenLayout(page: Page) {
  await page.addInitScript(() => {
    let active: Element | null = null;
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true });
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => active });
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { configurable: true, value: function (this: HTMLElement) {
      // Native fullscreen stores the receiving element identity.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      active = this;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    } });
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: () => {
      active = null;
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    } });
  });
}
