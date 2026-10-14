'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { charcoalHeights, charcoalTiles } from '@/lib/charcoal-assets';
import { loadImage } from '@/lib/media-resource';
import { LoadingStatus } from './MediaLoading';

function CharcoalTile({ src, height, top, planeHeight, locale, first }: { src: string; height: number; top: number; planeHeight: number; locale: Locale; first: boolean }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [decoded, setDecoded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    const resource = loadImage(src, first ? 'high' : 'auto');
    const unsubscribe = resource.subscribe(value => {
      if (alive) setProgress(value.total ? value.loaded / value.total * 100 : null);
    });
    resource.ready.then(value => { if (alive) setImage(value); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; unsubscribe(); };
  }, [src, first, attempt]);
  return <div className="charcoal-tile" style={{ top: `${top / planeHeight * 100}%`, aspectRatio: `1080 / ${height}` }} aria-busy={!decoded}>
    {/* Shared blob bytes give the native IMG a fresh mount with no second HTTP transfer. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {image && <img key={attempt} className="charcoal-art" src={image.src} width={1080} height={height} alt="" aria-hidden="true" draggable={false} data-charcoal-ready={decoded}
      onLoad={event => { void event.currentTarget.decode().then(() => setDecoded(true)).catch(() => setFailed(true)); }} onError={() => setFailed(true)} />}
    {!decoded && <div className="charcoal-art-error"><LoadingStatus locale={locale} progress={progress} error={failed} onRetry={() => { setFailed(false); setProgress(null); setAttempt(value => value + 1); }} /></div>}
  </div>;
}

/** Seamless native strips form one undistorted artwork plane per semantic block. */
export function CharcoalArtwork({ index, locale }: { index: number; locale: Locale }) {
  return <div className="charcoal-art-host" style={{ aspectRatio: `1080 / ${charcoalHeights[index - 1]}` }}>
    {charcoalTiles[index - 1].map((tile, part) => <CharcoalTile key={tile.src} {...tile} planeHeight={charcoalHeights[index - 1]} locale={locale} first={index === 1 && part === 0} />)}
  </div>;
}
