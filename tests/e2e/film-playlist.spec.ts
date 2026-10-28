import { expect, test } from '@playwright/test';
import { silenceTestMedia } from './silent-media';

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => silenceTestMedia(page));
test.setTimeout(120000);

test('playlist preserves playback and presentation; selection requires a second activation', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Mobile WebKit profiles');
  for (const locale of ['en', 'ar']) {
    await page.goto(`/${locale}`);
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click();
    await page.locator('.film-gallery__hero').click();
    const video = page.locator('video'), host = page.locator('#film-player');
    await expect(host).toHaveAttribute('data-controls', 'ready');
    await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused && (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
    await page.locator('.film-fullscreen').click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement) || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
    await host.evaluate(el => el.removeAttribute('userinactive'));
    const toggle = page.locator('.film-player__list-toggle');
    await toggle.click();
    const list = page.locator('#film-playlist');
    await expect(list).toBeVisible();
    await expect(list.locator('.film-playlist__item')).toHaveCount(7);
    await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused)).toBe(true);
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement) || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
    const titleBounds = await page.locator('.film-player__identity').boundingBox();
    const listBounds = await toggle.boundingBox();
    expect(titleBounds).not.toBeNull(); expect(listBounds).not.toBeNull();
    if (locale === 'ar') expect(titleBounds!.x).toBeGreaterThan(listBounds!.x);
    else expect(titleBounds!.x).toBeLessThan(listBounds!.x);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshots/video/playlist-${info.project.name}-${locale}.png` });
    const initialSource = await video.getAttribute('data-src');
    const target = list.locator('.film-playlist__item').nth(1);
    await target.click();
    await expect(target).toHaveAttribute('aria-pressed', 'true');
    await expect(video).toHaveAttribute('data-src', initialSource!);
    await target.click();
    await expect(list).toHaveCount(0);
    await expect(page.locator('.film-player__identity')).toHaveText('Pure Gold');
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement) || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
    await host.evaluate(el => el.removeAttribute('userinactive'));
    await toggle.click();
    await expect(page.locator('#film-playlist')).toBeVisible();
    const current = page.locator('.film-playlist__item').nth(1);
    const before = await video.evaluate(v => (v as HTMLVideoElement).currentTime);
    await current.click(); await current.click();
    await expect(page.locator('#film-playlist')).toHaveCount(0);
    await expect(video).toBeFocused();
    expect(await video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeGreaterThanOrEqual(before);
    await host.evaluate(el => el.removeAttribute('userinactive'));
    await toggle.click();
    await expect(page.locator('#film-playlist')).toBeVisible();
    await page.locator('.film-playlist__close').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#film-playlist')).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused)).toBe(true);
    // Selecting another film changes the title before its metadata arrives.
    await expect.poll(() => video.evaluate(v => { const m = v as HTMLVideoElement; return m.currentSrc.includes('/pure-gold/') && m.readyState >= 1 && Number.isFinite(m.duration) && m.duration > 0 && Number.isFinite(m.currentTime); }), { timeout: 30000 }).toBe(true);
    await video.evaluate(v => { const m = v as HTMLVideoElement; m.currentTime = Math.max(0, m.duration - 2); });
    const replay = page.locator('.film-ended__replay');
    await expect(replay).toBeVisible({ timeout: 30000 });
    // Native HLS quality switching can seek just before the end and clear
    // video.ended while the end screen remains visible.
    await video.evaluate(async v => {
      const m = v as HTMLVideoElement, target = m.duration - .1;
      Object.defineProperty(m, 'ended', { configurable: true, get: () => false });
      m.dataset.filmSourceSwitch = 'true'; m.dataset.filmSourceSwitchTarget = String(target);
      await new Promise<void>(resolve => { m.addEventListener('seeked', () => resolve(), { once: true }); m.currentTime = target; });
      delete m.dataset.filmSourceSwitch; delete m.dataset.filmSourceSwitchTarget;
    });
    await expect(replay).toBeVisible();
    const replayBounds = await replay.boundingBox();
    expect(replayBounds!.width).toBeGreaterThanOrEqual(44); expect(replayBounds!.height).toBeGreaterThanOrEqual(44);
    expect(await replay.evaluate(el => document.elementFromPoint(el.getBoundingClientRect().x + el.clientWidth / 2, el.getBoundingClientRect().y + el.clientHeight / 2)?.closest('.film-ended__replay') === el)).toBe(true);
    await host.evaluate(el => el.removeAttribute('userinactive'));
    await toggle.click();
    await expect(page.locator('#film-playlist')).toBeVisible();
    const endedCurrent = page.locator('.film-playlist__item').nth(1);
    await endedCurrent.click(); await endedCurrent.click();
    await expect(page.locator('#film-playlist')).toHaveCount(0);
    await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused), { timeout: 30000 }).toBe(true);
    await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime)).toBeLessThan(3);
    await video.evaluate(v => { const m = v as HTMLVideoElement; Reflect.deleteProperty(m, 'ended'); m.currentTime = m.duration; });
    await expect(replay).toBeVisible({ timeout: 30000 });
    await replay.focus(); await page.keyboard.press('Enter');
    await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused), { timeout: 30000 }).toBe(true);
    await host.evaluate(el => el.removeAttribute('userinactive'));
    await page.locator('.film-player__close').click();
  }
});

test('ended state has only an actionable replay button across orientations', async ({ page }, info) => {
  test.skip(!info.project.name.includes('iphone'), 'Mobile WebKit profiles');
  const max = info.project.name.includes('max');
  for (const viewport of [max ? { width: 440, height: 956 } : { width: 402, height: 874 }, max ? { width: 956, height: 440 } : { width: 874, height: 402 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/en');
    await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
    const video = page.locator('video'), host = page.locator('#film-player');
    await expect(host).toHaveAttribute('data-controls', 'ready');
    await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
    await video.evaluate(v => { const m = v as HTMLVideoElement; m.currentTime = m.duration; });
    const replay = page.locator('.film-ended__replay');
    await expect(replay).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.film-ended')).toHaveText('');
    const bounds = await replay.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(44); expect(bounds!.height).toBeGreaterThanOrEqual(44);
    const hostBounds = await host.boundingBox();
    expect(Math.abs(bounds!.x + bounds!.width / 2 - (hostBounds!.x + hostBounds!.width / 2))).toBeLessThan(2);
    expect(Math.abs(bounds!.y + bounds!.height / 2 - (hostBounds!.y + hostBounds!.height / 2))).toBeLessThan(2);
    expect(await replay.evaluate(el => document.elementFromPoint(el.getBoundingClientRect().x + el.clientWidth / 2, el.getBoundingClientRect().y + el.clientHeight / 2)?.closest('.film-ended__replay') === el)).toBe(true);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `screenshots/video/ended-${info.project.name}-${viewport.width}.png` });
    await host.evaluate(el => el.removeAttribute('userinactive'));
    await page.locator('.film-player__list-toggle').click(); await expect(page.locator('#film-playlist')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.locator('#film-playlist')).toHaveCount(0);
    await replay.focus(); await page.keyboard.press('Enter');
    await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused), { timeout: 30000 }).toBe(true);
    await host.evaluate(el => el.removeAttribute('userinactive'));
    await page.locator('.film-player__close').click();
  }
});

test('desktop playlist and ended replay remain clickable in fullscreen', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Desktop Chromium owner');
  await page.goto('/en'); await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  const video = page.locator('video'), host = page.locator('#film-player');
  await expect(host).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
  await page.locator('.film-fullscreen').click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement) || document.querySelector('#film-player')?.getAttribute('data-full-window') === 'true')).toBe(true);
  await video.evaluate(v => { const m = v as HTMLVideoElement; m.currentTime = m.duration; });
  const replay = page.locator('.film-ended__replay'); await expect(replay).toBeVisible({ timeout: 30000 });
  expect(await replay.evaluate(el => document.elementFromPoint(el.getBoundingClientRect().x + el.clientWidth / 2, el.getBoundingClientRect().y + el.clientHeight / 2)?.closest('.film-ended__replay') === el)).toBe(true);
  await host.evaluate(el => el.removeAttribute('userinactive'));
  await page.locator('.film-player__list-toggle').click(); await expect(page.locator('#film-playlist')).toBeVisible();
  await page.screenshot({ path: 'screenshots/video/playlist-desktop.png' });
  await page.keyboard.press('Escape'); await expect(page.locator('#film-playlist')).toHaveCount(0);
  await replay.click(); await expect.poll(() => video.evaluate(v => !(v as HTMLVideoElement).paused), { timeout: 30000 }).toBe(true);
  await host.evaluate(el => el.removeAttribute('userinactive'));
  await page.locator('.film-player__close').click();
});

test('playlist remains inside short players and the seventh item is reachable', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'Short-viewport Chromium owner');
  for (const viewport of [{ width: 510, height: 900 }, { width: 320, height: 240 }, { width: 640, height: 260 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/en'); await page.locator('#film-play').scrollIntoViewIfNeeded();
    await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
    const host = page.locator('#film-player');
    await expect(host).toHaveAttribute('data-controls', 'ready');
    await page.locator('.film-player__identity').evaluate(el => { el.textContent = 'A Very Long Film Title That Wraps Across Multiple Lines When Space Is Limited'; });
    await host.evaluate(el => el.removeAttribute('userinactive'));
    await page.locator('.film-player__list-toggle').click();
    const panel = page.locator('#film-playlist'), list = page.locator('.film-playlist__items'), last = list.locator('button').last();
    await expect(panel).toBeVisible();
    const panelBounds = await panel.boundingBox(), hostBounds = await host.boundingBox();
    expect(panelBounds!.y).toBeGreaterThanOrEqual(hostBounds!.y - 1);
    expect((panelBounds!.y + panelBounds!.height)).toBeLessThanOrEqual(hostBounds!.y + hostBounds!.height + 1);
    await last.scrollIntoViewIfNeeded();
    expect(await list.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    const hit = await last.evaluate(el => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.film-playlist__item') === el; });
    expect(hit).toBe(true);
    await page.screenshot({ path: `screenshots/video/playlist-short-${viewport.width}x${viewport.height}.png` });
    await last.click(); await expect(last).toHaveAttribute('aria-pressed', 'true');
    await last.click(); await expect(panel).toHaveCount(0);
    await expect(page.locator('.film-player__identity')).toHaveText('Inside Ramsider');
    await host.evaluate(el => el.removeAttribute('userinactive'));
    await page.locator('.film-player__close').click();
  }
});


test('current playlist item recovers a terminal source error', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'Native WebKit recovery owner');
  await page.goto('/en'); await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  const video = page.locator('video'), host = page.locator('#film-player');
  await expect(host).toHaveAttribute('data-controls', 'ready');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
  await video.evaluate(v => { const media = v as HTMLVideoElement; media.pause(); media.removeAttribute('src'); media.load(); media.dispatchEvent(new CustomEvent('film-status', { detail: 'error' })); });
  await expect(video).not.toHaveAttribute('src');
  await expect(page.locator('.film-recovery')).toBeVisible();
  await host.evaluate(el => el.removeAttribute('userinactive'));
  await page.locator('.film-player__list-toggle').click();
  const current = page.locator('.film-playlist__item').first();
  await current.click(); await current.click();
  await expect(page.locator('#film-playlist')).toHaveCount(0);
  await expect.poll(() => video.evaluate(v => { const m = v as HTMLVideoElement; return m.hasAttribute('src') && !m.paused && m.currentTime > .2; }), { timeout: 30000 }).toBe(true);
  await expect(page.locator('.film-recovery')).toBeHidden();
  await host.evaluate(el => el.removeAttribute('userinactive'));
  await page.locator('.film-player__close').click();
});

test('replaying the current film cancels a pending native quality position restore', async ({ page }, info) => {
  test.skip(info.project.name !== 'iphone-17-pro-webkit', 'Native WebKit quality-switch owner');
  await page.goto('/en'); await page.locator('#film-play').scrollIntoViewIfNeeded();
  await page.locator('#film-play').click(); await page.locator('.film-gallery__hero').click();
  const video = page.locator('video'), host = page.locator('#film-player');
  await expect(host).toHaveAttribute('data-controls', 'ready');
  await expect(video).toHaveAttribute('data-playback', 'native-hls');
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).currentTime > .2), { timeout: 30000 }).toBe(true);
  await video.evaluate(v => { const m = v as HTMLVideoElement; m.currentTime = m.duration; });
  await expect(page.locator('.film-ended__replay')).toBeVisible({ timeout: 30000 });
  // Hold only the newly registered quality-restoration callback while the new
  // source obtains metadata; this makes the native race deterministic.
  await video.evaluate(v => {
    const m = v as HTMLVideoElement, add = m.addEventListener.bind(m), remove = m.removeEventListener.bind(m);
    const pending: (() => void)[] = [];
    (window as unknown as { filmQualityRestore: (() => void)[] }).filmQualityRestore = pending;
    Object.defineProperty(m, 'addEventListener', { configurable: true, value: (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (type !== 'loadedmetadata' || typeof listener !== 'function') { add(type, listener, options); return; }
      const wrapped = (event: Event) => { remove(type, wrapped, options); pending.push(() => listener.call(m, event)); };
      add(type, wrapped, options);
    } });
  });
  await host.evaluate(el => el.removeAttribute('userinactive'));
  await page.locator('#film-settings-toggle').click();
  await page.locator('.film-menu-quality').click();
  await page.locator('#film-quality-options media-chrome-menu-item[value="360"]').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { filmQualityRestore: (() => void)[] }).filmQualityRestore.length), { timeout: 30000 }).toBeGreaterThan(0);
  expect(await video.evaluate(v => (v as HTMLVideoElement).dataset.filmSourceSwitch)).toBe('true');
  await expect(page.locator('.film-ended__replay')).toBeVisible();
  await host.evaluate(el => el.removeAttribute('userinactive'));
  await page.locator('.film-player__list-toggle').click();
  const current = page.locator('.film-playlist__item').first(); await current.click(); await current.click();
  await expect(page.locator('#film-playlist')).toHaveCount(0);
  await video.evaluate(v => { Reflect.deleteProperty(v, 'addEventListener'); (window as unknown as { filmQualityRestore: (() => void)[] }).filmQualityRestore.splice(0).forEach(fn => fn()); });
  await expect.poll(() => video.evaluate(v => { const m = v as HTMLVideoElement; return !m.paused && m.currentTime > .2 && m.currentTime < 5; }), { timeout: 30000 }).toBe(true);
  await host.evaluate(el => el.removeAttribute('userinactive'));
  await page.locator('.film-player__close').click();
});
