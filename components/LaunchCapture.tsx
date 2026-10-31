'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { company } from '@/lib/company';
import type { LaunchCopy } from '@/lib/launch-copy';
import styles from './LaunchCapture.module.css';

type Intent = 'updates' | 'callback';
type Receipt = { updates: boolean; callback: boolean; confirmation: boolean; uncertain?: boolean };
const receiptKey = 'uno-launch-2026-receipt-v1';
const emptyReceipt: Receipt = { updates: false, callback: false, confirmation: false };

function readReceipt(fallback: Receipt = emptyReceipt): Receipt {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(receiptKey) ?? 'null');
    if (saved && typeof saved === 'object' && 'updates' in saved && 'callback' in saved && 'confirmation' in saved
      && typeof saved.updates === 'boolean' && typeof saved.callback === 'boolean' && typeof saved.confirmation === 'boolean'
      && (!('uncertain' in saved) || typeof saved.uncertain === 'boolean')) return {
        updates: saved.updates, callback: saved.callback, confirmation: saved.confirmation,
        ...('uncertain' in saved && saved.uncertain === true ? { uncertain: true } : {}),
      };
  } catch { /* Storage is optional; this cannot guarantee durable deduplication. */ }
  return fallback;
}

function persistReceipt(receipt: Receipt) {
  try {
    if (receipt.updates || receipt.callback || receipt.uncertain) localStorage.setItem(receiptKey, JSON.stringify(receipt));
    else localStorage.removeItem(receiptKey);
  } catch { /* Optional convenience; never a durable server ledger. */ }
}

/** No marketing SDK or contact data in browser storage. Server acknowledgement owns success. */
export function LaunchCapture({ copy }: { copy: LaunchCopy }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const request = useRef<AbortController | null>(null);
  const attempt = useRef<{ body: string; key: string } | null>(null);
  const [visible, setVisible] = useState(false);
  const [intent, setIntent] = useState<Intent>('updates');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [deliveryUnknown, setDeliveryUnknown] = useState(false);
  const [receipt, setReceipt] = useState<Receipt>(emptyReceipt);
  const [showReceipt, setShowReceipt] = useState(false);
  const [source, setSource] = useState('launch-floating');

  useEffect(() => {
    const hero = document.getElementById('hero-reserve');
    let receiptLoaded = false;
    const observer = new IntersectionObserver(entries => {
      if (!receiptLoaded) {
        receiptLoaded = true; const saved = request.current ? emptyReceipt : readReceipt(); setReceipt(saved);
        if (saved.uncertain) setDeliveryUnknown(true);
      }
      setVisible(entries[0].boundingClientRect.bottom < 0);
    });
    if (hero) observer.observe(hero);
    return () => { observer.disconnect(); request.current?.abort(); };
  }, []);

  function open(trigger: HTMLElement) {
    const currentReceipt = request.current ? receipt : readReceipt(receipt);
    setReceipt(currentReceipt);
    const parent = trigger.closest('dialog');
    opener.current = (parent?.dataset.opener && document.getElementById(parent.dataset.opener)) || trigger;
    setSource(parent?.dataset.opener || 'launch-floating');
    const uncertain = deliveryUnknown || currentReceipt.uncertain === true;
    setDeliveryUnknown(uncertain);
    setError(uncertain ? copy.deliveryUnknown : '');
    const nextIntent = pending ? intent : trigger.id === 'launch-floating' && currentReceipt.callback && !currentReceipt.updates ? 'callback' : 'updates';
    if (!pending) { setIntent(nextIntent); setEmailOptIn(false); }
    setShowReceipt(currentReceipt[nextIntent]);
    if (parent instanceof HTMLDialogElement) parent.close();
    dialog.current?.showModal();
    if (dialog.current) dialog.current.scrollTop = 0;
    heading.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const openFromNotice = (event: MouseEvent) => {
      const trigger = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-launch-open]') : null;
      if (trigger) open(trigger);
    };
    document.addEventListener('click', openFromNotice);
    return () => document.removeEventListener('click', openFromNotice);
  });

  function choose(next: Intent) {
    setIntent(next);
    setError(deliveryUnknown ? copy.deliveryUnknown : '');
    setShowReceipt(receipt[next]);
  }

  function restoreFocus() {
    const original = opener.current;
    const visibleOriginal = original?.isConnected && !original.hidden && original.getClientRects().length > 0;
    const target = visibleOriginal ? original : document.getElementById('back-to-top') ?? document.getElementById('hero-reserve');
    target?.focus({ preventScroll: true });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (request.current || deliveryUnknown) return;
    const currentReceipt = readReceipt(receipt);
    setReceipt(currentReceipt);
    if (currentReceipt.uncertain) {
      setDeliveryUnknown(true); setError(copy.deliveryUnknown); return;
    }
    if (currentReceipt[intent]) { setShowReceipt(true); return; }
    const form = event.currentTarget;
    const fields = new FormData(form);
    const phone = form.elements.namedItem('phone') as HTMLInputElement | null;
    if (phone) {
      const normalized = phone.value.replace(/[\s()-]/g, '');
      phone.setCustomValidity(/^\+[1-9]\d{7,14}$/.test(normalized) ? '' : copy.phoneError);
    }
    if (!form.reportValidity()) return;
    const body = JSON.stringify({
      intent, name: String(fields.get('name') ?? '').trim(),
      email: String(fields.get('email') ?? '').trim(), phone: String(fields.get('phone') ?? '').trim(),
      emailOptIn: intent === 'updates' || emailOptIn,
      website: String(fields.get('website') ?? ''), source,
    });
    if (attempt.current?.body !== body) attempt.current = { body, key: crypto.randomUUID() };
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setPending(true); setError('');
    // Navigation/tab close may prevent the catch handler from running after SMTP accepted the mail.
    persistReceipt({ ...currentReceipt, uncertain: true });
    let definitelyRejected = false;
    try {
      const response = await fetch('/api/launch-list', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current.key },
        body, signal: controller.signal,
      });
      const result: unknown = await response.json();
      if (response.status !== 409 && result && typeof result === 'object' && 'accepted' in result && result.accepted === false) {
        definitelyRejected = true;
        throw new Error(response.status === 503 ? 'unavailable' : 'failed');
      }
      if (!result || typeof result !== 'object' || !('accepted' in result) || result.accepted !== true
        || !response.ok || !('confirmationRequired' in result) || typeof result.confirmationRequired !== 'boolean') throw new Error('uncertain');
      const next: Receipt = {
        updates: currentReceipt.updates || intent === 'updates' || emailOptIn,
        callback: currentReceipt.callback || intent === 'callback',
        confirmation: result.confirmationRequired || (currentReceipt.confirmation && intent !== 'updates' && !emailOptIn),
      };
      setDeliveryUnknown(false); setReceipt(next); setShowReceipt(true);
      persistReceipt(next);
      form.reset(); setEmailOptIn(false); attempt.current = null;
      if (dialog.current) dialog.current.scrollTop = 0;
      heading.current?.focus({ preventScroll: true });
    } catch (failure) {
      if (!definitelyRejected) {
        const uncertain = { ...currentReceipt, uncertain: true };
        setDeliveryUnknown(true); setReceipt(uncertain); setError(copy.deliveryUnknown);
        persistReceipt(uncertain);
      } else {
        persistReceipt(currentReceipt); setDeliveryUnknown(false);
        setError(failure instanceof Error && failure.message === 'unavailable' ? copy.unavailable : copy.error);
      }
    } finally {
      clearTimeout(timeout); request.current = null; setPending(false);
    }
  }

  const successTitle = receipt.confirmation ? copy.confirmationTitle : receipt.callback && receipt.updates ? copy.bothReceived : receipt.callback ? copy.callbackReceived : copy.updatesReceived;
  const successBody = receipt.confirmation ? receipt.callback ? copy.callbackConfirmationNext : copy.confirmationNext : receipt.callback && receipt.updates ? copy.bothNext : receipt.callback ? copy.callbackNext : copy.updatesNext;
  return <>
    <button id="launch-floating" className={styles.launcher} type="button" hidden={!visible}
      aria-haspopup="dialog" aria-controls="launch-capture" onClick={event => open(event.currentTarget)}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16v12H4zM4 6l8 7 8-7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
      {receipt.uncertain ? copy.pendingStatus : receipt.updates || receipt.callback ? copy.received : copy.launcher}
    </button>
    <dialog id="launch-capture" ref={dialog} className={styles.dialog} aria-labelledby="launch-title"
      onClose={restoreFocus}>
      <button type="button" className={styles.close} aria-label={copy.close} onClick={() => dialog.current?.close()}><span aria-hidden="true">×</span></button>
      <p className={styles.brand}>{copy.brand}</p>
      <p className={styles.date}>{copy.date}</p>
      <div className={styles.choices} role="group" aria-label={copy.choiceLabel}>
        <button type="button" aria-pressed={intent === 'updates'} disabled={pending} onClick={() => choose('updates')}>{copy.updates}</button>
        <button type="button" aria-pressed={intent === 'callback'} disabled={pending} onClick={() => choose('callback')}>{copy.callback}</button>
      </div>
      <h2 id="launch-title" ref={heading} tabIndex={-1}>{showReceipt ? successTitle : intent === 'updates' ? copy.updatesTitle : copy.callbackTitle}</h2>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {showReceipt ? <div className={styles.success}>
        <span className={styles.successMark} aria-hidden="true">✓</span>
        <p className={styles.intro} role="status">{successBody}</p>
        <button type="button" className={styles.primary} onClick={() => dialog.current?.close()}>{copy.done}</button>
        {!deliveryUnknown && <button type="button" className={styles.secondary} onClick={() => {
          if (readReceipt(receipt).uncertain) { setDeliveryUnknown(true); setError(copy.deliveryUnknown); return; }
          setReceipt(emptyReceipt); setShowReceipt(false); setError(''); persistReceipt(emptyReceipt);
        }}>{copy.otherContact}</button>}
      </div> : <>
        <p className={styles.intro}>{intent === 'updates' ? copy.updatesBody : copy.callbackBody}</p>
        <form className={styles.form} onSubmit={submit}>
          {intent === 'callback' && <label className={styles.field}>{copy.phone}
            <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required disabled={pending} maxLength={32} aria-describedby="launch-phone-hint" onInput={event => event.currentTarget.setCustomValidity('')} />
            <span id="launch-phone-hint" className={styles.hint}>{copy.phoneHint}</span>
          </label>}
          {(intent === 'updates' || emailOptIn) && <label className={styles.field}>{copy.email}
            <input name="email" type="email" autoComplete="email" required disabled={pending} maxLength={254} />
          </label>}
          <label className={styles.field}>{copy.name}<input name="name" type="text" autoComplete="name" disabled={pending} maxLength={80} /></label>
          {intent === 'callback' && <label className={styles.optIn}>
            <input name="emailOptIn" type="checkbox" checked={emailOptIn} disabled={pending} onChange={event => setEmailOptIn(event.target.checked)} />{copy.emailOptIn}
          </label>}
          <div className={styles.trap} aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          {(intent === 'updates' || emailOptIn) && <p className={styles.permission}>{copy.emailPermission}</p>}
          <button type="submit" className={styles.primary} disabled={pending || deliveryUnknown}>{pending ? copy.sending : intent === 'updates' ? copy.join : copy.callback}</button>
        </form>
      </>}
      <details className={styles.privacy}><summary>{copy.privacy}</summary>
        <p>{copy.privacyBody} <a href={company.emailHref}>{company.email}</a>.</p>
        <p>{company.name}<br />{company.address}</p>
      </details>
      <p className={styles.noOrder}>{copy.noOrder}</p>
    </dialog>
  </>;
}
