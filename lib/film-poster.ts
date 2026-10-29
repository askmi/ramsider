import type { CSSProperties } from 'react';

// Source JPEGs are immutable. Exclude their encoded mattes with a single uniform
// scale; dark backgrounds inside a scene (e.g. Pure Gold) remain part of the art.
const apertures: Record<string, [number, number, number, number]> = {
  'uno-introduction': [0, 0, 1280, 715],
  'pure-gold': [0, 0, 1280, 591],
  evolution: [0, 22, 1280, 553],
  'our-style': [49, 43, 1182, 484],
  'diy-madness': [19, 98, 1242, 493],
  copycats: [0, 0, 1280, 591],
  'inside-ramsider': [114, 0, 1052, 591],
};

export function filmPosterStyle(id: string): CSSProperties {
  const [x, y, width, height] = apertures[id] ?? [0, 0, 1280, 591];
  return {
    '--film-poster-ratio': `${width} / ${height}`,
    '--film-poster-width': `${1280 / width * 100}%`,
    '--film-poster-left': `${-x / width * 100}%`,
    '--film-poster-top': `${-y / height * 100}%`,
  } as CSSProperties;
}
