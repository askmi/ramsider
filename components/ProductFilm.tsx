'use client';

import { useEffect, useRef, useState } from 'react';
import type { FilmCopy } from '@/lib/product-film';

/** Attach a source only in the user's open/retry gesture; keep browser media controls. */
export function playNativeFilm(video: HTMLVideoElement) {
  video.src = video.dataset.src!;
  video.load();
  // A browser may require another tap on its own Play control (e.g. low-power mode).
  void video.play().catch(() => {});
}

function release(video: HTMLVideoElement) {
  video.pause();
  video.removeAttribute('src');
  video.load();
}

export function ProductFilm({ copy, closeLabel, locale }: { copy: FilmCopy; closeLabel: string; locale: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  useEffect(() => {
    const media = video.current;
    return () => { if (media) release(media); };
  }, []);
  return <dialog ref={dialog} id="product-film" className="product-film" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-labelledby="product-film-title" aria-describedby="product-film-hint" onClose={() => {
    // close is queued: a new open gesture may already have reopened this dialog.
    if (dialog.current?.open) return;
    if (video.current) release(video.current);
    setStatus('idle');
    document.getElementById(dialog.current?.dataset.opener ?? '')?.focus({ preventScroll: true });
  }}>
    <header className="product-film__header">
      <div><h2 id="product-film-title">{copy.title}</h2><p>{copy.language}</p></div>
      <button type="button" className="product-film__close" aria-label={closeLabel} autoFocus onClick={() => dialog.current?.close()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    </header>
    <video ref={video} controls playsInline preload="none" width="3840" height="2160" data-src="/films/uno-introduction.mp4" aria-label={copy.title} onLoadStart={() => { if (dialog.current?.open && video.current?.hasAttribute('src')) setStatus('loading'); }} onWaiting={() => { if (dialog.current?.open) setStatus('loading'); }} onCanPlay={() => setStatus('ready')} onPlaying={() => setStatus('ready')} onError={() => { if (video.current?.hasAttribute('src')) setStatus('error'); }} />
    <div className="product-film__notes">
      <p id="product-film-hint">{copy.rotate}</p>
      <p role="status" aria-live="polite">{status === 'loading' ? copy.loading : status === 'error' ? copy.error : ''}</p>
      {status === 'error' && <button type="button" onClick={() => { if (video.current) playNativeFilm(video.current); }}>{copy.retry}</button>}
    </div>
  </dialog>;
}
