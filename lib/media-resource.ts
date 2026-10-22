export type ImageProgress = { loaded: number; total: number | null; ready: boolean; error: boolean };
export type ImageResource = {
  ready: Promise<HTMLImageElement>;
  progress: ImageProgress;
  subscribe: (listener: (progress: ImageProgress) => void) => () => void;
};

const images = new Map<string, ImageResource>();
const failed = new Set<string>();
const decoded = new WeakMap<HTMLImageElement, Promise<void>>();
const foregroundPause = 'foreground-reading';
const optionalTransfers = new Set<AbortController>();
const optionalWaiters = new Set<() => void>();
let optionalPauses = 0;

/** Foreground native reading takes bandwidth from unfinished gallery warming. */
export function pauseOptionalImageTransfers(): () => void {
  optionalPauses++;
  optionalTransfers.forEach(controller => controller.abort(foregroundPause));
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--optionalPauses === 0) {
      optionalWaiters.forEach(resolve => resolve());
      optionalWaiters.clear();
    }
  };
}

async function waitForOptionalTransfers() {
  // A release followed by immediate reopening must retain the new owner's pause.
  while (optionalPauses) await new Promise<void>(resolve => optionalWaiters.add(resolve));
}
/** Optional media waits for decoded story pixels, including below-fold artwork. */
export function waitForStoryMedia(rejectOnFailure = false): Promise<void> {
  if (document.documentElement.hasAttribute('data-story-media-ready')) return Promise.resolve();
  if (rejectOnFailure && document.documentElement.hasAttribute('data-story-media-failed')) return Promise.reject(new Error('Story image failed'));
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      document.removeEventListener('story-media-ready', ready);
      document.removeEventListener('story-media-failed', failure);
    };
    const ready = () => { cleanup(); resolve(); };
    const failure = () => { cleanup(); reject(new Error('Story image failed')); };
    document.addEventListener('story-media-ready', ready, { once: true });
    if (rejectOnFailure) document.addEventListener('story-media-failed', failure, { once: true });
  });
}

export function resetStoryMedia() {
  document.documentElement.removeAttribute('data-story-media-ready');
  document.documentElement.removeAttribute('data-story-media-failed');
}

export function markStoryMediaFailed() {
  if (document.documentElement.hasAttribute('data-story-media-failed')) return;
  document.documentElement.setAttribute('data-story-media-failed', '');
  document.dispatchEvent(new Event('story-media-failed'));
}

/** A viewer's Retry also retries any failed story artwork holding its barrier. */
export function retryStoryMedia() {
  document.dispatchEvent(new Event('story-media-retry'));
}

export function markStoryMediaReady() {
  if (document.documentElement.hasAttribute('data-story-media-ready')) return;
  document.documentElement.setAttribute('data-story-media-ready', '');
  document.dispatchEvent(new Event('story-media-ready'));
}

/** Readiness belongs to the actual element that will paint, including native lazy images. */
export function decodeImageElement(image: HTMLImageElement): Promise<void> {
  const existing = decoded.get(image);
  if (existing) return existing;
  const ready = image.decode().then(() => {
    if (!image.naturalWidth) throw new Error('Image has no decoded pixels');
  }).catch(error => {
    decoded.delete(image);
    throw error;
  });
  decoded.set(image, ready);
  return ready;
}

/** One original-byte transfer and one retained decoded image per URL, shared by all viewers. */
export function loadImage(src: string, priority: 'low' | 'auto' | 'high' = 'low'): ImageResource {
  const existing = images.get(src);
  if (existing) return existing;
  const listeners = new Set<(progress: ImageProgress) => void>();
  const resource: ImageResource = {
    progress: { loaded: 0, total: null, ready: false, error: false },
    ready: Promise.resolve(null as unknown as HTMLImageElement),
    subscribe(listener) {
      listeners.add(listener);
      listener(resource.progress);
      return () => { listeners.delete(listener); };
    },
  };
  const update = (patch: Partial<ImageProgress>) => {
    resource.progress = { ...resource.progress, ...patch };
    listeners.forEach(listener => listener(resource.progress));
  };
  resource.ready = (async () => {
    let objectURL: string | undefined;
    try {
      try { await waitForStoryMedia(true); }
      catch {
        // Keep the shared resource waiting, but expose the failed prerequisite.
        // One viewer Retry can recover the story and resume every waiting tile.
        update({ error: true });
        await waitForStoryMedia();
      }
      update({ error: false });
      let interrupted = false;
      for (;;) {
        await waitForOptionalTransfers();
        const controller = new AbortController();
        optionalTransfers.add(controller);
        try {
          update({ loaded: 0, total: null });
          // A corrupt HTTP 200 can survive in the browser cache after decode fails.
          // A partially aborted warm response must also restart with complete bytes.
          const response = await fetch(src, { priority, signal: controller.signal, cache: interrupted || failed.has(src) ? 'reload' : 'default' } as RequestInit);
          if (!response.ok) throw new Error(`Image response ${response.status}`);
          // Compressed transfers do not have a reliable decoded byte denominator.
          const length = Number(response.headers.get('content-length'));
          const total = !response.headers.get('content-encoding') && length > 0 ? length : null;
          update({ total });
          const chunks: Uint8Array<ArrayBuffer>[] = [];
          const reader = response.body?.getReader();
          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(new Uint8Array(value));
              update({ loaded: resource.progress.loaded + value.byteLength });
            }
          } else {
            chunks.push(new Uint8Array(await response.arrayBuffer()));
            update({ loaded: chunks[0].byteLength });
          }
          if (total !== null && resource.progress.loaded !== total) throw new Error('Incomplete image transfer');
          // Complete transfers/decodes need no bandwidth and keep their existing cache.
          optionalTransfers.delete(controller);
          objectURL = URL.createObjectURL(new Blob(chunks, { type: response.headers.get('content-type') ?? 'application/octet-stream' }));
          const image = new Image();
          image.dataset.source = src;
          image.src = objectURL;
          await decodeImageElement(image);
          failed.delete(src);
          update({ ready: true });
          return image;
        } catch (error) {
          // The reason survives a quick Close before this catch runs. A foreground
          // pause is pending work, never a failed image or a rejected shared promise.
          if (controller.signal.aborted && controller.signal.reason === foregroundPause) {
            interrupted = true;
            continue;
          }
          throw error;
        } finally {
          optionalTransfers.delete(controller);
        }
      }
    } catch (error) {
      if (objectURL) URL.revokeObjectURL(objectURL);
      images.delete(src);
      failed.add(src);
      update({ error: true });
      throw error;
    }
  })();
  // Prefetch callers may choose to observe progress without awaiting readiness.
  void resource.ready.catch(() => {});
  images.set(src, resource);
  return resource;
}
