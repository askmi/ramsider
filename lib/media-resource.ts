export type ImageProgress = { loaded: number; total: number | null; ready: boolean; error: boolean };
export type ImageResource = {
  ready: Promise<HTMLImageElement>;
  progress: ImageProgress;
  subscribe: (listener: (progress: ImageProgress) => void) => () => void;
};

const images = new Map<string, ImageResource>();
const failed = new Set<string>();
const decoded = new WeakMap<HTMLImageElement, Promise<void>>();

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
export function loadImage(src: string, priority: 'low' | 'high' = 'low'): ImageResource {
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
      // A corrupt HTTP 200 can survive in the browser cache after decode fails.
      const response = await fetch(src, { priority, cache: failed.has(src) ? 'reload' : 'default' } as RequestInit);
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
      objectURL = URL.createObjectURL(new Blob(chunks, { type: response.headers.get('content-type') ?? 'application/octet-stream' }));
      const image = new Image();
      image.dataset.source = src;
      image.src = objectURL;
      await decodeImageElement(image);
      failed.delete(src);
      update({ ready: true });
      return image;
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
