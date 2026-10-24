/** @type {import('next').NextConfig} */
const config = {
  async headers() {
    return [
      { source: '/film-start-sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/films/:film/:version/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/vendor/hls-worker-1.7.3.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/vendor/hls-worker-1.7.3-runtime.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/films/:path*.m3u8', headers: [{ key: 'Content-Type', value: 'application/vnd.apple.mpegurl' }] },
      { source: '/films/:path*.m4s', headers: [{ key: 'Content-Type', value: 'video/mp4' }] },
    ];
  },
};
export default config;
