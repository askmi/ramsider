'use client';

import { useRef, type ReactNode } from 'react';

export function MenuShell({ label, children }: { label: string; children: ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);

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
