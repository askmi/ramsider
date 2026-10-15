'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import type { Locale } from '@/lib/i18n';
import { certificates, type CertificateId } from '@/lib/certificates';
import { certificateCopy } from '@/lib/certificate-copy';
import { LoadingStatus, useScrollLock } from './MediaLoading';
import type { CertificateDocumentProps } from './CertificateDocument';

export function CertificateViewer({ locale, closeLabel }: {locale: Locale; closeLabel: string}) {
 const [selection, setSelection] = useState<{id: CertificateId; title: string} | null>(null);
 const [Renderer, setRenderer] = useState<ComponentType<CertificateDocumentProps> | null>(null);
 const [chunkError, setChunkError] = useState(false);
 const dialog = useRef<HTMLDialogElement>(null);
 const opener = useRef<HTMLAnchorElement | null>(null);
 const copy = certificateCopy(locale);
 useScrollLock(selection !== null);
 useEffect(() => {
  let alive = true;
  const activate = (event: MouseEvent) => {
   if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
   const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-certificate]');
   const id = link?.dataset.certificate;
   if (!link || !id || !(id in certificates)) return;
   event.preventDefault();
   opener.current = link;
   setSelection({id:id as CertificateId, title:link.dataset.title ?? ''});
  };
  // A failed module import is cached by the browser/bundler. A one-shot reload
  // retries that resource and restores only the explicitly requested document.
  try {
   const id = sessionStorage.getItem('certificate-retry');
   const link = id && id in certificates ? document.querySelector<HTMLAnchorElement>(`a[data-certificate="${id}"]`) : null;
   if (link) queueMicrotask(() => {if (alive) {sessionStorage.removeItem('certificate-retry');opener.current=link;setSelection({id:id as CertificateId,title:link.dataset.title ?? ''});}});
  } catch { /* Storage is optional; direct PDF links remain available. */ }
  document.addEventListener('click', activate);
  return () => {alive = false;document.removeEventListener('click', activate);};
 }, []);
 useEffect(() => {
  if (selection && dialog.current && !dialog.current.open) dialog.current.showModal();
 }, [selection]);
 useEffect(() => {
  if (!selection || Renderer) return;
  let active = true;
  const deadline = setTimeout(() => {if (active) {active = false;setChunkError(true);}},30000);
  import('./CertificateDocument').then(module => {if (active) setRenderer(() => module.default);}).catch(() => {if (active) setChunkError(true);}).finally(() => clearTimeout(deadline));
  return () => {active = false;clearTimeout(deadline);};
 }, [selection, Renderer]);
 const reloadSelection = () => {if (!selection) return;try {sessionStorage.setItem('certificate-retry',selection.id);location.reload();} catch {location.assign(certificates[selection.id].href);}};
 const close = () => {
  dialog.current?.close();
  setSelection(null);
  setChunkError(false);
  opener.current?.focus({preventScroll:true});
 };
 return <dialog ref={dialog} id="certificate-viewer" className="certificate-viewer" aria-labelledby="certificate-title" onKeyDown={event => {
   if (event.key !== 'Tab') return;
   const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary,[tabindex="0"]')].filter(node => node.getClientRects().length && !node.closest('[inert]'));
   const index = controls.indexOf(document.activeElement as HTMLElement);
   if (index < 0 || (event.shiftKey ? index === 0 : index === controls.length-1)) {
    event.preventDefault();(event.shiftKey ? controls.at(-1) : controls[0])?.focus();
   }
  }} dir={locale === 'ar' ? 'rtl' : 'ltr'} onCancel={event => {event.preventDefault();close();}} onClose={() => {if (!dialog.current?.open) setSelection(null);}}>
  {selection && <>
   <header className="certificate-header"><h2 id="certificate-title">{selection.title}</h2><button type="button" onClick={close} autoFocus>{closeLabel}</button></header>
   <a className="certificate-original" href={certificates[selection.id].href} target="_blank" rel="noopener noreferrer">{copy.original} ↗</a>
   <div className="certificate-body">
    {Renderer ? <Renderer key={selection.id} source={certificates[selection.id]} title={selection.title} locale={locale} copy={copy} onReload={reloadSelection} /> : <LoadingStatus locale={locale} labels={copy} spinner error={chunkError} onRetry={reloadSelection} />}
   </div>
  </>}
 </dialog>;
}
