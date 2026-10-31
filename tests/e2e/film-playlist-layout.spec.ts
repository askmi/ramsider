import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { silenceTestMedia } from './silent-media';
import { emulateCustomFullscreenLayout } from './fullscreen-layout-adapter';

test.use({ serviceWorkers: 'block' });
test.setTimeout(150000);
const root = 'screenshots/video/chg0169';
async function open(page: Page, locale: string) {
  await silenceTestMedia(page);
  await page.goto(`/${locale}`);
  await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click();
  await page.locator('.film-gallery__hero').click();
  await expect(page.locator('#film-player')).toHaveAttribute('data-controls', 'ready', { timeout: 30000 });
  await expect.poll(() => page.locator('video').evaluate(v => (v as HTMLVideoElement).currentTime), { timeout: 30000 }).toBeGreaterThan(.2);
  await page.locator('video').evaluate(v => (v as HTMLVideoElement).pause());
  await page.evaluate(() => document.fonts.ready);
}
async function transport(page: Page) {
  await expect.poll(() => page.locator('.film-transport').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  await page.waitForTimeout(200);
  const frame = (await page.locator('#film-player').boundingBox())!;
  const seek = (await page.locator('.film-seek').boundingBox())!;
  const time = await page.locator('.film-time').boundingBox();
  const play = (await page.locator('.film-play-toggle').boundingBox())!;
  if (frame.width <= 560) {
    expect(seek.width).toBeGreaterThanOrEqual(frame.width - 6);
    if (frame.width < 320) await expect(page.locator('.film-time')).toBeHidden();
    else {
      expect(time!.y).toBeGreaterThanOrEqual(seek.y + seek.height - 1);
      expect(Math.abs(time!.x + time!.width / 2 - frame.x - frame.width / 2)).toBeLessThanOrEqual(1);
      expect(Math.abs(time!.y - play.y)).toBeLessThanOrEqual(1);
      const measured = await page.locator('.film-time').evaluate(el => {
        const text = el.shadowRoot?.textContent?.trim() ?? '';
        return { text, overflow: el.scrollWidth > el.clientWidth + 1 };
      });
      expect(measured.overflow).toBe(false);
    }
  } else expect(Math.abs(play.y - seek.y)).toBeLessThanOrEqual(2);
  for (const selector of ['.film-previous', '.film-play-toggle', '.film-next', '.film-mute-toggle', '.film-options__trigger', '.film-fullscreen']) {
    const b = (await page.locator(selector).boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44);
    expect(b.x).toBeGreaterThanOrEqual(frame.x - 1); expect(b.x + b.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
    expect(Math.abs(b.y - play.y)).toBeLessThanOrEqual(1);
    if (frame.width >= 320 && frame.width <= 560) expect(b.x + b.width <= time!.x + 1 || b.x >= time!.x + time!.width - 1).toBe(true);
  }
}
async function playlist(page: Page, name: string) {
  await page.locator('.film-player__list-toggle').click();
  const panel = page.locator('#film-playlist'), host = page.locator('#film-player'), close = page.locator('.film-player__close');
  await expect(panel).toBeVisible();
  await expect(panel.locator('button')).toHaveCount(7);
  await expect(page.locator('.film-playlist__header,.film-playlist__close')).toHaveCount(0);
  const pb = (await panel.boundingBox())!, hb = (await host.boundingBox())!;
  if (hb.width <= 560) { expect(Math.abs(pb.width - hb.width)).toBeLessThanOrEqual(1); expect(Math.abs(pb.x - hb.x)).toBeLessThanOrEqual(1); }
  else { expect(pb.width / hb.width).toBeGreaterThanOrEqual(1 / 3 - .01); expect(pb.width / hb.width).toBeLessThanOrEqual(.5); }
  expect(Math.abs(pb.y - hb.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(pb.y + pb.height - hb.y - hb.height)).toBeLessThanOrEqual(1);
  for (const selector of ['.film-player__list-toggle', '.film-play-toggle', '.film-seek', '.film-options__trigger']) {
    expect(await page.locator(selector).evaluate(el => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return hit === el || el.contains(hit); }), selector).toBe(true);
  }
  const alpha = await panel.evaluate(el => Number(getComputedStyle(el).backgroundColor.match(/[\d.]+/g)?.at(-1)));
  expect(alpha).toBeGreaterThan(.9); expect(alpha).toBeLessThan(1);
  expect(await close.evaluate(el => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.film-player__close') === el; })).toBe(true);
  await expect.poll(() => panel.locator('img').evaluateAll(imgs => imgs.every(el => { const img = el as HTMLImageElement; return img.complete && img.naturalWidth > 0; })), { timeout: 30000 }).toBe(true);
  await mkdir(root, { recursive: true });
  await page.screenshot({ path: `${root}/${name}-playlist.png` });
  const last = panel.locator('button').last(); await last.scrollIntoViewIfNeeded();
  expect(await last.evaluate(el => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.film-playlist__item') === el; })).toBe(true);
  await page.keyboard.press('Escape'); await expect(panel).toHaveCount(0); await expect(page.locator('.film-player__list-toggle')).toBeFocused();
}
for (const locale of ['en', 'ar']) {
  test(`${locale}: full seek, centred time and translucent adaptive playlist`, async ({ page }, info) => {
    test.skip(!info.project.name.includes('iphone'), 'Required Pro/Max mobile WebKit');
    await emulateCustomFullscreenLayout(page);
    await open(page, locale);
    test.skip(locale === 'ar' && new URL(page.url()).pathname === '/en', 'Arabic runtime is disabled by English-only presentation');
    const max = info.project.name.includes('max');
    for (const [mode, size] of [['portrait', max ? { width: 440, height: 956 } : { width: 402, height: 874 }], ['landscape', max ? { width: 956, height: 440 } : { width: 874, height: 402 }]] as const) {
      await page.setViewportSize(size);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      if (await page.locator('#film-player').getAttribute('data-full-window')) { await page.locator('.film-fullscreen').click(); await expect(page.locator('#film-player')).not.toHaveAttribute('data-full-window'); }
      expect(await page.evaluate(() => [innerWidth, devicePixelRatio])).toEqual([size.width, 3]);
      await transport(page);
      await mkdir(root, { recursive: true });
      await page.screenshot({ path: `${root}/${info.project.name}-${locale}-${mode}-transport.png` });
      await playlist(page, `${info.project.name}-${locale}-${mode}`);
      await page.locator('.film-fullscreen').click();
      await expect(page.locator('#film-player')).toHaveAttribute('data-element-fullscreen', 'true');
      await transport(page); await playlist(page, `${info.project.name}-${locale}-${mode}-fullscreen-adapter`);
      await page.locator('.film-fullscreen').click();
    }
    // Pointer outside dismisses only the playlist; the one Close still closes playback.
    await page.locator('.film-player__list-toggle').click();
    await page.locator('.film-play-toggle').click(); await expect(page.locator('#film-playlist')).toHaveCount(0);
    await page.locator('.film-player__list-toggle').click(); await page.locator('.film-player__close').click();
    await expect(page.locator('#product-film')).not.toHaveAttribute('open');
  });
}

test('compact and wide actual fullscreen keep timeline, time and sole Close usable', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Real Chromium element fullscreen');
  await open(page, 'en');
  for (const size of [{ width: 280, height: 240 }, { width: 320, height: 240 }, { width: 560, height: 320 }, { width: 561, height: 320 }, { width: 768, height: 600 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(size); await page.locator('.film-fullscreen').click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement?.id)).toBe('film-player');
    await transport(page);
    if (size.width === 320) {
      // Actual seven-film durations; exercise their longest visible elapsed labels.
      for (const duration of [60.04, 22.88, 113.64, 38.4, 126.08, 82.36, 60.977583]) {
        const measured = await page.locator('.film-time').evaluate((el, duration) => {
          const time = el as HTMLElement & { mediaDuration: number; mediaCurrentTime: number };
          time.mediaDuration = duration; time.mediaCurrentTime = Math.floor(duration);
          const slot = time.shadowRoot!.querySelector('slot')!;
          const range = document.createRange(); range.selectNodeContents(slot);
          const glyph = range.getBoundingClientRect(), frame = time.getBoundingClientRect();
          return { text: slot.textContent, width: glyph.width, available: frame.width, centre: glyph.x + glyph.width / 2 - frame.x - frame.width / 2 };
        }, duration);
        expect(measured.text).toMatch(/\d+:\d+.*\/.*\d+:\d+/);
        expect(measured.width).toBeLessThanOrEqual(measured.available + 1);
        expect(Math.abs(measured.centre)).toBeLessThanOrEqual(1);
      }
    }
    await playlist(page, `chromium-${size.width}x${size.height}`);
    await page.locator('.film-fullscreen').click();
  }
});

test('all eleven locales have a full-width narrow playlist with no extra heading or Close', async ({ context }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'One Pro locale matrix owner');
  for (const locale of ['en', 'ru', 'de', 'fr', 'es', 'it', 'tr', 'ar', 'zh', 'ja', 'ko']) {
    const page = await context.newPage(); await open(page, locale); await transport(page);
    await page.locator('.film-player__list-toggle').click();
    await expect(page.locator('.film-playlist__header,.film-playlist__close')).toHaveCount(0);
    const hb = (await page.locator('#film-player').boundingBox())!, pb = (await page.locator('#film-playlist').boundingBox())!;
    expect(Math.abs(hb.width - pb.width)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.close();
  }
});
