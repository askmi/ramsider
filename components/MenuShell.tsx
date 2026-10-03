'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function MenuShell({ label, children }: { label: string; children: ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (details.current?.open && !details.current.contains(event.target as Node)) details.current.open = false;
    };
    const closeOnPageScroll = () => {
      if (details.current?.open) details.current.open = false;
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    window.addEventListener('scroll', closeOnPageScroll, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      window.removeEventListener('scroll', closeOnPageScroll);
    };
  }, []);

  return <details
    className="menu"
    ref={details}
    onKeyDown={event => {
      if (event.key === 'Escape' && details.current?.open) {
        details.current.open = false;
        details.current.querySelector('summary')?.focus();
      }
    }}
    onClick={event => {
      if ((event.target as HTMLElement).closest('a')?.getAttribute('href')?.startsWith('#') && details.current) {
        details.current.open = false;
      }
    }}
  >
    <summary id="navigation-toggle" aria-label={label}><span /><span /></summary>
    {children}
  </details>;
}
