'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import type { Locale } from '@/lib/i18n';
import { pauseOptionalImageTransfers, retryStoryMedia, waitForStoryMedia } from '@/lib/media-resource';
import { LoadingStatus, useScrollLock } from './MediaLoading';

/** Only modal lifecycle/reveal is hydrated; reading copy is authored on the server. */
export function WellnessViewer({ children, closeLabel, loadingTitle, locale }: {
  children: ReactNode; closeLabel: string; loadingTitle: string; locale: Locale;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const savedScroll = useRef(0);
  const resumeWarming = useRef<(() => void) | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [motion, setMotion] = useState(false);
  useScrollLock(open);

  useEffect(() => {
    const activate = (event: MouseEvent) => {
      const trigger = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-wellness-open]') : null;
      if (!trigger || dialog.current?.open) return;
      event.preventDefault(); opener.current = trigger; savedScroll.current = window.scrollY;
      resumeWarming.current?.();
      resumeWarming.current = pauseOptionalImageTransfers();
      flushSync(() => {
        setReady(document.documentElement.hasAttribute('data-story-media-ready'));
        setMotion('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches);
        setError(false); setOpen(true);
      });
      dialog.current?.showModal();
      scroller.current?.scrollTo({ top: 0, behavior: 'instant' });
      dialog.current?.querySelector<HTMLButtonElement>('.wellness-close')?.focus({ preventScroll: true });
    };
    document.addEventListener('click', activate);
    return () => {
      document.removeEventListener('click', activate);
      resumeWarming.current?.(); resumeWarming.current = null;
    };
  }, []);

  useEffect(() => {
    if (!open || ready) return;
    let active = true;
    void waitForStoryMedia(true).then(() => { if (active) { setError(false); setReady(true); } })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [open, ready, retry]);

  useEffect(() => {
    if (!open || !ready || !('IntersectionObserver' in window)) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let observer: IntersectionObserver | undefined;
    const update = () => {
      observer?.disconnect(); setMotion(!media.matches);
      if (media.matches) return;
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer?.unobserve(entry.target); }
      }), { root: scroller.current, threshold: .15 });
      scroller.current?.querySelectorAll('.wellness-reveal').forEach(element => observer!.observe(element));
    };
    update(); media.addEventListener('change', update);
    return () => { observer?.disconnect(); media.removeEventListener('change', update); };
  }, [open, ready]);

  return <dialog id="wellness-viewer" ref={dialog} className="wellness-viewer"
    aria-labelledby={ready ? 'wellness-hero-title' : undefined} aria-label={ready ? undefined : loadingTitle}
    data-motion={motion ? '' : undefined} data-ready={ready ? '' : undefined}
    onClose={() => {
      // Ignore a queued native close from an earlier opening.
      if (dialog.current?.open) return;
      resumeWarming.current?.(); resumeWarming.current = null;
      setOpen(false); opener.current?.focus({ preventScroll: true });
      requestAnimationFrame(() => { if (!dialog.current?.open) window.scrollTo({ top: savedScroll.current, behavior: 'instant' }); });
    }} onClick={event => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-wellness-close]')) dialog.current?.close();
      if (target === event.currentTarget) {
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.current?.close();
      }
    }} onKeyDown={event => {
      if (event.key === 'Tab') {
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')].filter(element => element.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        return;
      }
      const viewport = scroller.current;
      if (!viewport || event.target !== viewport || event.ctrlKey || event.metaKey || event.altKey) return;
      const delta: Record<string, number> = { ArrowDown: 60, ArrowUp: -60, PageDown: viewport.clientHeight * .85, PageUp: -viewport.clientHeight * .85, ' ': viewport.clientHeight * .85 * (event.shiftKey ? -1 : 1) };
      const top = event.key === 'Home' ? 0 : event.key === 'End' ? viewport.scrollHeight : event.key in delta ? viewport.scrollTop + delta[event.key] : null;
      if (top !== null) { event.preventDefault(); viewport.scrollTo({ top, behavior: 'instant' }); }
    }}>
    <button type="button" className="wellness-close" aria-label={closeLabel} onClick={() => dialog.current?.close()} autoFocus>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
    </button>
    <div className="wellness-scroll" ref={scroller} tabIndex={0}>
      {open && (ready ? children : <div className="wellness-wait"><LoadingStatus locale={locale} error={error} onRetry={() => {
        retryStoryMedia(); setError(false); setRetry(value => value + 1);
      }} /></div>)}
    </div>
  </dialog>;
}
