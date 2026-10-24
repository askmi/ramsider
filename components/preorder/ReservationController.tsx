'use client';

import { useEffect } from 'react';

type Copy = Record<string, string>;
const models = {
  pro: { name: 'UNO Pro Line', initial: 599, final: 400, total: 999, finish: 'Pro Line finish', reservoir: 'Tinted reservoir', hose: 'Black braided hose · carbon-fiber mouthpiece' },
  gold: { name: 'UNO Gold Line', initial: 999, final: 1000, total: 1999, finish: 'Gold Line finish', reservoir: 'Transparent reservoir', hose: 'White braided hose · titanium mouthpiece' },
} as const;
type Model = keyof typeof models;
const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

/** Enhance the server-rendered reference form. No API, storage, analytics or payment in this preview. */
export function ReservationController({ copy }: { copy: Copy }) {
  useEffect(() => {
    const root = document.getElementById('uno-document');
    if (!root) return;
    const byId = <T extends HTMLElement = HTMLElement>(id: string): T => {
      const element = root.querySelector<T>(`#${id}`);
      if (!element) throw new Error(`Missing reservation element: ${id}`);
      return element;
    };
    const text = (key: string) => copy[key] ?? key;
    const form = byId<HTMLFormElement>('reservation-form');
    const country = byId<HTMLSelectElement>('country');
    const name = byId<HTMLInputElement>('full-name');
    const email = byId<HTMLInputElement>('email');
    const age = byId<HTMLInputElement>('age');
    const terms = byId<HTMLInputElement>('terms');
    const radios = Array.from(root.querySelectorAll<HTMLInputElement>('input[name="model"]'));
    const signalController = new AbortController();
    const { signal } = signalController;
    let selected: Model = radios.find(r => r.checked)?.value === 'gold' ? 'gold' : 'pro';
    let submitted = false;
    let copyVersion = 0;
    const requested = new URLSearchParams(window.location.search).get('model');
    if (requested === 'pro' || requested === 'gold') selected = requested;
    const aed = (n: number) => `≈ AED ${(Math.round(n * 3.6725 / 10) * 10).toLocaleString('en-US')} · ${text('reference, prices are in USD')}`;
    const focusSection = (id: string) => {
      const target = byId(id);
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    };
    const paintModel = (announce = false) => {
      const model = models[selected];
      const values: Record<string, string> = { name: text(model.name), finish: text(model.finish), reservoir: text(model.reservoir), hose: text(model.hose), initial: usd(model.initial), final: usd(model.final), total: usd(model.total), initialAed: aed(model.initial), finalAed: aed(model.final) };
      for (const node of root.querySelectorAll<HTMLElement>('[data-bind]')) node.textContent = values[node.dataset.bind ?? ''] ?? '';
      for (const radio of radios) radio.checked = radio.value === selected;
      for (const link of root.parentElement?.querySelectorAll<HTMLAnchorElement>('[data-preorder-language]') ?? []) link.href = `${link.href.split('?')[0]}?model=${selected}`;
      if (announce) byId('model-announcement').textContent = `${text(model.name)}. ${text('Selected model updated. Your set and all prices have been updated.')}`;
    };
    const paintMarket = () => {
      const contact = ['IN', 'TH', 'TR', 'QA', 'OTHER'].includes(country.value);
      byId('payment-option').hidden = contact;
      byId('market-notice').hidden = !contact;
      byId('invoice-note').hidden = contact;
      byId('next-payment-title').textContent = text(contact ? 'Delivery options' : 'Invoice');
      byId('next-payment-copy').textContent = text(contact ? 'We will contact you about delivery options' : 'Preview only. No invoice has been sent.');
      byId<HTMLButtonElement>('pay-now').disabled = true;
    };
    const reset = () => {
      copyVersion++;
      if (!submitted) return;
      submitted = false;
      byId('confirmation').hidden = true;
      byId('reservation-actions').hidden = false;
      byId('copy-status').textContent = '';
      byId('copy-number').textContent = text('Copy preview label');
    };
    const fields = [
      { el: name, error: 'name-error', valid: () => name.value.trim().length > 0, message: 'Enter your full name.' },
      { el: email, error: 'email-error', valid: () => email.validity.valid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), message: 'Enter a valid e-mail address.' },
      { el: country, error: 'country-error', valid: () => Boolean(country.value), message: 'Select the country of delivery.' },
      { el: age, error: 'age-error', valid: () => age.checked, message: 'Please confirm you are 18 or older.' },
      { el: terms, error: 'terms-error', valid: () => terms.checked, message: 'Please accept the pre-order terms and privacy policy.' },
    ];
    const validate = (field: typeof fields[number]) => {
      const valid = field.valid();
      byId(field.error).textContent = valid ? '' : text(field.message);
      if (valid) field.el.removeAttribute('aria-invalid'); else field.el.setAttribute('aria-invalid', 'true');
      return valid;
    };
    for (const radio of radios) radio.addEventListener('change', () => {
      if (!radio.checked) return;
      selected = radio.value === 'gold' ? 'gold' : 'pro'; reset(); paintModel(true);
    }, { signal });
    country.addEventListener('change', paintMarket, { signal });
    form.addEventListener('input', event => {
      reset();
      const field = fields.find(f => f.el === event.target);
      if (field?.el.hasAttribute('aria-invalid')) validate(field);
      if (!fields.some(f => f.el.hasAttribute('aria-invalid'))) byId('form-error').hidden = true;
    }, { signal });
    form.addEventListener('change', reset, { signal });
    form.addEventListener('submit', event => {
      event.preventDefault();
      name.value = name.value.trim(); email.value = email.value.trim();
      const invalid = fields.filter(f => !validate(f));
      const error = byId('form-error'); error.hidden = invalid.length === 0;
      if (invalid.length) { error.textContent = text('Please check the highlighted fields before reserving.'); invalid[0].el.focus(); return; }
      if (submitted) return;
      // This is a local preview. A future real service must validate on the server,
      // record versioned consent, use idempotency and return an actual reservation ID.
      byId('confirmation-email').textContent = email.value;
      byId('confirmation-country').textContent = country.selectedOptions[0]?.textContent ?? '';
      byId('reservation-number').textContent = 'PREVIEW';
      paintModel(); paintMarket(); submitted = true;
      byId('reservation-actions').hidden = true; byId('confirmation').hidden = false;
      focusSection('confirmation-title');
    }, { signal });
    byId('copy-number').addEventListener('click', async () => {
      const version = copyVersion;
      let copied = false;
      try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText('PREVIEW'); copied = true; } } catch { /* selectable fallback */ }
      if (signal.aborted || !submitted || version !== copyVersion) return;
      if (!copied) {
        const range = document.createRange(); range.selectNodeContents(byId('reservation-number'));
        const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
      }
      byId('copy-number').textContent = text(copied ? 'Copied' : 'Label selected');
      byId('copy-status').textContent = text(copied ? 'Preview label copied.' : 'Select and copy: PREVIEW');
    }, { signal });
    const restore = () => {
      const query = new URLSearchParams(window.location.search).get('model');
      if (query === 'pro' || query === 'gold') selected = query;
      else selected = radios.find(r => r.checked)?.value === 'gold' ? 'gold' : 'pro';
      reset(); paintModel(); paintMarket();
    };
    window.addEventListener('pageshow', restore, { signal });
    window.addEventListener('popstate', restore, { signal });
    paintModel(); paintMarket();
    byId<HTMLFieldSetElement>('model-controls').disabled = false;
    byId<HTMLFieldSetElement>('reservation-controls').disabled = false;
    root.dataset.reservationReady = 'true';
    return () => { signalController.abort(); delete root.dataset.reservationReady; };
  }, [copy]);
  return null;
}
