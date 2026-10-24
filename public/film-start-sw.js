/* Narrow read-through cache for three startup segments; never caches the page. */
const FILM_START_CACHE = 'film-start-v1';
const startupPath = /^\/films\/[^/]+\/[^/]+\/(?:master\.m3u8|360p\/(?:index\.m3u8|init\.mp4|segment-0000[0-2]\.m4s))$/;
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) {
    if (name.startsWith('film-start-') && name !== FILM_START_CACHE) await caches.delete(name);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (url.origin !== self.location.origin || !startupPath.test(url.pathname) || url.search ||
    !['GET', 'HEAD'].includes(request.method) || request.headers.has('X-Film-Preload') || request.headers.has('If-Range')) return;
  event.respondWith((async () => {
    try {
      const cache = await caches.open(FILM_START_CACHE);
      const cached = await cache.match(url.href);
      if (cached?.status === 200) {
        const body = await cached.arrayBuffer(), size = body.byteLength;
        const headers = new Headers(cached.headers);
        headers.set('Accept-Ranges', 'bytes');
        headers.set('X-Film-Cache', 'hit');
        const range = request.headers.get('Range');
        if (!range) return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers });
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match || (!match[1] && !match[2])) return fetch(request);
        const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
        const end = match[1] ? (match[2] ? Math.min(Number(match[2]), size - 1) : size - 1) : size - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
          headers.set('Content-Range', `bytes */${size}`); headers.set('Content-Length', '0');
          return new Response(null, { status: 416, headers });
        }
        headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
        headers.set('Content-Length', String(end - start + 1));
        return new Response(request.method === 'HEAD' ? null : body.slice(start, end + 1), { status: 206, headers });
      }
    } catch { /* Private mode, eviction or storage failure: ordinary delivery. */ }
    return fetch(request);
  })());
});
