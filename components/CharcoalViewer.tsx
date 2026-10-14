'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useScrollLock } from './MediaLoading';
import { charcoalTiles } from '@/lib/charcoal-assets';
import { loadImage } from '@/lib/media-resource';

/** The reading content stays server-rendered; this shell owns only modal state. */
export function CharcoalViewer({ children, closeLabel }: { children: ReactNode; closeLabel: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const savedScroll = useRef(0);
  const keyboard = useRef(false);
  const [open, setOpen] = useState(false);
  useScrollLock(open);

  useEffect(() => {
    const warm = () => {
      for (const tile of charcoalTiles.flat()) void loadImage(tile.src, 'low').ready.catch(() => {});
    };
    if (document.readyState === 'complete') warm();
    else window.addEventListener('load', warm, { once: true });
    return () => window.removeEventListener('load', warm);
  }, []);

  useEffect(() => {
    const activate = (event: MouseEvent) => {
      const trigger = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-charcoal-open]') : null;
      if (!trigger || dialog.current?.open) return;
      event.preventDefault();
      opener.current = trigger;
      savedScroll.current = window.scrollY;
      keyboard.current = event.detail === 0;
      if (scroller.current) scroller.current.scrollTop = 0;
      setOpen(true);
      dialog.current?.showModal();
    };
    const key = () => { keyboard.current = true; opener.current?.removeAttribute('data-pointer-return'); };
    const pointer = () => { keyboard.current = false; };
    document.addEventListener('click', activate);
    document.addEventListener('keydown', key, true);
    document.addEventListener('pointerdown', pointer, true);
    return () => {
      document.removeEventListener('click', activate);
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('pointerdown', pointer, true);
    };
  }, []);

  return <dialog ref={dialog} id="charcoal-viewer" className="charcoal-viewer" aria-labelledby="charcoal-title" onKeyDown={event => {
    if (event.key !== 'Tab') {
      const viewport = scroller.current;
      if (!viewport || event.target !== viewport || event.ctrlKey || event.metaKey || event.altKey) return;
      const delta: Record<string, number> = { ArrowDown: 60, ArrowUp: -60, PageDown: viewport.clientHeight * .85, PageUp: -viewport.clientHeight * .85, ' ': viewport.clientHeight * .85 * (event.shiftKey ? -1 : 1) };
      const top = event.key === 'Home' ? 0 : event.key === 'End' ? viewport.scrollHeight : event.key in delta ? viewport.scrollTop + delta[event.key] : null;
      if (top !== null) { event.preventDefault(); viewport.scrollTo({ top, behavior: 'instant' }); }
      return;
    }
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')].filter(element => element.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }} onClose={() => {
    setOpen(false);
    if (!keyboard.current) opener.current?.setAttribute('data-pointer-return', '');
    opener.current?.focus({ preventScroll: true });
    requestAnimationFrame(() => window.scrollTo({ top: savedScroll.current, behavior: 'instant' }));
  }}>
    <button type="button" className="charcoal-viewer__close" aria-label={closeLabel} onClick={() => dialog.current?.close()} autoFocus>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg>
    </button>
    <div ref={scroller} className="charcoal-viewer__scroll" tabIndex={0}>
      {open ? children : null}
    </div>
  </dialog>;
}
