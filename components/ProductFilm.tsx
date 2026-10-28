'use client';

import { Component, createElement, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { FilmCopy } from '@/lib/product-film';
import type { FilmAsset } from '@/lib/product-film-catalog';
import { prepareFilmStart } from '@/lib/film-preload';
import { cancelFilmSourceSwitch, configureFilmQualities, playProductFilm, releaseFilm, warmFilmEngine } from '@/lib/film-playback';
import { loadFilmControls } from '@/lib/film-controls-loader';
import { galleryCopy } from '@/lib/film-gallery-copy';
import type { FilmControlsProps } from './FilmControls';
import type { Locale } from '@/lib/i18n';

export type GalleryFilm = FilmAsset & { id: string; title: string; poster: string; duration: number };
class ControlsBoundary extends Component<{ children: ReactNode; media: RefObject<HTMLVideoElement | null>; stage: RefObject<HTMLElement | null> }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() {
    if (this.props.media.current) this.props.media.current.controls = true;
    if (this.props.stage.current) { this.props.stage.current.removeAttribute('data-controls'); this.props.stage.current.setAttribute('gesturesdisabled', ''); this.props.stage.current.setAttribute('nohotkeys', ''); }
  }
  render() { return this.state.failed ? null : this.props.children; }
}
const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const preserveButtonActivation = (event: ReactKeyboardEvent<HTMLButtonElement>) => { if (event.key === ' ' || event.key === 'Enter') event.stopPropagation(); };
const PlayIcon = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.5 20 12 8 19.5Z" /></svg>;

export function ProductFilm({ copy, closeLabel, locale, films }: { copy: FilmCopy; closeLabel: string; locale: Locale; films: GalleryFilm[] }) {
  const dialog = useRef<HTMLDialogElement>(null), video = useRef<HTMLVideoElement>(null), stage = useRef<HTMLElement>(null);
  const unconfigure = useRef<(() => void) | null>(null);
  const pendingFocus = useRef<'player' | 'gallery' | null>(null);
  const [Controls, setControls] = useState<ComponentType<FilmControlsProps> | null>(null);
  const [index, setIndex] = useState(0);
  const [opened, setOpened] = useState(false);
  const [view, setView] = useState<'gallery' | 'playing' | 'ended'>('gallery');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'blocked' | 'error'>('idle');
  const film = films[index], c = galleryCopy[locale];
  useLayoutEffect(() => {
    const applyFocus = () => {
      if (!dialog.current?.open || !pendingFocus.current) return;
      if (pendingFocus.current === 'player' && view === 'playing') { video.current?.focus({ preventScroll: true }); pendingFocus.current = null; }
      else if (pendingFocus.current === 'gallery' && view === 'gallery' && document.fullscreenElement !== stage.current) {
        const item = dialog.current.querySelector<HTMLButtonElement>('.film-gallery__item[aria-pressed=true]');
        const list = item?.closest<HTMLElement>('.film-gallery__list');
        if (item && list) {
          const bounds = list.getBoundingClientRect(), selected = item.getBoundingClientRect();
          const left = selected.left < bounds.left ? selected.left - bounds.left : selected.right > bounds.right ? selected.right - bounds.right : 0;
          const top = selected.top < bounds.top ? selected.top - bounds.top : selected.bottom > bounds.bottom ? selected.bottom - bounds.bottom : 0;
          list.scrollBy({ left, top, behavior: 'instant' });
          item.focus({ preventScroll: true });
        }
        pendingFocus.current = null;
      }
    };
    applyFocus();
    document.addEventListener('fullscreenchange', applyFocus);
    return () => document.removeEventListener('fullscreenchange', applyFocus);
  }, [view, index]);
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    let alive = true;
    const upgrade = () => { void loadFilmControls().then(module => { if (alive) setControls(() => module.FilmControls); }).catch(() => {}); };
    const openObserver = new MutationObserver(() => { const isOpen = Boolean(dialog.current?.open); setOpened(isOpen); if (isOpen) upgrade(); });
    if (dialog.current) openObserver.observe(dialog.current, { attributes: true, attributeFilter: ['open'] });
    unconfigure.current = configureFilmQualities(media, films[0].qualities);
    const feedback = (event: Event) => { if (dialog.current?.open) setStatus((event as CustomEvent<'loading' | 'blocked' | 'error'>).detail); };
    media.addEventListener('film-status', feedback);
    const stopPreload = prepareFilmStart(media, films[0].preload, signal => warmFilmEngine(media, signal));
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { warmFilmEngine(media); upgrade(); observer.disconnect(); } }, { rootMargin: '600px' });
    const opener = document.getElementById('film-play'); if (opener) observer.observe(opener);
    return () => { alive = false; openObserver.disconnect(); stopPreload(); observer.disconnect(); media.removeEventListener('film-status', feedback); releaseFilm(media); unconfigure.current?.(); };
  }, [films]);
  const select = (next: number, start = false) => {
    const media = video.current, item = films[next];
    if (!media || !item) return;
    releaseFilm(media); unconfigure.current?.();
    media.dataset.src = item.manifest; media.dataset.fallback = item.fallback; media.dataset.audioLocale = item.audioLocale;
    unconfigure.current = configureFilmQualities(media, item.qualities);
    if (start) pendingFocus.current = 'player';
    setIndex(next); setStatus('idle'); setView(start ? 'playing' : 'gallery');
    if (start) playProductFilm(media);
  };
  const start = () => { pendingFocus.current = 'player'; setView('playing'); if (video.current) playProductFilm(video.current); };
  const all = () => {
    if (video.current) releaseFilm(video.current);
    stage.current?.dispatchEvent(new Event('film-exit-presentation'));
    if (document.fullscreenElement === stage.current) void document.exitFullscreen().catch(() => {});
    stage.current?.removeAttribute('data-full-window'); dialog.current?.removeAttribute('data-film-expanded');
    document.dispatchEvent(new Event('fullscreenchange'));
    pendingFocus.current = 'gallery'; setStatus('idle'); setView('gallery');
  };
  return <dialog ref={dialog} id="product-film" className="product-film" data-view={view} lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-labelledby="product-film-title" onClose={() => {
    if (dialog.current?.open) return;
    if (video.current) releaseFilm(video.current);
    pendingFocus.current = null; setStatus('idle'); setView('gallery');
    document.getElementById(dialog.current?.dataset.opener ?? '')?.focus({ preventScroll: true });
  }}>
    <div className="film-gallery">
      <header className="product-film__header"><h2 id="product-film-title" tabIndex={-1} autoFocus>{c.title}</h2><button type="button" className="product-film__close" aria-label={closeLabel} onClick={() => dialog.current?.close()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header>
      <div className="film-gallery__main"><button type="button" className="film-gallery__hero" aria-label={`${c.play}: ${film.title}`} onClick={start}><img src={opened ? film.poster : undefined} width={1280} height={index === 0 ? 715 : 591} alt="" /><span className="film-gallery__play"><PlayIcon /></span><span className="film-gallery__duration">{duration(film.duration)}</span></button><div className="film-gallery__caption"><span>{film.title}<small className="film-gallery__audio">{film.audioLabel}</small></span><span>{index + 1} / {films.length}</span></div></div>
      <div className="film-gallery__list" aria-label={c.select}>{films.map((item, position) => <button type="button" key={item.id} className="film-gallery__item" aria-label={`${c.select}: ${item.title}`} aria-pressed={position === index} onClick={() => select(position)}><span className="film-gallery__thumbnail"><img src={opened ? item.poster : undefined} width={1280} height={position === 0 ? 715 : 591} alt="" /><span className="film-gallery__small-play"><PlayIcon /></span></span><span className="film-gallery__item-copy"><span className="film-gallery__item-title">{item.title}</span><span className="film-gallery__item-number"><span className="film-gallery__mobile-number">{String(position + 1).padStart(2, '0')}</span><span className="film-gallery__wide-number">{position + 1} / {films.length}</span></span></span></button>)}</div>
    </div>
    {createElement('media-controller', { ref: stage, className: 'film-player', id: 'film-player', lang: locale, novolumepref: '', nomutedpref: '', gesturesdisabled: '', nohotkeys: '', 'data-qualities': JSON.stringify(film.qualities.map(quality => quality.height)), defaultstreamtype: 'on-demand', suppressHydrationWarning: true },
      <video key="media" slot="media" ref={video} tabIndex={0} controls controlsList="noplaybackrate" playsInline preload="none" width={film.width} height={film.height} data-src={film.manifest} data-fallback={film.fallback} data-audio-locale={film.audioLocale} aria-label={film.title} onEnded={() => setView('ended')} onSeeking={() => { const media = video.current; if (!dialog.current?.open || !media || !Number.isFinite(media.duration) || media.currentTime >= media.duration) return; const target = media.dataset.filmSourceSwitchTarget; if (media.dataset.filmSourceSwitch && target !== undefined && Math.abs(media.currentTime - Number(target)) > .05) cancelFilmSourceSwitch(media, media.currentTime); if (!media.dataset.filmSourceSwitch) setView(current => current === 'ended' ? 'playing' : current); }} onLoadStart={() => { if (dialog.current?.open && video.current?.hasAttribute('src')) setStatus(value => value === 'blocked' ? value : 'loading'); }} onWaiting={() => { if (dialog.current?.open && !video.current?.paused) setStatus(value => value === 'blocked' ? value : 'loading'); }} onCanPlay={() => setStatus(value => value === 'blocked' ? value : 'ready')} onPlaying={() => { if (dialog.current?.open && video.current && !video.current.paused && video.current.hasAttribute('src')) { setStatus('ready'); setView('playing'); } }} />,
      Controls && <ControlsBoundary key="controls" media={video} stage={stage}><Controls media={video} stage={stage} copy={copy} locale={locale} status={status} previous={() => select(index - 1, true)} next={() => select(index + 1, true)} hasPrevious={index > 0} hasNext={index < films.length - 1} /></ControlsBoundary>,
      <div className="film-player__top" dir={locale === 'ar' ? 'rtl' : 'ltr'} slot="top-chrome" {...{ noautohide: '' }}><button type="button" onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={all}>{c.all}</button><span className="film-player__identity">{film.title}</span><button type="button" aria-label={closeLabel} onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={() => dialog.current?.close()}>×</button></div>,
      view === 'ended' && <div className="film-ended" dir={locale === 'ar' ? 'rtl' : 'ltr'} slot="centered-chrome" {...{ noautohide: '' }}><strong>{film.title} {c.finished}</strong>{index + 1 < films.length && <div className="film-ended__next"><img src={opened ? films[index + 1].poster : undefined} width={1280} height={591} alt="" /><span>{c.nextUp}<br /><b>{films[index + 1].title}</b><br />{index + 2} / {films.length}</span></div>}<div className="film-ended__actions"><button type="button" onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={start}>{c.replay}</button>{index + 1 < films.length && <button type="button" onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={() => select(index + 1, true)}>{c.next}</button>}</div><button className="film-ended__all" type="button" onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={all}>{c.all}</button></div>)}
    <div className="product-film__notes"><p id="product-film-hint">{copy.rotate}</p><p role="status" aria-live="polite">{status === 'loading' ? copy.loading : status === 'error' ? copy.error : status === 'blocked' ? copy.playHint : ''}</p>{status === 'error' && <button type="button" onClick={() => { if (video.current) playProductFilm(video.current); }}>{copy.retry}</button>}</div>
  </dialog>;
}
