'use client';

import { useEffect, useLayoutEffect, useRef, useState, type RefObject, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { MediaControlBar, MediaPlayButton, MediaMuteButton, MediaTimeRange, MediaTimeDisplay, MediaVolumeRange, MediaLoadingIndicator } from 'media-chrome/react';
import { MediaSettingsMenu, MediaSettingsMenuButton, MediaSettingsMenuItem, MediaChromeMenu, MediaChromeMenuItem } from 'media-chrome/react/menu';
import { addTranslation, setLanguage } from 'media-chrome/utils/i18n';
import type { MediaSettingsMenu as SettingsElement } from 'media-chrome/menu/media-settings-menu';
import type { MediaSettingsMenuButton as SettingsButtonElement } from 'media-chrome/menu/media-settings-menu-button';
import type { FilmCopy } from '@/lib/product-film';
import type { Locale } from '@/lib/i18n';
import { filmControlsCopy, type FilmControlsCopy } from '@/lib/film-controls-copy';
import { galleryCopy } from '@/lib/film-gallery-copy';
import { isIPhone, iphonePlayerMode } from '@/lib/film-presentation';
import { selectFilmQuality, selectFilmRate, playProductFilm, cancelFilmSourceSwitch, type FilmSettings } from '@/lib/film-playback';

type PipVideo = HTMLVideoElement & {
  webkitSupportsPresentationMode?: (mode: string) => boolean;
  webkitSetPresentationMode?: (mode: string) => void;
  webkitPresentationMode?: string;
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
  webkitSupportsFullscreen?: boolean;
};
type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type FullscreenHost = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type WindowEntry = 'toggle' | 'rotation' | 'recovery';

function activeFullscreenElement() {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}
async function exitElementFullscreen() {
  const doc = document as FullscreenDocument;
  if (doc.fullscreenElement && typeof doc.exitFullscreen === 'function') await doc.exitFullscreen();
  else if (doc.webkitFullscreenElement && typeof doc.webkitExitFullscreen === 'function') await doc.webkitExitFullscreen();
}
async function enterElementFullscreen(host: HTMLElement) {
  const target = host as FullscreenHost;
  if (typeof target.requestFullscreen === 'function' && document.fullscreenEnabled !== false) {
    await target.requestFullscreen();
    return;
  }
  if (typeof target.webkitRequestFullscreen !== 'function') throw new Error('Element fullscreen unavailable');
  // Older WebKit returns void and signals completion with an event instead of a promise.
  await new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); document.removeEventListener('webkitfullscreenchange', changed); document.removeEventListener('webkitfullscreenerror', failed); };
    const changed = () => { if (activeFullscreenElement() === host) { cleanup(); resolve(); } };
    const failed = () => { cleanup(); reject(new Error('Element fullscreen rejected')); };
    document.addEventListener('webkitfullscreenchange', changed);
    document.addEventListener('webkitfullscreenerror', failed);
    const timer = setTimeout(failed, 3000);
    try {
      const result = target.webkitRequestFullscreen!();
      if (result && typeof result.then === 'function') void result.then(changed, failed);
      changed();
    } catch { failed(); }
  });
}
export type FilmControlsProps = { media: RefObject<HTMLVideoElement | null>; stage: RefObject<HTMLElement | null>; copy: FilmCopy; locale: Locale; status: 'idle' | 'loading' | 'ready' | 'blocked' | 'error'; previous: () => void; next: () => void; hasPrevious: boolean; hasNext: boolean };
function preserveButtonActivation(event: ReactKeyboardEvent<HTMLButtonElement>) {
  if (event.key === ' ' || event.key === 'Enter') event.stopPropagation();
}
const speeds = [.5, .75, 1, 1.25, 1.5, 2];
function dismissSettings(menu: RefObject<SettingsElement | null>, gear: RefObject<SettingsButtonElement | null>, stage: RefObject<HTMLElement | null>, restoreFocus = true) {
  menu.current?.querySelectorAll<HTMLElement>('media-chrome-menu').forEach(submenu => { submenu.hidden = true; });
  if (menu.current) menu.current.hidden = true;
  stage.current?.removeAttribute('userinactive');
  if (restoreFocus) gear.current?.focus({ preventScroll: true });
}


function translate(locale: Locale, c: FilmControlsCopy, copy: FilmCopy) {
  const unit = (name: 'hour' | 'minute' | 'second') => new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'narrow' }).formatToParts(1).filter(part => part.type === 'unit').map(part => part.value).join('');
  addTranslation(locale, {
    hour: unit('hour'), hours: unit('hour'), minute: unit('minute'), minutes: unit('minute'), second: unit('second'), seconds: unit('second'),
    Play: c.play, play: c.play, Pause: c.pause, pause: c.pause,
    Mute: c.mute, mute: c.mute, Unmute: c.unmute, unmute: c.unmute,
    seek: c.seek, volume: c.volume, Settings: copy.options, settings: copy.options,
    Quality: copy.quality, quality: copy.quality, Auto: copy.auto,
    'Playback rate': copy.speed, 'current playback rate': copy.speed,
    'Enter fullscreen mode': c.fullscreen, 'enter fullscreen mode': c.fullscreen,
    'Exit fullscreen mode': c.exitFullscreen, 'exit fullscreen mode': c.exitFullscreen,
    'Enter picture in picture mode': c.pip, 'enter picture in picture mode': c.pip,
    'Exit picture in picture mode': c.exitPip, 'exit picture in picture mode': c.exitPip,
    'playback time': c.seek, 'video player': copy.title, 'media loading': copy.loading,
    'video not loaded, unknown time.': copy.loading, '{currentTime} of {totalTime}': '{currentTime} / {totalTime}',
  });
  setLanguage(locale);
}

/** Media Chrome owns transport, menu selection and keyboard semantics; our adapter owns HLS intent. */
export function FilmControls({ media, stage, copy, locale, status, previous, next, hasPrevious, hasNext }: FilmControlsProps) {
  const menu = useRef<SettingsElement>(null);
  const presentationEpoch = useRef(0);
  const fullscreenBusy = useRef(false);
  const fullscreenOwner = useRef<number | null>(null);
  const nativeRequest = useRef<{ epoch: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const nativeGuarded = useRef(false);
  const nativeGesture = useRef<{ epoch: number; until: number } | null>(null);
  const nativeActive = useRef(false);
  const orientationOwner = useRef<number | null>(null);
  const windowOrigin = useRef<WindowEntry | null>(null);
  const rotationSuppressed = useRef(false);
  const nativeRecovery = useRef<number | null>(null);
  const windowRecoverySuppressed = useRef(false);
  const pipOwner = useRef<number | null>(null);
  const pipRequestSequence = useRef(0);
  const gear = useRef<SettingsButtonElement>(null);
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<FilmSettings>({ available: [], selected: null, adaptive: true });
  const [rate, setRate] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [pip, setPip] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [message, setMessage] = useState('');
  const iphone = ready && isIPhone();
  const c = filmControlsCopy(locale);
  const closeMenu = () => dismissSettings(menu, gear, stage);
  const actions = useRef<{ fullscreen: (forceNative?: boolean, entry?: WindowEntry) => Promise<void>; pip: () => Promise<void> } | null>(null);

  const leaveWindow = () => {
    const host = stage.current;
    windowOrigin.current = null;
    host?.removeAttribute('data-full-window');
    host?.removeAttribute('data-element-fullscreen');
    host?.closest('dialog')?.removeAttribute('data-film-expanded');
    setExpanded(false);
  };

  const releaseOrientation = () => {
    if (orientationOwner.current === null) return;
    orientationOwner.current = null;
    try { screen.orientation?.unlock?.(); } catch { /* The browser may not expose orientation control. */ }
  };

  useEffect(() => {
    let alive = true;
    translate(locale, filmControlsCopy(locale), copy);
    void customElements.whenDefined('media-controller').then(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [locale, copy]);

  useEffect(() => {
    const video = media.current as PipVideo | null, host = stage.current;
    if (!ready || !video || !host) return;
    // The custom element must have upgraded and found this SAME slotted video before native controls are hidden.
    if (!customElements.get('media-controller') || (host as HTMLElement & { media?: HTMLVideoElement }).media !== video) return;
    // A partially constructed widget must not take working browser controls away.
    const requiredControls = ['media-play-button', 'media-time-range', 'media-settings-menu-button', 'media-settings-menu'];
    if (requiredControls.some(selector => !host.querySelector(selector)?.shadowRoot)) return;
    const update = (event: Event) => setSettings((event as CustomEvent<FilmSettings>).detail);
    const syncRate = () => setRate(video.playbackRate);
    const syncPip = () => {
      setPipSupported(Boolean(document.pictureInPictureEnabled && typeof video.requestPictureInPicture === 'function' && !video.disablePictureInPicture) || Boolean(video.webkitSupportsPresentationMode?.('picture-in-picture')));
      setPip(document.pictureInPictureElement === video || video.webkitPresentationMode === 'picture-in-picture');
    };
    const initialFrame = requestAnimationFrame(() => {
      const initial = video.dataset.qualityMode;
      const qualities = JSON.parse(host.dataset.qualities ?? '[]') as number[];
      setSettings({ available: video.dataset.playback === 'mp4-fallback' ? [720] : qualities, selected: initial && initial !== 'auto' ? Number(initial) : null, adaptive: video.dataset.delivery !== 'original' && video.dataset.playback !== 'mp4-fallback' });
      syncRate(); syncPip();
    });
    video.addEventListener('film-settings', update); video.addEventListener('ratechange', syncRate);
    for (const event of ['loadedmetadata', 'enterpictureinpicture', 'leavepictureinpicture', 'webkitpresentationmodechanged']) video.addEventListener(event, syncPip);
    video.removeAttribute('controls'); host.removeAttribute('gesturesdisabled'); host.removeAttribute('nohotkeys'); host.setAttribute('data-controls', 'ready');
    return () => {
      cancelAnimationFrame(initialFrame);
      video.setAttribute('controls', ''); host.setAttribute('gesturesdisabled', ''); host.setAttribute('nohotkeys', ''); host.removeAttribute('data-controls');
      video.removeEventListener('film-settings', update); video.removeEventListener('ratechange', syncRate);
      for (const event of ['loadedmetadata', 'enterpictureinpicture', 'leavepictureinpicture', 'webkitpresentationmodechanged']) video.removeEventListener(event, syncPip);
    };
  }, [ready, media, stage]);

  useEffect(() => {
    const host = stage.current, dialog = host?.closest('dialog'), video = media.current as PipVideo | null;
    if (!host || !dialog || !video) return;
    const sync = () => setExpanded(host.hasAttribute('data-full-window') || activeFullscreenElement() === host || Boolean(video.webkitDisplayingFullscreen));
    const collapse = () => {
      presentationEpoch.current++; fullscreenBusy.current = false; fullscreenOwner.current = null; nativeActive.current = false; pipOwner.current = null; setMessage('');
      releaseOrientation();
      windowOrigin.current = null; nativeRecovery.current = null;
      windowRecoverySuppressed.current = dialog.open;
      rotationSuppressed.current = dialog.open && window.matchMedia('(orientation: landscape)').matches;
      const video = media.current as PipVideo | null;
      if (video && document.pictureInPictureElement === video) void document.exitPictureInPicture().catch(() => {});
      if (video?.webkitPresentationMode === 'picture-in-picture') video.webkitSetPresentationMode?.('inline');
      menu.current?.querySelectorAll<HTMLElement>('media-chrome-menu').forEach(submenu => { submenu.hidden = true; });
      host.removeAttribute('data-full-window'); host.removeAttribute('data-element-fullscreen'); dialog.removeAttribute('data-film-expanded'); setExpanded(false);
      nativeGesture.current = null;
      if (nativeRequest.current) {
        nativeGuarded.current = true; clearTimeout(nativeRequest.current.timer);
        nativeRequest.current = null;
      }
      if (video?.webkitDisplayingFullscreen) video.webkitExitFullscreen?.();
      if (activeFullscreenElement() === host) void exitElementFullscreen().catch(() => {});
      if (menu.current) menu.current.hidden = true;
    };
    const cancel = (event: Event) => {
      if (host.hasAttribute('data-full-window') || activeFullscreenElement() === host || video.webkitDisplayingFullscreen) { event.preventDefault(); collapse(); host.querySelector<HTMLElement>('.film-fullscreen')?.focus({ preventScroll: true }); }
    };
    const nativeInput = (event: Event) => {
      if (!event.isTrusted || !dialog.open || dialog.dataset.view === 'gallery') return;
      // Native controls are in a closed UA shadow tree. A trusted video-control
      // input or a two-finger pinch authorizes their following presentation event.
      if (isIPhone() && iphonePlayerMode() === 'window') return;
      const pinch = event.type === 'touchstart' && (event as TouchEvent).touches.length >= 2;
      if (pinch || video.controls) nativeGesture.current = { epoch: presentationEpoch.current, until: performance.now() + 1500 };
    };
    const nativeBegin = () => {
      const request = nativeRequest.current;
      if (request) clearTimeout(request.timer);
      nativeRequest.current = null; fullscreenBusy.current = false;
      const gesture = nativeGesture.current;
      const userIntent = gesture?.epoch === presentationEpoch.current && gesture.until >= performance.now();
      nativeGesture.current = null;
      // Events have no request IDs. After cancellation, accept only a current
      // explicit request, a fresh native gesture, or the still-active session.
      const currentRequest = request?.epoch === presentationEpoch.current;
      const stale = !currentRequest && !userIntent && !nativeActive.current && (nativeGuarded.current || Boolean(request));
      if (!dialog.open || dialog.dataset.view === 'gallery' || stale) { video.webkitExitFullscreen?.(); return; }
      // Only the explicit fallback may hand our active iPhone session to Apple.
      if (isIPhone() && iphonePlayerMode() === 'window' && !currentRequest && !nativeActive.current && host.dataset.controls === 'ready') {
        if (!windowRecoverySuppressed.current && !rotationSuppressed.current && document.pictureInPictureElement !== video && video.webkitPresentationMode !== 'picture-in-picture') nativeRecovery.current = presentationEpoch.current;
        video.webkitExitFullscreen?.();
        return;
      }
      host.removeAttribute('data-full-window'); host.removeAttribute('data-element-fullscreen'); dialog.removeAttribute('data-film-expanded');
      nativeActive.current = true;
      fullscreenOwner.current ??= presentationEpoch.current;
      setMessage(''); setExpanded(true);
    };
    const nativeEnd = () => {
      const recovery = nativeRecovery.current; nativeRecovery.current = null;
      nativeGesture.current = null;
      nativeActive.current = Boolean(video.webkitDisplayingFullscreen);
      releaseOrientation();
      sync();
      if (recovery !== null) {
        queueMicrotask(() => {
          if (recovery === presentationEpoch.current && !windowRecoverySuppressed.current && dialog.open && dialog.dataset.view !== 'gallery' && document.pictureInPictureElement !== video && video.webkitPresentationMode !== 'picture-in-picture' && !host.hasAttribute('data-full-window')) void actions.current?.fullscreen(false, 'recovery');
        });
      }
      if (dialog.open && dialog.dataset.view !== 'gallery') {
        const focus = dialog.dataset.view === 'ended' ? host.querySelector<HTMLElement>('.film-ended__replay') : video;
        focus?.focus({ preventScroll: true });
      }
    };
    const fullscreen = () => {
      if (host.hasAttribute('data-full-window')) { sync(); return; }
      if (activeFullscreenElement() === host) {
        if (!dialog.open || fullscreenOwner.current === null) { void exitElementFullscreen().catch(() => {}); return; }
        host.setAttribute('data-element-fullscreen', 'true'); dialog.setAttribute('data-film-expanded', 'true');
      } else { releaseOrientation(); host.removeAttribute('data-element-fullscreen'); dialog.removeAttribute('data-film-expanded'); }
      sync();
    };
    document.addEventListener('fullscreenchange', fullscreen); document.addEventListener('webkitfullscreenchange', fullscreen); video.addEventListener('pointerdown', nativeInput); video.addEventListener('keydown', nativeInput); video.addEventListener('touchstart', nativeInput, { passive: true }); video.addEventListener('webkitbeginfullscreen', nativeBegin); video.addEventListener('webkitendfullscreen', nativeEnd);
    const closed = () => { if (!dialog.open) collapse(); };
    dialog.addEventListener('close', closed); dialog.addEventListener('cancel', cancel); host.addEventListener('film-exit-presentation', collapse);
    return () => { collapse(); document.removeEventListener('fullscreenchange', fullscreen); document.removeEventListener('webkitfullscreenchange', fullscreen); video.removeEventListener('pointerdown', nativeInput); video.removeEventListener('keydown', nativeInput); video.removeEventListener('touchstart', nativeInput); video.removeEventListener('webkitbeginfullscreen', nativeBegin); video.removeEventListener('webkitendfullscreen', nativeEnd); dialog.removeEventListener('close', closed); dialog.removeEventListener('cancel', cancel); host.removeEventListener('film-exit-presentation', collapse); };
  }, [stage, media]);

  useEffect(() => {
    if (!ready || !menu.current) return;
    const popup = menu.current;
    const bar = stage.current?.querySelector('media-control-bar');
    const keepTransport = (event: Event) => {
      if (event.target === popup) bar?.toggleAttribute('noautohide', !popup.hidden);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !popup.hidden && !popup.querySelector('media-chrome-menu:not([hidden])')) {
        event.preventDefault(); event.stopPropagation(); dismissSettings(menu, gear, stage);
      }
    };
    const outside = (event: MouseEvent) => { if (!popup.contains(event.target as Node) && !gear.current?.contains(event.target as Node)) popup.hidden = true; };
    popup.addEventListener('toggle', keepTransport); document.addEventListener('click', outside); document.addEventListener('keydown', escape, true);
    return () => { popup.removeEventListener('toggle', keepTransport); document.removeEventListener('click', outside); document.removeEventListener('keydown', escape, true); bar?.removeAttribute('noautohide'); };
  }, [ready, stage]);

  const fullscreen = async (forceNative = false, entry: WindowEntry = 'toggle') => {
    const host = stage.current, dialog = host?.closest('dialog');
    if (!host || !dialog?.open || fullscreenBusy.current) return;
    fullscreenBusy.current = true;
    const epoch = ++presentationEpoch.current;
    const current = () => epoch === presentationEpoch.current && host.isConnected && dialog.open;
    setMessage('');
    try {
      if (forceNative) windowRecoverySuppressed.current = true;
      if (forceNative || entry === 'toggle') rotationSuppressed.current = window.matchMedia('(orientation: landscape)').matches;
      if (host.hasAttribute('data-full-window')) {
        if (!forceNative && entry !== 'toggle') return;
        windowRecoverySuppressed.current = true;
        leaveWindow(); fullscreenOwner.current = null;
        if (!forceNative) return;
      }
      if (activeFullscreenElement() === host) { await exitElementFullscreen(); return; }
      const video = media.current as PipVideo | null;
      if (video?.webkitDisplayingFullscreen) { video.webkitExitFullscreen?.(); return; }
      fullscreenOwner.current = epoch;
      if (!forceNative && isIPhone() && iphonePlayerMode() === 'window') {
        if (video && document.pictureInPictureElement === video) await document.exitPictureInPicture();
        if (!current()) return;
        if (video?.webkitPresentationMode === 'picture-in-picture') video.webkitSetPresentationMode?.('inline');
        dismissSettings(menu, gear, stage, false);
        host.setAttribute('data-full-window', 'true'); host.setAttribute('data-element-fullscreen', 'true');
        windowOrigin.current = entry; windowRecoverySuppressed.current = false;
        dialog.setAttribute('data-film-expanded', 'true'); setExpanded(true);
        return;
      }
      const preferNative = forceNative || isIPhone();
      const canUseElement = !preferNative && ((typeof host.requestFullscreen === 'function' && document.fullscreenEnabled !== false) || typeof (host as FullscreenHost).webkitRequestFullscreen === 'function');
      if (!canUseElement) {
        if (!video?.webkitEnterFullscreen || video.webkitSupportsFullscreen === false) throw new Error('Fullscreen unavailable');
        // iPhone hands playback to Apple's native fullscreen player. The caller
        // explicitly approved native controls where element fullscreen is absent.
        // Native requests cannot be cancelled. Retire the bounded intent on
        // timeout, and guard late events with actual user intent on recovery.
        const outstanding = nativeRequest.current;
        if (outstanding?.timer) clearTimeout(outstanding.timer);
        const request = { epoch, timer: setTimeout(() => {
          if (nativeRequest.current !== request) return;
          nativeRequest.current = null; nativeGuarded.current = true;
          if (request.epoch === presentationEpoch.current && dialog.open) {
            fullscreenBusy.current = false; fullscreenOwner.current = null; setMessage(c.actionError);
          }
        }, 3000) };
        nativeRequest.current = request;
        try { video.webkitEnterFullscreen(); }
        catch (error) {
          clearTimeout(request.timer);
          if (nativeRequest.current === request) nativeRequest.current = null;
          throw error;
        }
        return;
      }
      // Reserve ownership before the asynchronous request so an old orientation
      // completion cannot unlock a newer element-fullscreen session.
      if (window.matchMedia('(pointer: coarse)').matches && typeof screen.orientation?.lock === 'function') orientationOwner.current = epoch;
      await enterElementFullscreen(host);
      if (!current() || activeFullscreenElement() !== host) { if ((fullscreenOwner.current === null || fullscreenOwner.current === epoch) && activeFullscreenElement() === host) await exitElementFullscreen(); return; }
      host.setAttribute('data-element-fullscreen', 'true'); dialog.setAttribute('data-film-expanded', 'true'); setExpanded(true);
      if (orientationOwner.current === epoch) {
        // This is best-effort: unsupported or denied orientation lock still leaves the
        // native fullscreen usable and the device can rotate normally.
        try {
          void screen.orientation.lock('landscape').then(() => {
            if (orientationOwner.current === null) {
              try { screen.orientation.unlock(); } catch { /* Already unlocked or unavailable. */ }
            }
          }).catch(() => { if (orientationOwner.current === epoch) releaseOrientation(); });
        } catch { if (orientationOwner.current === epoch) releaseOrientation(); }
      }
    } catch {
      if (!current()) return;
      if (orientationOwner.current === epoch) releaseOrientation();
      fullscreenOwner.current = null;
      setMessage(c.actionError);
    } finally { if (epoch === presentationEpoch.current && nativeRequest.current?.epoch !== epoch) fullscreenBusy.current = false; }
  };
  const pictureInPicture = async () => {
    const video = media.current as PipVideo | null;
    const dialog = video?.closest('dialog');
    if (!video || !dialog?.open || !pipSupported) return;
    const epoch = presentationEpoch.current;
    const request = ++pipRequestSequence.current; pipOwner.current = request;
    closeMenu(); setMessage('');
    try {
      rotationSuppressed.current = window.matchMedia('(orientation: landscape)').matches;
      windowRecoverySuppressed.current = true;
      if (stage.current?.hasAttribute('data-full-window')) { leaveWindow(); fullscreenOwner.current = null; }
      if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
        if (activeFullscreenElement() === stage.current) await exitElementFullscreen();
        await video.requestPictureInPicture();
      } else video.webkitSetPresentationMode?.(pip ? 'inline' : 'picture-in-picture');
      if ((epoch !== presentationEpoch.current || !dialog.open) && (pipOwner.current === null || pipOwner.current === request)) {
        if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
        if (video.webkitPresentationMode === 'picture-in-picture') video.webkitSetPresentationMode?.('inline');
      }
    } catch { if (epoch === presentationEpoch.current && dialog.open) setMessage(c.actionError); }
  };

  // Stable DOM listeners read the latest action closure without reattaching on every UI state change.
  useEffect(() => { actions.current = { fullscreen, pip: pictureInPicture }; });
  useEffect(() => {
    const host = stage.current, video = media.current as PipVideo | null, dialog = host?.closest('dialog');
    if (!ready || !host || !video || !dialog || !isIPhone() || iphonePlayerMode() !== 'window') return;
    const landscape = window.matchMedia('(orientation: landscape)');
    const reconcile = () => {
      if (!landscape.matches) {
        rotationSuppressed.current = false;
        if (windowOrigin.current === 'rotation') host.dispatchEvent(new Event('film-exit-presentation'));
        return;
      }
      if (!dialog.open || !['playing', 'ended'].includes(dialog.dataset.view ?? '') || host.dataset.controls !== 'ready' || rotationSuppressed.current || fullscreenBusy.current || nativeActive.current || nativeRequest.current || video.webkitDisplayingFullscreen || document.pictureInPictureElement === video || video.webkitPresentationMode === 'picture-in-picture' || activeFullscreenElement()) return;
      if (!host.hasAttribute('data-full-window')) void actions.current?.fullscreen(false, 'rotation');
    };
    landscape.addEventListener('change', reconcile);
    const observer = new MutationObserver(reconcile);
    observer.observe(dialog, { attributes: true, attributeFilter: ['open', 'data-view'] });
    observer.observe(host, { attributes: true, attributeFilter: ['data-controls'] });
    reconcile();
    return () => { landscape.removeEventListener('change', reconcile); observer.disconnect(); };
  }, [ready, stage, media]);
  useEffect(() => {
    const host = stage.current;
    if (!ready || !host) return;
    const fullscreenRequest = (event: Event) => { event.stopImmediatePropagation(); void actions.current?.fullscreen(); };
    const pipRequest = (event: Event) => { event.stopImmediatePropagation(); void actions.current?.pip(); };
    const rateRequest = (event: Event) => {
      event.stopImmediatePropagation();
      const detail: unknown = (event as CustomEvent).detail;
      const value = typeof detail === 'number' || typeof detail === 'string' ? Number(detail) : NaN;
      if (media.current && Number.isFinite(value) && value >= .25 && value <= 2) selectFilmRate(media.current, value);
    };
    const userSeek = (event: Event) => { const time = Number((event as CustomEvent<unknown>).detail); if (media.current) cancelFilmSourceSwitch(media.current, Number.isFinite(time) ? time : undefined); };
    host.addEventListener('mediaseekrequest', userSeek, true);
    host.addEventListener('mediaplaybackraterequest', rateRequest, true);
    for (const name of ['mediaenterfullscreenrequest', 'mediaexitfullscreenrequest']) host.addEventListener(name, fullscreenRequest, true);
    for (const name of ['mediaenterpiprequest', 'mediaexitpiprequest']) host.addEventListener(name, pipRequest, true);
    return () => {
      host.removeEventListener('mediaseekrequest', userSeek, true);
      host.removeEventListener('mediaplaybackraterequest', rateRequest, true);
      for (const name of ['mediaenterfullscreenrequest', 'mediaexitfullscreenrequest']) host.removeEventListener(name, fullscreenRequest, true);
      for (const name of ['mediaenterpiprequest', 'mediaexitpiprequest']) host.removeEventListener(name, pipRequest, true);
    };
  }, [ready, stage, media]);
  // Reserve the actual chrome heights in ordinary inline presentation.
  useLayoutEffect(() => {
    const host = stage.current;
    if (!ready || !host) return;
    const header = host.querySelector<HTMLElement>('.film-player__top');
    const transport = host.querySelector<HTMLElement>('.film-transport');
    if (!header || !transport) return;
    const measure = () => {
      host.style.setProperty('--film-header-height', `${header.getBoundingClientRect().height}px`);
      host.style.setProperty('--film-transport-height', `${transport.getBoundingClientRect().height}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header); observer.observe(transport);
    return () => { observer.disconnect(); host.style.removeProperty('--film-header-height'); host.style.removeProperty('--film-transport-height'); };
  }, [ready, stage]);
  if (!ready) return null;
  const back = (title: string) => <button slot="header" part="back button" className="film-menu-back" type="button" onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} aria-label={c.back}><span aria-hidden="true">‹</span>{title}</button>;
  return <>
    <MediaLoadingIndicator noAutohide slot="centered-chrome" aria-label={copy.loading} />
    <div slot="centered-chrome" className="film-recovery" {...{ noautohide: '' }} role="status" hidden={status !== 'error' && status !== 'blocked'}>
      <span>{status === 'error' ? copy.error : copy.playHint}</span>
      <button type="button" onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={() => { if (media.current) { if (status === 'error') playProductFilm(media.current); else void media.current.play().catch(() => setMessage(c.actionError)); } }}>{status === 'error' ? copy.retry : c.play}</button>
    </div>
    <MediaSettingsMenu ref={menu} id="film-options-menu" className="film-settings" hidden anchor="film-settings-toggle" aria-label={copy.options} dir={locale === 'ar' ? 'rtl' : 'ltr'} {...{ noautohide: '' }}>
      <MediaSettingsMenuItem className="film-menu-quality" ref={element => { element?.toggleAttribute('disabled', !settings.available.length); }} aria-disabled={!settings.available.length}>
        {copy.quality}
        <MediaChromeMenu slot="submenu" id="film-quality-options" hidden aria-label={copy.quality} onChange={event => {
          if (!media.current) return;
          const value = event.currentTarget.value;
          selectFilmQuality(media.current, value === 'auto' ? null : Number(value)); closeMenu();
        }}>
          {back(copy.quality)}
          {settings.adaptive && <MediaChromeMenuItem type="radio" value="auto" checked={settings.selected === null}>{copy.auto}</MediaChromeMenuItem>}
          {[...new Set(settings.available)].sort((a, b) => b - a).map(height => <MediaChromeMenuItem key={height} type="radio" value={String(height)} checked={settings.selected === height}><bdi>{height}p</bdi></MediaChromeMenuItem>)}
        </MediaChromeMenu>
      </MediaSettingsMenuItem>
      <MediaSettingsMenuItem className="film-menu-speed">
        {copy.speed}
        <MediaChromeMenu slot="submenu" id="film-speed-options" hidden aria-label={copy.speed} onChange={event => {
          if (media.current) selectFilmRate(media.current, Number(event.currentTarget.value)); closeMenu();
        }}>
          {back(copy.speed)}
          {speeds.map(value => <MediaChromeMenuItem key={value} type="radio" value={String(value)} checked={rate === value}><bdi>{value}×</bdi></MediaChromeMenuItem>)}
        </MediaChromeMenu>
      </MediaSettingsMenuItem>
      <MediaChromeMenuItem className="film-menu-pip" ref={element => { element?.toggleAttribute('disabled', !pipSupported); }} aria-disabled={!pipSupported} title={pipSupported ? undefined : c.unavailable} onClick={() => { void pictureInPicture(); }} onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); void pictureInPicture(); }
      }}>{pip ? c.exitPip : c.pip}</MediaChromeMenuItem>
      {iphone && <MediaChromeMenuItem className="film-menu-native" onClick={() => { closeMenu(); void fullscreen(true); }} onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); closeMenu(); void fullscreen(true); }
      }}>{c.nativePlayer}</MediaChromeMenuItem>}
    </MediaSettingsMenu>
    <MediaControlBar className="film-transport" dir="ltr">
      <div className="film-transport__row">
        <button type="button" className="film-skip film-previous" aria-label={galleryCopy[locale].previous} disabled={!hasPrevious} onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={previous}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5 7 12l12 7Z" stroke="none" /><path d="M4 5v14" fill="none" strokeWidth="2" /></svg></button>
        <MediaPlayButton className="film-play-toggle" noTooltip />
        <button type="button" className="film-skip film-next" aria-label={galleryCopy[locale].next} disabled={!hasNext} onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={next}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l12 7-12 7Z" stroke="none" /><path d="M20 5v14" fill="none" strokeWidth="2" /></svg></button>
        <MediaTimeDisplay showDuration className="film-time" />
        <MediaTimeRange className="film-seek" aria-label={c.seek} />
        <MediaMuteButton className="film-mute-toggle" noTooltip />
        <MediaVolumeRange className="film-volume" aria-label={c.volume} />
        <MediaSettingsMenuButton ref={gear} id="film-settings-toggle" className="film-options__trigger" invokeTarget="film-options-menu" aria-label={copy.options} noTooltip>
          <svg slot="icon" className="film-gear" viewBox="0 0 24 24" aria-hidden="true"><path d="m9.5 3-.6 2.4-2 .9-2.3-.8-2 3.4 1.7 1.7-.2 2.2-1.6 1.8 2 3.4 2.3-.7 2 .9.6 2.4h4l.6-2.4 2-.9 2.3.7 2-3.4-1.6-1.8-.2-2.2 1.7-1.7-2-3.4-2.3.8-2-.9L13.5 3Z"/><circle cx="11.5" cy="12" r="3.2"/></svg>
        </MediaSettingsMenuButton>
        <button className="film-fullscreen" type="button" onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} aria-label={expanded ? c.exitFullscreen : c.fullscreen} aria-pressed={expanded} onClick={() => { void fullscreen(); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={expanded ? 'M8 3v5H3m13-5v5h5M3 16h5v5m13-5h-5v5' : 'M3 8V3h5m8 0h5v5M3 16v5h5m8 0h5v-5'} /></svg></button>
      </div>
    </MediaControlBar>
    <div className="film-control-message" {...{ noautohide: '' }} role="status" aria-live="polite" hidden={!message}>{message}</div>
  </>;
}
