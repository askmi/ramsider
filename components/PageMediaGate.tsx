'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';
import { decodeImageElement } from '@/lib/media-resource';
import { LoadingStatus, useScrollLock } from './MediaLoading';

function visible(image: HTMLImageElement) {
  const box = image.getBoundingClientRect();
  let top = Math.max(0, box.top), bottom = Math.min(innerHeight, box.bottom);
  let left = Math.max(0, box.left), right = Math.min(innerWidth, box.right);
  if (bottom <= top || right <= left) return false;
  for (let parent = image.parentElement; parent; parent = parent.parentElement) {
    const css = getComputedStyle(parent);
    if (/(hidden|clip|scroll|auto)/.test(css.overflow + css.overflowY + css.overflowX)) {
      const clip = parent.getBoundingClientRect();
      top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom);
      left = Math.max(left, clip.left); right = Math.min(right, clip.right);
    }
  }
  return bottom > top && right > left;
}

export function PageMediaGate({ locale, children }: { locale: Locale; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const retryAction = useRef<() => void>(() => {});
  const [state, setState] = useState({ activated: false, blocked: true, error: false });
  useScrollLock(state.activated && state.blocked);
  useEffect(() => {
    // The early head bootstrap opts into guarded loading. Without JavaScript,
    // or when an initial framework script failed, retain native static content.
    if (!document.documentElement.hasAttribute('data-media-js')) return;
    document.documentElement.setAttribute('data-media-hydrated', '');
    const images = [...root.current!.querySelectorAll<HTMLImageElement>('img[data-media]')];
    const loading = new Set<HTMLImageElement>();
    const failures = new Set<HTMLImageElement>();
    let alive = true, frame = 0, retryVersion = Date.now();
    const refresh = () => {
      if (!alive) return;
      const suspended = !!document.querySelector('dialog[open]');
      const current = suspended ? [] : images.filter(visible);
      const pending = current.filter(image => !image.hasAttribute('data-media-ready'));
      const next = { activated: true, blocked: pending.length > 0, error: pending.some(image => failures.has(image)) };
      setState(previous => previous.activated && previous.blocked === next.blocked && previous.error === next.error ? previous : next);
      pending.forEach(image => start(image));
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(refresh); };
    const start = (image: HTMLImageElement, retry = false) => {
      if (loading.has(image) || failures.has(image) || image.hasAttribute('data-media-ready')) return;
      loading.add(image);
      image.loading = 'eager';
      // On Firefox a decode immediately after src mutation can still reject
      // against the previous failed request. Wait for the replacement load.
      const loaded = retry ? new Promise<void>((resolve, reject) => {
        const cleanup = () => { image.removeEventListener('load', success); image.removeEventListener('error', failure); };
        const success = () => { cleanup(); resolve(); };
        const failure = () => { cleanup(); reject(new Error('Image retry failed')); };
        image.addEventListener('load', success, { once: true });
        image.addEventListener('error', failure, { once: true });
      }) : Promise.resolve();
      void loaded.then(() => decodeImageElement(image)).then(() => {
        if (alive) image.setAttribute('data-media-ready', '');
      }).catch(() => { if (alive) failures.add(image); }).finally(() => { loading.delete(image); schedule(); });
    };
    const observer = new IntersectionObserver(entries => {
      if (!document.querySelector('dialog[open]')) entries.forEach(entry => { if (entry.isIntersecting) start(entry.target as HTMLImageElement); });
      schedule();
    }, { rootMargin: '75% 0px' });
    images.forEach(image => observer.observe(image));
    const dialogs = new MutationObserver(schedule);
    document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
    retryAction.current = () => {
      failures.forEach(image => {
        failures.delete(image);
        // Some browsers retain a corrupt HTTP 200 in their image cache.
        // Retry the same original asset bytes through a fresh cache key.
        const src = new URL(image.getAttribute('src')!, document.baseURI);
        src.searchParams.set('media-retry', String(++retryVersion));
        image.src = src.href;
        start(image, true);
      });
      schedule();
    };
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    refresh();
    return () => { alive = false; observer.disconnect(); dialogs.disconnect(); cancelAnimationFrame(frame); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, []);
  return <div ref={root} className="page-media-shell" data-media-blocked={state.blocked ? '' : undefined}>
    <div className="page-media-content" inert={state.activated && state.blocked}>{children}</div>
    {state.blocked && <div className="page-media-overlay"><LoadingStatus locale={locale} error={state.error} onRetry={() => retryAction.current()} /></div>}
  </div>;
}
