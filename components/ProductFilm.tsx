'use client';

import { useEffect, useRef, useState } from 'react';
import type { FilmCopy } from '@/lib/product-film';
import type { FilmAsset } from '@/lib/product-film-catalog';
import { prepareFilmStart } from '@/lib/film-preload';
import { configureFilmQualities, playProductFilm, releaseFilm, warmFilmEngine } from '@/lib/film-playback';
import { FilmOptions } from './FilmOptions';

export function ProductFilm({ copy, closeLabel, locale, film }: { copy: FilmCopy; closeLabel: string; locale: string; film: FilmAsset }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'blocked' | 'error'>('idle');
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    const unconfigure = configureFilmQualities(media, film.qualities);
    const feedback = (event: Event) => { if (dialog.current?.open) setStatus((event as CustomEvent<'loading' | 'blocked' | 'error'>).detail); };
    media.addEventListener('film-status', feedback);
    const stopPreload = prepareFilmStart(media, film.preload, signal => warmFilmEngine(media, signal));
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { warmFilmEngine(media); observer.disconnect(); }
    }, { rootMargin: '600px' });
    const opener = document.getElementById('film-play'); if (opener) observer.observe(opener);
    return () => { stopPreload(); observer.disconnect(); media.removeEventListener('film-status', feedback); releaseFilm(media); unconfigure(); };
  }, [film.preload, film.qualities]);
  return <dialog ref={dialog} id="product-film" className="product-film" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-labelledby="product-film-title" aria-describedby="product-film-hint" onClose={() => {
    // close is queued: a new open gesture may already have reopened this dialog.
    if (dialog.current?.open) return;
    if (video.current) releaseFilm(video.current);
    setStatus('idle');
    document.getElementById(dialog.current?.dataset.opener ?? '')?.focus({ preventScroll: true });
  }}>
    <header className="product-film__header">
      <div><h2 id="product-film-title">{copy.title}</h2><p>{film.audioLabel}</p></div>
      <button type="button" className="product-film__close" aria-label={closeLabel} autoFocus onClick={() => dialog.current?.close()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    </header>
    <video ref={video} controls controlsList="noplaybackrate" playsInline preload="none" width={film.width} height={film.height} data-src={film.manifest} data-fallback={film.fallback} data-audio-locale={film.audioLocale} aria-label={copy.title} onLoadStart={() => { if (dialog.current?.open && video.current?.hasAttribute('src')) setStatus(value => value === 'blocked' ? value : 'loading'); }} onWaiting={() => { if (dialog.current?.open && !video.current?.paused) setStatus(value => value === 'blocked' ? value : 'loading'); }} onCanPlay={() => setStatus(value => value === 'blocked' ? value : 'ready')} onPlaying={() => setStatus('ready')} />
    <FilmOptions media={video} copy={copy} />
    <div className="product-film__notes">
      <p id="product-film-hint">{copy.rotate}</p>
      <p role="status" aria-live="polite">{status === 'loading' ? copy.loading : status === 'error' ? copy.error : status === 'blocked' ? copy.playHint : ''}</p>
      {status === 'error' && <button type="button" onClick={() => { if (video.current) playProductFilm(video.current); }}>{copy.retry}</button>}
    </div>
  </dialog>;
}
