'use client';

import type { ReactNode } from 'react';

/** Server-rendered content, with native modal focus containment and Escape. */
export function DialogController({ children }: { children: ReactNode }) {
  return <div className="dialog-controller" onClick={event => {
    const target = event.target as Element;
    const trigger = target.closest<HTMLButtonElement>('button[popovertarget]');
    if (trigger) {
      const panel = document.getElementById(trigger.getAttribute('popovertarget') ?? '');
      if (panel instanceof HTMLDialogElement) {
        event.preventDefault();
        if (trigger.getAttribute('popovertargetaction') === 'hide') panel.close();
        else panel.showModal();
      }
    } else if (target.closest('a[href^="#"]')) {
      target.closest('dialog')?.close();
    }
  }}>{children}</div>;
}
