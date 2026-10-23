import registry from '@/config/product-films.json';
import type { Locale } from './i18n';

export type FilmAsset = { manifest: string; fallback: string; width: number; height: number; audioLocale: string; audioLabel: string };

/** Keep the large integrity registry on the server; serialize only playback refs. */
export function selectProductFilm(id: string, locale: Locale): FilmAsset {
  const candidates = registry.assets.filter(asset => asset.id === id && asset.active);
  const asset = candidates.find(asset => asset.audioLocale === locale) ?? candidates.find(asset => asset.audioLocale === 'en');
  if (!asset) throw new Error(`No approved film asset for ${id}`);
  const labels = asset.audioLabels as Partial<Record<Locale, string>>;
  const audioLabel = labels[locale];
  if (!audioLabel) throw new Error('A film requires a truthful translated audio label');
  const base = `/films/${asset.directory}`;
  return { manifest: `${base}/master.m3u8`, fallback: `${base}/fallback.mp4`, width: asset.width, height: asset.height, audioLocale: asset.audioLocale, audioLabel };
}
