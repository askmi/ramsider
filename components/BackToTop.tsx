'use client';

import { useEffect, useState } from 'react';

/** A small viewport control for the long story, independent of its clipped artwork. */
export function BackToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setVisible(scrollY > Math.max(500, innerHeight * 0.75));
      });
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => {
      removeEventListener('scroll', update);
      removeEventListener('resize', update);
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!visible) return null;

  return <button
    id="back-to-top"
    className="back-to-top"
    type="button"
    aria-label={label}
    onClick={() => {
      document.getElementById('home-link')?.focus({ preventScroll: true });
      scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }}
  >
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="m5.5 14.5 6.5-6.5 6.5 6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </button>;
}
