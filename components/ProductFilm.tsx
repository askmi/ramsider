'use client';

import { Component, createElement, useEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject } from 'react';
import type { FilmCopy } from '@/lib/product-film';
import type { FilmAsset } from '@/lib/product-film-catalog';
import { prepareFilmStart } from '@/lib/film-preload';
import { configureFilmQualities, playProductFilm, releaseFilm, warmFilmEngine } from '@/lib/film-playback';
import { loadFilmControls } from '@/lib/film-controls-loader';
import type { FilmControlsProps } from './FilmControls';
import type { Locale } from '@/lib/i18n';

class ControlsBoundary extends Component<{ children: ReactNode; media: RefObject<HTMLVideoElement | null>; stage: RefObject<HTMLElement | null> }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    if (this.props.media.current) this.props.media.current.controls = true;
    if (this.props.stage.current) { this.props.stage.current.removeAttribute('data-controls'); this.props.stage.current.setAttribute('gesturesdisabled', ''); this.props.stage.current.setAttribute('nohotkeys', ''); }
  }
  render() { return this.state.failed ? null : this.props.children; }
}

export function ProductFilm({ copy, closeLabel, locale, film }: { copy: FilmCopy; closeLabel: string; locale: Locale; film: FilmAsset }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stage = useRef<HTMLElement>(null);
  const [Controls, setControls] = useState<ComponentType<FilmControlsProps> | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'blocked' | 'error'>('idle');
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    let alive = true;
    const upgrade = () => { void loadFilmControls().then(module => { if (alive) setControls(() => module.FilmControls); }).catch(() => { /* Native controls remain usable; next open retries the optional chunk. */ }); };
    const openObserver = new MutationObserver(() => { if (dialog.current?.open) upgrade(); });
    if (dialog.current) openObserver.observe(dialog.current, { attributes: true, attributeFilter: ['open'] });
    const unconfigure = configureFilmQualities(media, film.qualities);
    const feedback = (event: Event) => { if (dialog.current?.open) setStatus((event as CustomEvent<'loading' | 'blocked' | 'error'>).detail); };
    media.addEventListener('film-status', feedback);
    const stopPreload = prepareFilmStart(media, film.preload, signal => warmFilmEngine(media, signal));
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { warmFilmEngine(media); upgrade(); observer.disconnect(); }
    }, { rootMargin: '600px' });
    const opener = document.getElementById('film-play'); if (opener) observer.observe(opener);
    return () => { alive = false; openObserver.disconnect(); stopPreload(); observer.disconnect(); media.removeEventListener('film-status', feedback); releaseFilm(media); unconfigure(); };
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
    {createElement('media-controller', { ref: stage, className: 'film-player', id: 'film-player', lang: locale, novolumepref: '', nomutedpref: '', gesturesdisabled: '', nohotkeys: '', 'data-qualities': JSON.stringify(film.qualities.map(quality => quality.height)), "defaultstreamtype": "on-demand", "suppressHydrationWarning": true },
    <video key="media" slot="media" ref={video} controls controlsList="noplaybackrate" playsInline preload="none" width={film.width} height={film.height} data-src={film.manifest} data-fallback={film.fallback} data-audio-locale={film.audioLocale} aria-label={copy.title} onLoadStart={() => { if (dialog.current?.open && video.current?.hasAttribute('src')) setStatus(value => value === 'blocked' ? value : 'loading'); }} onWaiting={() => { if (dialog.current?.open && !video.current?.paused) setStatus(value => value === 'blocked' ? value : 'loading'); }} onCanPlay={() => setStatus(value => value === 'blocked' ? value : 'ready')} onPlaying={() => setStatus('ready')} />,
    Controls && <ControlsBoundary key="controls" media={video} stage={stage}><Controls media={video} stage={stage} copy={copy} locale={locale} status={status} /></ControlsBoundary>)}
    <div className="product-film__notes">
      <p id="product-film-hint">{copy.rotate}</p>
      <p role="status" aria-live="polite">{status === 'loading' ? copy.loading : status === 'error' ? copy.error : status === 'blocked' ? copy.playHint : ''}</p>
      {status === 'error' && <button type="button" onClick={() => { if (video.current) playProductFilm(video.current); }}>{copy.retry}</button>}
    </div>
  </dialog>;
}
