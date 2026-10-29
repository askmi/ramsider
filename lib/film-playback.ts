import { stopFilmPreload } from './film-preload';
import { filmCacheAbr } from './film-cache-abr';
import type Hls from 'hls.js';
import { suspendImageTransfers } from './media-resource';
import type { FilmQuality } from './product-film-catalog';

type FilmStatus = 'loading' | 'blocked' | 'error';
export type FilmSettings = { available: number[]; selected: number | null; adaptive: boolean };
type Session = { close: () => void; quality: (height: number | null) => void; rate: (value: number) => void };
const sessions = new WeakMap<HTMLVideoElement, Session>();
const variants = new WeakMap<HTMLVideoElement, readonly FilmQuality[]>();
const sourceSwitchCancels = new WeakMap<HTMLVideoElement, (time?: number) => void>();
let engine: Promise<typeof Hls> | undefined;

export function configureFilmQualities(video: HTMLVideoElement, qualities: readonly FilmQuality[]) {
  variants.set(video, qualities);
  return () => { variants.delete(video); };
}

/** An explicit user seek supersedes a pending internal source restoration. */
export function cancelFilmSourceSwitch(video: HTMLVideoElement, time?: number) {
  sourceSwitchCancels.get(video)?.(time);
}

export function selectFilmQuality(video: HTMLVideoElement, height: number | null) {
  sessions.get(video)?.quality(height);
}

export function selectFilmRate(video: HTMLVideoElement, rate: number) {
  sessions.get(video)?.rate(rate);
  video.defaultPlaybackRate = rate;
  video.playbackRate = rate;
}

function settings(video: HTMLVideoElement, available: number[], selected: number | null, adaptive = true) {
  video.dataset.qualityMode = selected === null ? 'auto' : String(selected);
  video.dispatchEvent(new CustomEvent<FilmSettings>('film-settings', { detail: { available, selected, adaptive } }));
}

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

export function warmFilmEngine(video: HTMLVideoElement, signal?: AbortSignal): Promise<void> {
  if (nativeHls(video)) return Promise.resolve();
  // The standalone worker is requested only when the first fragment arrives.
  // Warm its ordinary HTTP cache too; this is JS, not another video segment.
  const worker = signal ? fetch('/vendor/hls-worker-1.7.3-runtime.js', {
    priority: 'low', cache: 'force-cache', signal,
  }).then(async response => {
    if (!response.ok) throw new Error('Film worker warm unavailable');
    await response.arrayBuffer();
  }) : Promise.resolve();
  return Promise.allSettled([loadEngine(), worker]).then(() => {});
}

export function releaseFilm(video: HTMLVideoElement) {
  sessions.get(video)?.close();
  sessions.delete(video);
  video.pause();
  video.removeAttribute('src');
  delete video.dataset.quality;
  delete video.dataset.playback;
  video.load();
  settings(video, [], null);
}

/** Standard HLS engines own ABR; this adapter owns the site's modal lifecycle. */
export function playProductFilm(video: HTMLVideoElement) {
  stopFilmPreload(video);
  releaseFilm(video);
  let alive = true, fallbackUsed = false, hls: Hls | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let recovery: ReturnType<typeof setTimeout> | undefined;
  let networkRestarts = 0;
  let playIntent = true;
  let restoreFallback: (() => void) | undefined;
  let finishSourceSeek: (() => void) | undefined;
  const clearSourceSwitch = () => {
    if (finishSourceSeek) video.removeEventListener('seeked', finishSourceSeek);
    finishSourceSeek = undefined;
    delete video.dataset.filmSourceSwitch;
    delete video.dataset.filmSourceSwitchTarget;
    sourceSwitchCancels.delete(video);
  };
  const beginSourceSwitch = () => {
    clearSourceSwitch(); video.dataset.filmSourceSwitch = 'true';
    sourceSwitchCancels.set(video, time => { if (pendingSource && Number.isFinite(time)) pendingSource.time = time!; clearSourceSwitch(); });
  };
  const restoreSourcePosition = (time: number) => {
    const target = Math.min(time, Math.max(0, video.duration - .1));
    if (Math.abs(video.currentTime - target) < .001) { clearSourceSwitch(); return; }
    video.dataset.filmSourceSwitchTarget = String(target);
    finishSourceSeek = () => {
      if (!video.seeking && Math.abs(video.currentTime - target) < .25) clearSourceSwitch();
    };
    video.addEventListener('seeked', finishSourceSeek);
    video.currentTime = target;
  };
  let pendingSource: { time: number; rate: number } | undefined;
  let selected: number | null = null;
  const available = variants.get(video) ?? [];
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
    settings(video, [], null);
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
    pendingSource ??= { time: video.currentTime, rate: video.playbackRate };
    const position = pendingSource;
    if (restoreFallback) video.removeEventListener('loadedmetadata', restoreFallback);
    // paused changes synchronously; native play/pause events are queued.
    const shouldPlay = !video.paused || (playIntent && !video.hasAttribute('src'));
    clearWatchdog();
    hls?.destroy(); hls = undefined;
    restoreFallback = () => {
      if (!current()) return;
      if (position.time > 0 && Number.isFinite(video.duration)) restoreSourcePosition(position.time);
      else clearSourceSwitch();
      video.playbackRate = position.rate;
      pendingSource = undefined; restoreFallback = undefined;
    };
    video.addEventListener('loadedmetadata', restoreFallback, { once: true });
    beginSourceSwitch();
    video.dataset.playback = 'mp4-fallback';
    settings(video, [720], 720, false);
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
  const onMetadata = () => {
    // Some engines open only the AAC track when the original HEVC cannot be
    // decoded. Audio-only playback is not a working product film.
    if (current() && video.dataset.delivery === 'original' &&
      (!video.videoWidth || !video.videoHeight)) fail();
  };
  const onPlay = () => { if (current()) playIntent = true; };
  const onPlaying = () => { if (current()) { playIntent = true; clearWatchdog(); } };
  const onPause = () => { if (current() && video.paused) { clearWatchdog(); playIntent = false; } };
  const onVisibility = () => {
    clearWatchdog();
    if (current() && !document.hidden && playIntent && video.readyState < 3) {
      status('loading'); watchdog = setTimeout(timedOut, 15000);
    }
  };
  const session: Session = { quality(height) {
    if (!current() || fallbackUsed || height === selected) return;
    if (height !== null && !available.some(quality => quality.height === height)) return;
    if (hls) {
      const index = height === null ? -1 : hls.levels.findIndex(level => level.height === height);
      if (height !== null && index < 0) return;
      // Manual levels bypass the ABR ceiling in upstream nextLoadLevel. Keep
      // its viewport observer alive so Auto immediately regains that ceiling.
      hls.nextLevel = index;
      selected = height;
      settings(video, hls.levels.map(level => level.height), selected);
    } else if (video.dataset.playback === 'native-hls') {
      const url = height === null ? video.dataset.src! : available.find(quality => quality.height === height)!.url;
      // A rapid second choice must retain the pre-switch position, not the
      // temporary zero of a loading source. Native HLS has no manual-level API.
      if (!pendingSource) {
        playIntent = !video.paused;
        pendingSource = { time: video.currentTime, rate: video.playbackRate };
      }
      if (restoreFallback) video.removeEventListener('loadedmetadata', restoreFallback);
      const position = pendingSource;
      const expectedURL = new URL(url, location.href).href;
      restoreFallback = () => {
        if (!current() || video.currentSrc !== expectedURL) return;
        video.removeEventListener('loadedmetadata', restoreFallback!);
        restoreSourcePosition(position.time);
        video.playbackRate = position.rate;
        pendingSource = undefined; restoreFallback = undefined;
      };
      video.addEventListener('loadedmetadata', restoreFallback);
      selected = height;
      settings(video, available.map(quality => quality.height), selected);
      clearWatchdog();
      beginSourceSwitch();
      video.src = url; video.load();
      if (playIntent) status('loading');
      // Keep the original gesture, including recovery via native Play if the
      // browser rejects it. A paused source switch must never start playback.
      if (playIntent) { if (!document.hidden) watchdog = setTimeout(timedOut, 15000); attemptPlay(); }
    }
  }, rate(value) { if (pendingSource) pendingSource.rate = value; }, close() {
    if (!alive) return;
    alive = false; clearWatchdog(); if (recovery) clearTimeout(recovery); hls?.destroy(); hls = undefined;
    video.removeEventListener('error', onError);
    video.removeEventListener('loadedmetadata', onMetadata);
    video.removeEventListener('waiting', waiting);
    video.removeEventListener('playing', onPlaying);
    video.removeEventListener('play', onPlay);
    video.removeEventListener('pause', onPause);
    document.removeEventListener('visibilitychange', onVisibility);
    if (restoreFallback) video.removeEventListener('loadedmetadata', restoreFallback);
    clearSourceSwitch();
    resumeImages();
  } };
  sessions.set(video, session);
  video.addEventListener('error', onError);
  video.addEventListener('loadedmetadata', onMetadata);
  video.addEventListener('waiting', waiting);
  video.addEventListener('playing', onPlaying);
  video.addEventListener('play', onPlay);
  video.addEventListener('pause', onPause);
  document.addEventListener('visibilitychange', onVisibility);
  status('loading');
  // Also bound manifest/library startup, before a native waiting event exists.
  if (!document.hidden) watchdog = setTimeout(timedOut, 15000);
  if (video.dataset.delivery === 'original') {
    // Preserve the supplied MP4 byte for byte and actually try it. Chrome can
    // decode this HEVC original despite returning an empty canPlayType result.
    // Native errors and metadata handle actual decoder failures.
    video.dataset.playback = 'original-mp4';
    settings(video, [], null, false);
    video.src = video.dataset.src!; video.load(); attemptPlay();
    return;
  }
  if (nativeHls(video)) {
    video.dataset.playback = 'native-hls';
    settings(video, available.map(quality => quality.height), null);
    video.src = video.dataset.src!; video.load(); attemptPlay();
    return;
  }
  void loadEngine().then(Engine => {
    if (!current() || fallbackUsed) return;
    if (!Engine.isSupported()) { fallback(); return; }
    video.dataset.playback = 'mse-hls';
    hls = new Engine({
      abrController: filmCacheAbr(Engine),
      // Cached startup has no network samples yet. This conservative prior
      // supports 360p but cannot justify an uncached HD upswitch.
      abrEwmaDefaultEstimate: video.dataset.preload === 'ready' ? 1100000 : 500000,
      autoStartLoad: false,
      workerPath: '/vendor/hls-worker-1.7.3-runtime.js',
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
      settings(video, hls.levels.map(level => level.height), selected);
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
