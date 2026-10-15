'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';
import { decodeImageElement } from '@/lib/media-resource';
import { LoadingStatus, useScrollLock } from './MediaLoading';

/** Actual painted resource bounds, ignoring the gate's temporary scroll cap. */
function bounds(image: HTMLImageElement, root: HTMLElement) {
  const box = image.getBoundingClientRect();
  let top = box.top, bottom = box.bottom;
  let left = Math.max(0, box.left), right = Math.min(innerWidth, box.right);
  for (let parent = image.parentElement; parent && parent !== root; parent = parent.parentElement) {
    const css = getComputedStyle(parent);
    if (/(hidden|clip|scroll|auto)/.test(css.overflow + css.overflowY + css.overflowX)) {
      const clip = parent.getBoundingClientRect();
      top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom);
      left = Math.max(left, clip.left); right = Math.min(right, clip.right);
    }
  }
  return bottom > top && right > left ? { top: top + scrollY, bottom: bottom + scrollY } : null;
}

export function PageMediaGate({ locale, children }: { locale: Locale; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const retryAction = useRef<() => void>(() => {});
  const [state, setState] = useState({ activated: false, blocked: true, initial: true, error: false });
  useScrollLock(state.activated && state.blocked && state.initial);
  useEffect(() => {
    // The early head bootstrap opts into guarded loading. Without JavaScript,
    // or when an initial framework script failed, retain native static content.
    if (!document.documentElement.hasAttribute('data-media-js')) return;
    document.documentElement.setAttribute('data-media-hydrated', '');
    const shell = root.current!;
    const images = [...shell.querySelectorAll<HTMLImageElement>('img[data-media]')];
    const loading = new Set<HTMLImageElement>();
    const failures = new Set<HTMLImageElement>();
    let alive = true, frame = 0, retryVersion = Date.now();
    let shown = false, warming = false, cap: number | null = null;
    const managed = new Map<HTMLElement, boolean>();
    const controls = [...shell.querySelectorAll<HTMLElement>('a,button,input,textarea,select,summary,[tabindex]')];
    const refresh = () => {
      if (!alive) return;
      // The first decoded block starts all remaining page artwork in the background.
      if (!warming && images[0]?.hasAttribute('data-media-ready')) {
        warming = true;
        images.forEach(image => start(image));
      }
      const pending = images.filter(image => !image.hasAttribute('data-media-ready'))
        .map(image => ({ image, box: bounds(image, shell) }))
        .filter(item => item.box !== null)
        .sort((a, b) => a.box!.top - b.box!.top);
      const frontier = pending[0]?.box!.top ?? null;
      const nextCap = frontier === null ? null : Math.max(0, Math.floor(frontier - shell.getBoundingClientRect().top - scrollY));
      // A native document boundary stops momentum, wheel and programmatic jumps
      // before missing pixels. Upward scrolling remains completely native.
      if (cap !== nextCap) {
        cap = nextCap;
        shell.style.height = cap === null ? '' : `${cap}px`;
        for (const control of controls) {
          const clipped = frontier !== null && control.getBoundingClientRect().bottom + scrollY > frontier;
          if (clipped && !managed.has(control)) { managed.set(control, control.inert); control.inert = true; }
          if (!clipped && managed.has(control)) { control.inert = managed.get(control)!; managed.delete(control); }
        }
      }
      const suspended = !!document.querySelector('dialog[open]');
      const blocked = !suspended && frontier !== null && frontier <= scrollY + innerHeight + 1;
      if (frontier === null || frontier >= shell.getBoundingClientRect().top + scrollY + innerHeight) shown = true;
      const next = { activated: true, blocked, initial: !shown, error: blocked && failures.has(pending[0].image) };
      setState(previous => previous.activated && previous.blocked === next.blocked && previous.initial === next.initial && previous.error === next.error ? previous : next);
      if (!suspended && pending[0]) start(pending[0].image);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(refresh); };
    const start = (image: HTMLImageElement, retry = false) => {
      if (loading.has(image) || failures.has(image) || image.hasAttribute('data-media-ready')) return;
      loading.add(image);
      image.fetchPriority = 'high';
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
    const resize = new ResizeObserver(schedule);
    const main = shell.querySelector('main');
    if (main) resize.observe(main);
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    refresh();
    return () => { alive = false; observer.disconnect(); dialogs.disconnect(); resize.disconnect(); shell.style.height = ''; managed.forEach((inert, control) => { control.inert = inert; }); cancelAnimationFrame(frame); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, []);
  return <div ref={root} className="page-media-shell" data-media-blocked={state.blocked ? '' : undefined} data-media-initial={state.initial ? '' : undefined}>
    <div className="page-media-content" inert={state.activated && state.blocked && state.initial}>{children}</div>
    {state.blocked && <div className="page-media-overlay"><LoadingStatus locale={locale} error={state.error} onRetry={() => retryAction.current()} /></div>}
  </div>;
}
