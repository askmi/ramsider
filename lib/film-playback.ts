import type Hls from 'hls.js';
import { suspendImageTransfers } from './media-resource';

type FilmStatus = 'loading' | 'blocked' | 'error';
type Session = { close: () => void };
const sessions = new WeakMap<HTMLVideoElement, Session>();
let engine: Promise<typeof Hls> | undefined;

function nativeHls(video: HTMLVideoElement) {
  // Chrome device mode replaces the UA with Safari's, but retains Google's
  // vendor. Its native HLS is not the iPhone/WebKit path tested here.
  // Other iOS browsers still use WebKit and may identify their own vendor.
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const appleEngine = ios && (navigator.vendor === 'Apple Computer, Inc.' ||
    /CriOS|FxiOS|EdgiOS/.test(ua));
  // Desktop Safari's native HLS can re-download an entire repeated film.
  // Use its standard MSE/HTTP-cache path; retain native iPhone/iPad playback.
  return !!video.canPlayType('application/vnd.apple.mpegurl') &&
    appleEngine && /AppleWebKit/.test(ua) && !/Chrome|Chromium|Android|Edg\//.test(ua);
}

function loadEngine() {
  // Keep one shared promise; failed warming must not poison later opens.
  // ESM uses the upstream standalone worker, avoiding bundler closure rewriting.
  return engine ??= import('hls.js/light').then(module => module.default).catch(error => {
    engine = undefined;
    throw error;
  });
}

export function warmFilmEngine(video: HTMLVideoElement) {
  if (!nativeHls(video)) void loadEngine().catch(() => {});
}

export function releaseFilm(video: HTMLVideoElement) {
  sessions.get(video)?.close();
  sessions.delete(video);
  video.pause();
  video.removeAttribute('src');
  delete video.dataset.quality;
  delete video.dataset.playback;
  video.load();
}

/** Standard HLS engines own ABR; this adapter owns the site's modal lifecycle. */
export function playProductFilm(video: HTMLVideoElement) {
  releaseFilm(video);
  let alive = true, fallbackUsed = false, hls: Hls | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let recovery: ReturnType<typeof setTimeout> | undefined;
  let networkRestarts = 0;
  let playIntent = true, changingSource = false;
  let restoreFallback: (() => void) | undefined;
  const resumeImages = suspendImageTransfers();
  const current = () => alive && sessions.get(video) === session;
  const status = (value: FilmStatus) => {
    if (current()) video.dispatchEvent(new CustomEvent('film-status', { detail: value }));
  };
  const clearWatchdog = () => { if (watchdog) clearTimeout(watchdog); watchdog = undefined; };
  const fail = () => {
    if (!current()) return;
    status('error');
    session.close();
    video.pause(); video.removeAttribute('src'); video.load();
  };
  const waiting = () => {
    if (!current() || video.paused || document.hidden) return;
    status('loading');
    // Repeated waiting notifications must not extend the same stall forever.
    if (!watchdog) watchdog = setTimeout(timedOut, 15000);
  };
  const attemptPlay = () => {
    if (!current()) return;
    void video.play().catch((error: unknown) => {
      if (!current()) return;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        playIntent = false; clearWatchdog(); status('blocked');
      }
      // Media failures are handled by the engine/native error listener; an
      // AbortError from close/reopen must never poison the next session.
    });
  };
  const fallback = () => {
    if (!current()) return;
    if (fallbackUsed || !video.dataset.fallback) { fail(); return; }
    fallbackUsed = true;
    const position = video.currentTime;
    // paused changes synchronously; native play/pause events are queued.
    const shouldPlay = !video.paused || (playIntent && !video.hasAttribute('src'));
    changingSource = true;
    clearWatchdog();
    hls?.destroy(); hls = undefined;
    restoreFallback = () => {
      if (!current()) return;
      if (position > 0 && Number.isFinite(video.duration)) video.currentTime = Math.min(position, Math.max(0, video.duration - .1));
      changingSource = false; restoreFallback = undefined;
    };
    video.addEventListener('loadedmetadata', restoreFallback, { once: true });
    video.dataset.playback = 'mp4-fallback';
    video.src = video.dataset.fallback;
    video.load(); status(shouldPlay ? 'loading' : 'blocked');
    playIntent = shouldPlay;
    if (shouldPlay) { if (!document.hidden) watchdog = setTimeout(timedOut, 15000); attemptPlay(); }
  };
  const timedOut = () => {
    clearWatchdog();
    if (!current() || document.hidden || !playIntent || video.ended) return;
    // A native stall need not emit MediaError. Exhaust the small fallback
    // before offering Retry; fallbackUsed bounds this to one source change.
    fallback();
  };
  const onError = () => { if (current()) fallback(); };
  const onPlay = () => { if (current()) playIntent = true; };
  const onPlaying = () => { if (current()) { playIntent = true; clearWatchdog(); } };
  const onPause = () => { if (current() && video.paused) { clearWatchdog(); if (!changingSource) playIntent = false; } };
  const onVisibility = () => {
    clearWatchdog();
    if (current() && !document.hidden && playIntent && video.readyState < 3) {
      status('loading'); watchdog = setTimeout(timedOut, 15000);
    }
  };
  const session: Session = { close() {
    if (!alive) return;
    alive = false; clearWatchdog(); if (recovery) clearTimeout(recovery); hls?.destroy(); hls = undefined;
    video.removeEventListener('error', onError);
    video.removeEventListener('waiting', waiting);
    video.removeEventListener('playing', onPlaying);
    video.removeEventListener('play', onPlay);
    video.removeEventListener('pause', onPause);
    document.removeEventListener('visibilitychange', onVisibility);
    if (restoreFallback) video.removeEventListener('loadedmetadata', restoreFallback);
    resumeImages();
  } };
  sessions.set(video, session);
  video.addEventListener('error', onError);
  video.addEventListener('waiting', waiting);
  video.addEventListener('playing', onPlaying);
  video.addEventListener('play', onPlay);
  video.addEventListener('pause', onPause);
  document.addEventListener('visibilitychange', onVisibility);
  status('loading');
  // Also bound manifest/library startup, before a native waiting event exists.
  if (!document.hidden) watchdog = setTimeout(timedOut, 15000);
  if (nativeHls(video)) {
    video.dataset.playback = 'native-hls';
    video.src = video.dataset.src!; video.load(); attemptPlay();
    return;
  }
  void loadEngine().then(Engine => {
    if (!current() || fallbackUsed) return;
    if (!Engine.isSupported()) { fallback(); return; }
    video.dataset.playback = 'mse-hls';
    hls = new Engine({
      autoStartLoad: false,
      workerPath: '/vendor/hls-worker-1.7.3.js',
      lowLatencyMode: false,
      maxBufferLength: 6,
      maxMaxBufferLength: 8,
      backBufferLength: 6,
      maxBufferSize: 12 * 1024 * 1024,
      capLevelToPlayerSize: true,
      capLevelOnFPSDrop: true,
      abrBandWidthFactor: .85,
      abrBandWidthUpFactor: .8,
      abrEwmaFastVoD: .5,
      abrEwmaSlowVoD: 1,
      fragLoadPolicy: { default: { maxTimeToFirstByteMs: 8000, maxLoadTimeMs: 15000,
        timeoutRetry: { maxNumRetry: 2, retryDelayMs: 500, maxRetryDelayMs: 1500 },
        errorRetry: { maxNumRetry: 2, retryDelayMs: 500, maxRetryDelayMs: 1500 } } },
      manifestLoadPolicy: { default: { maxTimeToFirstByteMs: 6000, maxLoadTimeMs: 8000,
        timeoutRetry: { maxNumRetry: 1, retryDelayMs: 500, maxRetryDelayMs: 1000 },
        errorRetry: { maxNumRetry: 1, retryDelayMs: 500, maxRetryDelayMs: 1000 } } },
    });
    hls.on(Engine.Events.MANIFEST_PARSED, () => {
      if (!current() || !hls) return;
      const initial = hls.levels.findIndex(level => level.height >= 360);
      hls.startLevel = Math.max(initial, 0);
      hls.startLoad(0);
    });
    hls.on(Engine.Events.LEVEL_SWITCHED, (_, data) => {
      if (current() && hls) video.dataset.quality = String(hls.levels[data.level]?.height ?? '');
    });
    hls.on(Engine.Events.ERROR, (_, data) => {
      if (!current() || !data.fatal) return;
      if (data.type === Engine.ErrorTypes.NETWORK_ERROR && data.frag) {
        // A brief segment outage should resume HLS/ABR, not permanently select
        // a fixed-quality MP4. Engine retries and this restart are both bounded.
        if (networkRestarts++ < 1) {
          status('loading');
          recovery = setTimeout(() => { if (current()) hls?.startLoad(video.currentTime); }, 1000);
        } else fallback();
      } else fallback();
    });
    hls.loadSource(video.dataset.src!);
    hls.attachMedia(video);
    attemptPlay();
  }).catch(() => { if (current() && !fallbackUsed) fallback(); });
}
