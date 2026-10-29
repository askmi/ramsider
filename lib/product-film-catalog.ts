import registry from '@/config/product-films.json';
import type { Locale } from './i18n';

export type FilmPreloadFile = { url: string; bytes: number };
export type FilmQuality = { height: number; url: string };
export type FilmAsset = { delivery: 'hls' | 'original'; mediaType: string; preload: FilmPreloadFile[]; qualities: FilmQuality[]; manifest: string; fallback: string; width: number; height: number; audioLocale: string; audioLabel: string };
export type GalleryFilm = FilmAsset & { id: string; title: string; poster: string; duration: number };

const gallery = [
  ['uno-introduction', 'Ramsider Uno Product Introduction', 60.04],
  ['pure-gold', 'Pure Gold', 22.88],
  ['evolution', 'Evolution', 113.64],
  ['our-style', 'Our Style', 38.4],
  ['diy-madness', 'DIY Madness', 126.08],
  ['copycats', 'Copycats', 82.36],
  ['inside-ramsider', 'Inside Ramsider', 60.98],
] as const;

/** Keep the large integrity registry on the server; serialize only playback refs. */
export function selectProductFilm(id: string, locale: Locale): FilmAsset {
  const candidates = registry.assets.filter(asset => asset.id === id && asset.active);
  const asset = candidates.find(asset => asset.audioLocale === locale) ?? candidates.find(asset => asset.audioLocale === 'en') ?? candidates.find(asset => asset.audioLocale === 'und');
  if (!asset) throw new Error(`No approved film asset for ${id}`);
  const labels = asset.audioLabels as Partial<Record<Locale, string>>;
  const audioLabel = labels[locale];
  if (!audioLabel) throw new Error('A film requires a truthful translated audio label');
  const base = `/films/${asset.directory}`;
  if (asset.delivery === 'original') return {
    delivery: 'original', mediaType: 'video/mp4; codecs="hvc1"', preload: [], qualities: [], manifest: `${base}/original.mp4`, fallback: '',
    width: asset.width, height: asset.height, audioLocale: asset.audioLocale, audioLabel,
  };
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
  return { delivery: 'hls', mediaType: 'application/vnd.apple.mpegurl', preload, qualities, manifest: `${base}/master.m3u8`, fallback: `${base}/fallback.mp4`, width: asset.width, height: asset.height, audioLocale: asset.audioLocale, audioLabel };
}

/** Ordered gallery, retaining localized introduction and the original audio of other films. */
export function selectProductFilms(locale: Locale): GalleryFilm[] {
  return gallery.map(([id, title, duration], index) => ({
    ...selectProductFilm(id, locale), id, title, duration, poster: `/art/films/${index + 1}.jpg`,
  }));
}
