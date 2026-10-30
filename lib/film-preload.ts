import type { FilmPreloadFile } from './product-film-catalog';

const CACHE = 'film-start-v1';
const jobs = new WeakMap<HTMLVideoElement, () => void>();
const prepared = new Set<string>();
// Advisory ABR prior only: storage may still be evicted after preparation.
export function isFilmStartReady(manifest: string) { return prepared.has(manifest); }
let registration: Promise<void> | undefined;

function controlPage() {
  return registration ??= new Promise<void>((resolve, reject) => {
    const workers = navigator.serviceWorker;
    const finish = (error?: Error) => {
      clearTimeout(timer);
      workers.removeEventListener('controllerchange', changed);
      if (error) reject(error); else resolve();
    };
    const changed = () => {
      if (workers.controller?.scriptURL === new URL('/film-start-sw.js', location.href).href) finish();
    };
    const timer = setTimeout(() => finish(new Error('Film cache activation timed out')), 8000);
    workers.addEventListener('controllerchange', changed);
    void workers.register('/film-start-sw.js', { updateViaCache: 'none' }).then(changed, () => finish(new Error('Film cache unavailable')));
  }).catch(error => { registration = undefined; throw error; });
}

/** Optional bounded warm-up, independent of page readiness and playback gesture. */
export function prepareFilmStart(video: HTMLVideoElement, plans: FilmPreloadFile[][], warmEngine: (signal: AbortSignal) => Promise<void>) {
  stopFilmPreload(video);
  let stopped = false, running = false, fonts = false, scheduled = false, frozen = false;
  let transfer: AbortController | undefined;
  let idle: number | undefined, frame = 0;
  const files = plans.flat();
  const safePlan = plans.length > 0 && plans.length <= 7 && new Set(files.map(file => file.url)).size === files.length &&
    plans.every(plan => {
      if (plan.length !== 6 || plan.reduce((n, file) => n + file.bytes, 0) > 1024 * 1024) return false;
      const master = plan[0]?.url.match(/^(\/films\/[^/]+\/[^/]+\/)master\.m3u8$/)?.[1];
      const paths = ['master.m3u8', '360p/index.m3u8', '360p/init.mp4', ...[0, 1, 2].map(i => `360p/segment-0000${i}.m4s`)];
      return !!master && plan.every((file, i) => file.bytes > 0 && Number.isSafeInteger(file.bytes) && file.url === master + paths[i]);
    });
  const stop = () => {
    stopped = true; transfer?.abort(); cancelAnimationFrame(frame);
    if (idle !== undefined) { if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle); else clearTimeout(idle); }
    document.removeEventListener('media-state', schedule);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', pagehide);
    window.removeEventListener('pageshow', pageshow);
    if (jobs.get(video) === stop) jobs.delete(video);
  };
  jobs.set(video, stop);
  if (!safePlan || !('serviceWorker' in navigator) || !('caches' in window)) { video.dataset.preload = 'unavailable'; return stop; }
  video.dataset.preload = 'waiting';
  const run = async () => {
    scheduled = false;
    if (stopped || frozen || document.hidden || running) return;
    running = true; transfer = new AbortController();
    const signal = transfer.signal;
    video.dataset.preload = 'loading';
    try {
      await controlPage();
      if (signal.aborted || stopped) return;
      const engineReady = warmEngine(signal);
      const cache = await caches.open(CACHE);
      const urls = new Set(files.map(file => new URL(file.url, location.href).href));
      const manifests = new Set(plans.map(plan => plan[0].url));
      for (const manifest of prepared) if (!manifests.has(manifest)) prepared.delete(manifest);
      for (const request of await cache.keys()) if (!urls.has(request.url)) await cache.delete(request);
      for (const plan of plans) {
       for (const file of plan) {
        if (signal.aborted || stopped) return;
        const existing = await cache.match(file.url);
        if (existing && Number(existing.headers.get('content-length')) === file.bytes) continue;
        prepared.delete(plan[0].url);
        const response = await fetch(file.url, { priority: 'low', signal, headers: { 'X-Film-Preload': '1' } });
        if (response.status !== 200) throw new Error('Incomplete film startup response');
        const body = await response.arrayBuffer();
        if (body.byteLength !== file.bytes) throw new Error('Film startup size mismatch');
        if (signal.aborted || stopped) return;
        // fetch() decodes gzip; never store its stale encoded length/encoding.
        const headers = new Headers(response.headers);
        headers.delete('content-encoding'); headers.delete('transfer-encoding');
        headers.set('content-length', String(body.byteLength));
        // Some WebKit navigation states retain a non-matching old record: put
        // can resolve without replacing it. Remove the invalid slot first.
        await cache.delete(file.url);
        if (signal.aborted || stopped) return;
        await cache.put(file.url, new Response(body, { status: 200, headers }));
        const stored = await cache.match(file.url);
        if (!stored || stored.status !== 200 || Number(stored.headers.get('content-length')) !== file.bytes) throw new Error('Film startup cache write failed');
       }
       if (signal.aborted || stopped) return;
       prepared.add(plan[0].url);
      }
      await engineReady;
      if (!stopped && !signal.aborted) { video.dataset.preload = 'ready'; stop(); }
    } catch {
      if (!stopped) video.dataset.preload = signal.aborted ? 'waiting' : 'unavailable';
      // Storage/registration/network failure must never affect the player.
      if (!signal.aborted) stop();
    } finally { running = false; if (!stopped && signal.aborted && !document.hidden) schedule(); }
  };
  function schedule() {
    if (stopped || frozen || running || scheduled || document.hidden || !fonts ||
      !document.querySelector('[data-native-hero][data-media-ready]')) return;
    scheduled = true;
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
      if (stopped) return;
      if ('requestIdleCallback' in window) idle = window.requestIdleCallback(() => { void run(); }, { timeout: 1500 });
      else idle = setTimeout(() => { void run(); }, 250) as unknown as number;
    }); });
  }
  function visibility() { if (document.hidden) transfer?.abort(); else schedule(); }
  function pagehide(event: PageTransitionEvent) {
    if (!event.persisted) { stop(); return; }
    frozen = true; transfer?.abort(); cancelAnimationFrame(frame);
    if (idle !== undefined) { if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle); else clearTimeout(idle); }
    scheduled = false;
  }
  function pageshow() { frozen = false; schedule(); }
  document.addEventListener('media-state', schedule);
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', pagehide);
  window.addEventListener('pageshow', pageshow);
  void document.fonts.ready.then(() => { fonts = true; schedule(); });
  return stop;
}

export function stopFilmPreload(video: HTMLVideoElement) { jobs.get(video)?.(); }
