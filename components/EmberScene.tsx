'use client';

import { useEffect, useRef, useState } from 'react';
import type { EmberRenderer } from '@/lib/ember-renderer';

/** The original server-rendered artwork is always the fallback. */
export function EmberScene({ labels }: { labels: { pause: string; play: string } }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<EmberRenderer | null>(null);
  const paused = useRef(false);
  const [userPaused, setUserPaused] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const element = host.current!;
    const surface = canvas.current!;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false, near = false, visible = false, initializing = false, failed = false;
    let imagesReady = false;
    const art = [...element.closest('main')!.querySelectorAll<HTMLImageElement>('.art img')].slice(0, 2);
    const update = () => {
      if (disposed) return;
      const allowed = !motion.matches && !document.hidden && !document.querySelector('dialog[open]');
      element.dataset.motion = motion.matches ? 'reduced' : 'full';
      if (renderer.current) {
        renderer.current.setRunning(allowed && visible && !paused.current);
        return;
      }
      if (!near || !allowed || initializing || failed || !imagesReady) return;
      initializing = true;
      void import('@/lib/ember-renderer').then(module => module.createEmberRenderer(surface)).then(engine => {
        if (disposed) { engine.destroy(); return; }
        renderer.current = engine;
        setAvailable(true);
        update();
      }).catch(() => {
        failed = true;
        surface.dataset.state = 'fallback';
      }).finally(() => { initializing = false; });
    };
    const ready = () => {
      imagesReady = art.every(image => image.hasAttribute('data-media-ready'));
      update();
    };
    const imageObserver = new MutationObserver(ready);
    art.forEach(image => imageObserver.observe(image, { attributes: true, attributeFilter: ['data-media-ready'] }));
    const warm = new IntersectionObserver(([entry]) => { near = entry.isIntersecting; update(); }, { rootMargin: '64px' });
    const viewport = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    warm.observe(element); viewport.observe(element);
    const dialogs = new MutationObserver(update);
    document.querySelectorAll('dialog').forEach(dialog => dialogs.observe(dialog, { attributes: true, attributeFilter: ['open'] }));
    const lost = () => { failed = true; setAvailable(false); };
    surface.addEventListener('webglcontextlost', lost);
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
    element.addEventListener('ember-toggle', update);
    ready();
    return () => {
      disposed = true;
      warm.disconnect(); viewport.disconnect(); dialogs.disconnect(); imageObserver.disconnect();
      document.removeEventListener('visibilitychange', update);
      motion.removeEventListener('change', update);
      element.removeEventListener('ember-toggle', update);
      surface.removeEventListener('webglcontextlost', lost);
      renderer.current?.destroy(); renderer.current = null;
    };
  }, []);

  return <div ref={host} className="ember-scene" data-ember-scene>
    <canvas ref={canvas} className="ember-scene__canvas" aria-hidden="true" />
    <button type="button" className="ember-scene__toggle" hidden={!available}
      aria-label={userPaused ? labels.play : labels.pause} aria-pressed={userPaused}
      onClick={() => {
        paused.current = !paused.current;
        setUserPaused(paused.current);
        host.current?.dispatchEvent(new Event('ember-toggle'));
      }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{userPaused
        ? <path d="m9 6 9 6-9 6Z" />
        : <path d="M8 6h3v12H8zM15 6h3v12h-3z" />}</svg>
    </button>
  </div>;
}
