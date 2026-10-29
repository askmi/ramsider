'use client';

import { Component, createElement, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode, type RefObject, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';
import type { FilmCopy } from '@/lib/product-film';
import type { FilmAsset } from '@/lib/product-film-catalog';
import { prepareFilmStart } from '@/lib/film-preload';
import { cancelFilmSourceSwitch, configureFilmQualities, playProductFilm, releaseFilm, warmFilmEngine } from '@/lib/film-playback';
import { loadFilmControls } from '@/lib/film-controls-loader';
import { galleryCopy } from '@/lib/film-gallery-copy';
import { filmPosterStyle } from '@/lib/film-poster';
import { filmTheme } from '@/lib/film-theme';
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
  const touchStartedWithHiddenTop = useRef(false);
  const touchPlayEpoch = useRef(0);
  const listButton = useRef<HTMLButtonElement>(null), listPanel = useRef<HTMLDivElement>(null);
  const [listOpen, setListOpen] = useState(false);
  const [listSelection, setListSelection] = useState<number | null>(null);
  const [Controls, setControls] = useState<ComponentType<FilmControlsProps> | null>(null);
  const [index, setIndex] = useState(0);
  const galleryArmedIndex = useRef<number | null>(null);
  const [opened, setOpened] = useState(false);
  const [view, setView] = useState<'gallery' | 'playing' | 'ended'>('gallery');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'blocked' | 'error'>('idle');
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);
  const film = films[index], c = galleryCopy[locale];
  useLayoutEffect(() => {
    const applyFocus = () => {
      if (!dialog.current?.open || !pendingFocus.current) return;
      if (pendingFocus.current === 'player' && view === 'playing') { video.current?.focus({ preventScroll: true }); pendingFocus.current = null; }
      else if (pendingFocus.current === 'gallery' && view === 'gallery' && (document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement) !== stage.current) {
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
    document.addEventListener('webkitfullscreenchange', applyFocus);
    return () => { document.removeEventListener('fullscreenchange', applyFocus); document.removeEventListener('webkitfullscreenchange', applyFocus); };
  }, [view, index]);
  useEffect(() => {
    const media = video.current;
    if (!media) return;
    let alive = true;
    const upgrade = () => { void loadFilmControls().then(module => { if (alive) setControls(() => module.FilmControls); }).catch(() => {}); };
    const openObserver = new MutationObserver(() => { const isOpen = Boolean(dialog.current?.open); setOpened(isOpen); if (isOpen) upgrade(); });
    if (dialog.current) openObserver.observe(dialog.current, { attributes: true, attributeFilter: ['open'] });
    unconfigure.current = configureFilmQualities(media, films[0].qualities);
    const feedback = (event: Event) => { if (dialog.current?.open) { const next = (event as CustomEvent<'loading' | 'blocked' | 'error'>).detail; statusRef.current = next; setStatus(next); } };
    media.addEventListener('film-status', feedback);
    const stopPreload = prepareFilmStart(media, films[0].preload, signal => warmFilmEngine(media, signal));
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { warmFilmEngine(media); upgrade(); observer.disconnect(); } }, { rootMargin: '600px' });
    const opener = document.getElementById('film-play'); if (opener) observer.observe(opener);
    return () => { alive = false; openObserver.disconnect(); stopPreload(); observer.disconnect(); media.removeEventListener('film-status', feedback); releaseFilm(media); unconfigure.current?.(); };
  }, [films]);
  useEffect(() => {
    const media = video.current, host = stage.current;
    if (!media || !host) return;
    let gesture: { id: number; x: number; y: number; time: number; inPicture: boolean; horizontal: boolean; moved: boolean } | null = null;
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 1 || event.target !== media || host.dataset.controls !== 'ready' || dialog.current?.dataset.view !== 'playing') { gesture = null; return; }
      const touch = event.touches[0];
      const box = media.getBoundingClientRect();
      // The expanded picture uses cover; inline contain can have letterboxes.
      // A letterbox tap is an intent to reveal controls, not a play gesture.
      const fit = getComputedStyle(media).objectFit === 'cover' ? Math.max : Math.min;
      const scale = media.videoWidth && media.videoHeight ? fit(box.width / media.videoWidth, box.height / media.videoHeight) : 0;
      const pictureWidth = scale ? media.videoWidth * scale : box.width, pictureHeight = scale ? media.videoHeight * scale : box.height;
      const left = box.left + (box.width - pictureWidth) / 2, top = box.top + (box.height - pictureHeight) / 2;
      const inPicture = touch.clientX >= left && touch.clientX <= left + pictureWidth && touch.clientY >= top && touch.clientY <= top + pictureHeight;
      gesture = { id: touch.identifier, x: touch.clientX, y: touch.clientY, time: media.currentTime, inPicture, horizontal: false, moved: false };
    };
    const move = (event: TouchEvent) => {
      if (!gesture || event.touches.length !== 1) { gesture = null; return; }
      const touch = Array.from(event.touches).find(item => item.identifier === gesture?.id);
      if (!touch) { gesture = null; return; }
      const dx = touch.clientX - gesture.x, dy = touch.clientY - gesture.y;
      if (Math.hypot(dx, dy) > 10) gesture.moved = true;
      if (gesture.inPicture && !gesture.horizontal && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.25) gesture.horizontal = true;
      if (gesture.horizontal) event.preventDefault();
    };
    const end = (event: TouchEvent) => {
      if (!gesture) return;
      const current = gesture; gesture = null;
      const touch = Array.from(event.changedTouches).find(item => item.identifier === current.id);
      if (!touch || event.touches.length || dialog.current?.dataset.view !== 'playing') return;
      if (!current.inPicture) {
        if (!current.moved) host.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', bubbles: true }));
        return;
      }
      if (current.horizontal) {
        const width = media.getBoundingClientRect().width;
        if (!width || !Number.isFinite(media.duration) || media.duration <= 0) return;
        const target = Math.max(0, Math.min(media.duration, current.time + (touch.clientX - current.x) / width * media.duration));
        cancelFilmSourceSwitch(media, target);
        media.currentTime = target;
      } else if (!current.moved) {
        // The terminal error path has no source; leave Retry visible until used.
        if (statusRef.current === 'error' || !media.hasAttribute('src')) return;
        const epoch = ++touchPlayEpoch.current;
        if (media.paused) void media.play().catch((error: unknown) => {
          // Pausing, switching films or closing can reject an earlier play request.
          if (error instanceof DOMException && error.name === 'AbortError') return;
          if (epoch === touchPlayEpoch.current && dialog.current?.open && dialog.current.dataset.view === 'playing') media.dispatchEvent(new CustomEvent('film-status', { detail: 'blocked' }));
        });
        else media.pause();
      }
    };
    const cancel = () => { gesture = null; };
    const paused = () => { touchPlayEpoch.current++; };
    media.addEventListener('touchstart', start, { passive: true });
    media.addEventListener('touchmove', move, { passive: false });
    media.addEventListener('touchend', end);
    media.addEventListener('touchcancel', cancel);
    media.addEventListener('pause', paused);
    return () => { touchPlayEpoch.current++; media.removeEventListener('touchstart', start); media.removeEventListener('touchmove', move); media.removeEventListener('touchend', end); media.removeEventListener('touchcancel', cancel); media.removeEventListener('pause', paused); };
  }, []);
  useLayoutEffect(() => {
    const panel = listPanel.current, host = stage.current;
    const top = panel?.parentElement;
    if (!listOpen || !panel || !host || !top) return;
    const fit = () => {
      const hostRect = host.getBoundingClientRect(), topRect = top.getBoundingClientRect();
      const transport = host.querySelector<HTMLElement>('.film-transport');
      const transportTop = transport?.getBoundingClientRect().top ?? hostRect.bottom;
      // The background spans the whole frame; films scroll between its controls.
      panel.style.insetBlockStart = `${hostRect.top - topRect.top}px`;
      panel.style.height = `${hostRect.height}px`;
      panel.style.paddingBlockStart = `${Math.max(0, topRect.bottom - hostRect.top)}px`;
      panel.style.paddingBlockEnd = `${Math.max(0, hostRect.bottom - transportTop)}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(host); observer.observe(top);
    const transport = host.querySelector<HTMLElement>('.film-transport');
    if (transport) observer.observe(transport);
    const current = panel.querySelector<HTMLButtonElement>('[aria-current=true]') ?? panel.querySelector<HTMLButtonElement>('button');
    const items = current?.parentElement;
    if (current && items) {
      const itemRect = current.getBoundingClientRect(), listRect = items.getBoundingClientRect();
      if (itemRect.top < listRect.top) items.scrollTop += itemRect.top - listRect.top;
      else if (itemRect.bottom > listRect.bottom) items.scrollTop += itemRect.bottom - listRect.bottom;
      current.focus({ preventScroll: true });
    }
    return () => observer.disconnect();
  }, [listOpen]);
  const closeList = (restoreFocus = true) => {
    setListOpen(false); setListSelection(null);
    if (restoreFocus) listButton.current?.focus({ preventScroll: true });
  };
  const select = (next: number, start = false) => {
    const media = video.current, item = films[next];
    if (!media || !item) return;
    galleryArmedIndex.current = null;
    touchPlayEpoch.current++;
    releaseFilm(media); unconfigure.current?.();
    media.dataset.delivery = item.delivery; media.dataset.mediaType = item.mediaType; media.dataset.src = item.manifest; media.dataset.fallback = item.fallback; media.dataset.audioLocale = item.audioLocale;
    unconfigure.current = configureFilmQualities(media, item.qualities);
    if (start) pendingFocus.current = 'player';
    setIndex(next); setStatus('idle'); setView(start ? 'playing' : 'gallery');
    if (start) playProductFilm(media);
  };
  const start = () => { galleryArmedIndex.current = null; touchPlayEpoch.current++; pendingFocus.current = 'player'; setView('playing'); if (video.current) playProductFilm(video.current); };
  const activateGallery = (position: number) => {
    // Two rapid activations must work even before React commits the selection.
    if (galleryArmedIndex.current === position) start();
    else { select(position); galleryArmedIndex.current = position; }
  };
  return <dialog ref={dialog} id="product-film" className="product-film" data-theme={filmTheme} data-view={view} lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-labelledby="product-film-title" onClose={() => {
    if (dialog.current?.open) return;
    galleryArmedIndex.current = null;
    touchPlayEpoch.current++;
    if (video.current) releaseFilm(video.current);
    pendingFocus.current = null; setListOpen(false); setListSelection(null); setStatus('idle'); setView('gallery');
    document.getElementById(dialog.current?.dataset.opener ?? '')?.focus({ preventScroll: true });
  }}>
    <div className="film-gallery">
      <header className="product-film__header"><h2 id="product-film-title" tabIndex={-1} autoFocus>{film.title}</h2><button type="button" className="product-film__close" aria-label={closeLabel} onClick={() => dialog.current?.close()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header>
      <div className="film-gallery__main"><button type="button" className="film-gallery__hero" style={filmPosterStyle(film.id)} aria-label={`${c.play}: ${film.title}`} onClick={start}><img src={opened ? film.poster : undefined} width={1280} height={index === 0 ? 715 : 591} alt="" /><span className="film-gallery__play"><PlayIcon /></span><span className="film-gallery__duration">{duration(film.duration)}</span></button><div className="film-gallery__caption"><span dir="ltr">{index + 1} / {films.length}</span></div></div>
      <div className="film-gallery__list" aria-label={c.select}>{films.map((item, position) => <button type="button" key={item.id} className="film-gallery__item" aria-label={`${c.select}: ${item.title}`} aria-pressed={position === index} onClick={() => activateGallery(position)}><span className="film-gallery__thumbnail" style={filmPosterStyle(item.id)}><img src={opened ? item.poster : undefined} width={1280} height={position === 0 ? 715 : 591} alt="" /><span className="film-gallery__small-play"><PlayIcon /></span></span><span className="film-gallery__item-copy"><span className="film-gallery__item-title">{item.title}</span><span className="film-gallery__item-number"><span className="film-gallery__mobile-number">{String(position + 1).padStart(2, '0')}</span><span className="film-gallery__wide-number" dir="ltr">{position + 1} / {films.length}</span></span></span></button>)}</div>
    </div>
    {createElement('media-controller', { ref: stage, className: 'film-player', id: 'film-player', 'data-film-id': film.id, lang: locale, novolumepref: '', nomutedpref: '', gesturesdisabled: '', nohotkeys: '', autohideovercontrols: '', onPointerDownCapture: (event: ReactPointerEvent<HTMLElement>) => {
      const path = event.nativeEvent.composedPath();
      if (listOpen && !path.includes(listPanel.current!) && !path.includes(listButton.current!)) { setListOpen(false); setListSelection(null); }
      const topButton = stage.current?.querySelector<HTMLElement>('.film-player__top button');
      touchStartedWithHiddenTop.current = event.pointerType === 'touch' && !!topButton && getComputedStyle(topButton).pointerEvents === 'none';
    }, onPointerCancelCapture: () => { touchStartedWithHiddenTop.current = false; }, onClickCapture: (event: ReactMouseEvent<HTMLElement>) => {
      // A tap that began on the video must not activate a top action revealed on pointer-up.
      const revealedTopAction = touchStartedWithHiddenTop.current && event.detail !== 0 && event.nativeEvent.composedPath().some(node => node instanceof Element && node.matches('.film-player__top button'));
      touchStartedWithHiddenTop.current = false;
      if (revealedTopAction) { event.preventDefault(); event.stopPropagation(); return; }
      // Media Chrome only schedules mouse pointer-up for its own play/fullscreen elements.
      // Route our custom controls through its activity handler without affecting video tap gestures.
      if (!event.nativeEvent.composedPath().some(node => node instanceof Element && node.matches('.film-skip, .film-fullscreen, .film-settings, .film-options__trigger, .film-ended button, .film-recovery button'))) return;
      stage.current?.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse' }));
    }, 'data-qualities': JSON.stringify(film.qualities.map(quality => quality.height)), defaultstreamtype: 'on-demand', suppressHydrationWarning: true },
      <video key="media" slot="media" ref={video} tabIndex={0} controls controlsList="noplaybackrate" playsInline preload="none" width={film.width} height={film.height} data-delivery={film.delivery} data-media-type={film.mediaType} data-src={film.manifest} data-fallback={film.fallback} data-audio-locale={film.audioLocale} aria-label={film.title} onEnded={() => setView('ended')} onSeeking={() => { const media = video.current; if (!dialog.current?.open || !media || !Number.isFinite(media.duration) || media.currentTime >= media.duration) return; const target = media.dataset.filmSourceSwitchTarget; if (media.dataset.filmSourceSwitch && target !== undefined && Math.abs(media.currentTime - Number(target)) > .05) cancelFilmSourceSwitch(media, media.currentTime); if (!media.dataset.filmSourceSwitch) setView(current => current === 'ended' ? 'playing' : current); }} onLoadStart={() => { if (dialog.current?.open && video.current?.hasAttribute('src')) setStatus(value => value === 'blocked' ? value : 'loading'); }} onWaiting={() => { if (dialog.current?.open && video.current?.hasAttribute('src') && !video.current.paused) setStatus(value => value === 'blocked' ? value : 'loading'); }} onCanPlay={() => setStatus(value => value === 'blocked' ? value : 'ready')} onPlaying={() => { if (dialog.current?.open && video.current && !video.current.paused && video.current.hasAttribute('src')) { setStatus('ready'); setView('playing'); } }} />,
      Controls && <ControlsBoundary key="controls" media={video} stage={stage}><Controls media={video} stage={stage} copy={copy} locale={locale} status={status} previous={() => select(index - 1, true)} next={() => select(index + 1, true)} hasPrevious={index > 0} hasNext={index < films.length - 1} /></ControlsBoundary>,
      <div className="film-player__top" dir={locale === 'ar' ? 'rtl' : 'ltr'} slot="top-chrome"><span className="film-player__identity">{film.title}</span><button ref={listButton} type="button" className="film-player__list-toggle" aria-expanded={listOpen} aria-controls="film-playlist" onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={() => { if (listOpen) closeList(); else { setListSelection(null); setListOpen(true); stage.current?.removeAttribute('userinactive'); } }}>{c.list}</button><button type="button" className="film-player__close" aria-label={closeLabel} onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={() => dialog.current?.close()}>×</button>{listOpen && <div ref={listPanel} id="film-playlist" className="film-playlist" role="region" aria-label={c.list} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeList(); } }}><div className="film-playlist__items">{films.map((item, position) => <button type="button" key={item.id} className="film-playlist__item" aria-pressed={listSelection === position} aria-current={position === index ? 'true' : undefined} onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={() => { if (listSelection !== position) { setListSelection(position); return; } closeList(false); if (position === index) { video.current?.focus({ preventScroll: true }); if (video.current && (statusRef.current === 'error' || !video.current.hasAttribute('src'))) { touchPlayEpoch.current++; playProductFilm(video.current); } else { if (video.current && (view === 'ended' || video.current.ended)) { cancelFilmSourceSwitch(video.current, 0); video.current.currentTime = 0; } if (video.current?.paused) void video.current.play().catch(() => {}); } if (view === 'ended') setView('playing'); } else select(position, true); }}><img src={opened ? item.poster : undefined} width={1280} height={position === 0 ? 715 : 591} alt="" /><span>{item.title}</span></button>)}</div></div>}</div>,
      view === 'ended' && <div className="film-ended" slot="centered-chrome" {...{ noautohide: '' }}><button className="film-ended__replay" type="button" aria-label={c.replay} onKeyDownCapture={preserveButtonActivation} onKeyUpCapture={preserveButtonActivation} onClick={start}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 1-2.3-5.7L20 7.5M20 3v4.5h-4.5" /></svg></button></div>)}
    <div className="product-film__notes"><p role="status" aria-live="polite">{status === 'loading' ? copy.loading : status === 'error' ? copy.error : status === 'blocked' ? copy.playHint : ''}</p>{status === 'error' && <button type="button" onClick={() => { if (video.current) playProductFilm(video.current); }}>{copy.retry}</button>}</div>
  </dialog>;
}
