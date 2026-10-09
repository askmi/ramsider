import { expect, test } from '@playwright/test';

test('loading status has readable contrast and respects reduced motion', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Hold the actual DOM decode promise after native network loading completes.
  // A separate test covers pending response bytes; this isolates reduced-motion paint.
  await page.addInitScript(() => {
    const qa = window as Window & { releaseMediaDecode?: () => void };
    const held = new Promise<void>(resolve => { qa.releaseMediaDecode = resolve; });
    const decode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = async function () {
      await decode.call(this);
      if (new URL(this.currentSrc || this.src).pathname === '/art/00.webp') await held;
    };
  });
  try {
    await page.goto('/en');
    const status = page.locator('.page-media-overlay .media-loading');
    await expect(status).toBeVisible();
    await expect(status.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    const colors = await status.evaluate(element => {
      const css = (selector: string) => getComputedStyle(element.querySelector(selector)!);
      return { text: getComputedStyle(element).color, surface: getComputedStyle(element.parentElement!).backgroundColor, bar: css('.media-loading__bar').backgroundColor, track: css('.media-loading__track').backgroundColor, animation: css('.media-loading__bar').animationName, opacity: css('.media-loading__bar').opacity };
    });
    const luminance = (color: string) => {
      const [r, g, b] = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
      return r * .2126 + g * .7152 + b * .0722;
    };
    const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
    expect(contrast(colors.text, colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors.bar, colors.track)).toBeGreaterThanOrEqual(3);
    expect(colors.animation).toBe('none');
    expect(colors.opacity).toBe('1');
    await page.screenshot({ path: `${process.env.LOADING_EVIDENCE ?? 'docs/evidence/media-loading'}/${info.project.name}-reduced-motion.png` });
  } finally {
    await page.evaluate(() => (window as Window & { releaseMediaDecode?: () => void }).releaseMediaDecode?.());
  }
  await expect(page.locator('.page-media-overlay')).toHaveCount(0);
});
