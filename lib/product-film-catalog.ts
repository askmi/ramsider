import registry from '@/config/product-films.json';
import type { Locale } from './i18n';

export type FilmPreloadFile = { url: string; bytes: number };
export type FilmQuality = { height: number; url: string };
export type FilmAsset = { preload: FilmPreloadFile[]; qualities: FilmQuality[]; manifest: string; fallback: string; width: number; height: number; audioLocale: string; audioLabel: string };

/** Keep the large integrity registry on the server; serialize only playback refs. */
export function selectProductFilm(id: string, locale: Locale): FilmAsset {
  const candidates = registry.assets.filter(asset => asset.id === id && asset.active);
  const asset = candidates.find(asset => asset.audioLocale === locale) ?? candidates.find(asset => asset.audioLocale === 'en');
  if (!asset) throw new Error(`No approved film asset for ${id}`);
  const labels = asset.audioLabels as Partial<Record<Locale, string>>;
  const audioLabel = labels[locale];
  if (!audioLabel) throw new Error('A film requires a truthful translated audio label');
  const base = `/films/${asset.directory}`;
  const startup = ['master.m3u8', '360p/index.m3u8', '360p/init.mp4',
    ...[0, 1, 2].map(n => `360p/segment-${String(n).padStart(5, '0')}.m4s`)];
  const preload = startup.map(path => {
    const file = asset.files.find(file => file.path === path);
    if (!file) throw new Error(`Missing film startup object: ${path}`);
    return { url: `${base}/${path}`, bytes: file.bytes };
  });
  const qualities = asset.files.flatMap(file => {
    const match = /^(\d+)p\/index\.m3u8$/.exec(file.path);
    return match ? [{ height: Number(match[1]), url: `${base}/${file.path}` }] : [];
  }).sort((a, b) => a.height - b.height);
  return { preload, qualities, manifest: `${base}/master.m3u8`, fallback: `${base}/fallback.mp4`, width: asset.width, height: asset.height, audioLocale: asset.audioLocale, audioLabel };
}
