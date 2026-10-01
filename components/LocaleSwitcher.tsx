'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';

const options: { locale: Locale; name: string; flag: string }[] = [
  { locale: 'en', name: 'English', flag: '🇬🇧' },
  { locale: 'ru', name: 'Русский', flag: '🇷🇺' },
  { locale: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { locale: 'fr', name: 'Français', flag: '🇫🇷' },
  { locale: 'es', name: 'Español', flag: '🇪🇸' },
  { locale: 'it', name: 'Italiano', flag: '🇮🇹' },
  { locale: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { locale: 'ar', name: 'العربية', flag: '🇦🇪' },
  { locale: 'zh', name: '中文', flag: '🇨🇳' },
  { locale: 'ja', name: '日本語', flag: '🇯🇵' },
  { locale: 'ko', name: '한국어', flag: '🇰🇷' },
];
const scrollKey = 'ramsider:locale-scroll';
const visibleArtWaitMs = 3000;
export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = options.find(option => option.locale === locale)!;

  useEffect(() => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(scrollKey); } catch { return; }
    if (!saved) return;
    let target: { locale: Locale; y: number };
    try { target = JSON.parse(saved); } catch {
      try { sessionStorage.removeItem(scrollKey); } catch { /* Storage may be unavailable. */ }
      return;
    }
    if (target.locale !== locale) return;
    const restore = () => scrollTo({ top: target.y, behavior: 'instant' });
    const frame = requestAnimationFrame(() => {
      restore();
      try { sessionStorage.removeItem(scrollKey); } catch { /* Storage may be unavailable. */ }
    });
    const timeout = setTimeout(restore, 60);
    return () => { cancelAnimationFrame(frame); clearTimeout(timeout); };
  }, [locale]);

  useEffect(() => {
    if (!open) return;
    document.getElementById(`locale-option-${locale}`)?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
      if (event.key === 'Tab') {
        setTimeout(() => {
          if (!container.current?.contains(document.activeElement)) setOpen(false);
        }, 0);
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnKeyboard);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnKeyboard);
    };
  }, [locale, open]);

  return <div className="locale-switcher" aria-busy={pending} ref={container}>
    <button
      id="locale-toggle"
      ref={trigger}
      className="locale-toggle"
      type="button"
      disabled={pending}
      aria-label={`${label}: ${selected.name}`}
      aria-expanded={open}
      aria-controls="locale-options"
      onClick={() => {
        const menu = document.querySelector<HTMLDetailsElement>('.menu');
        if (menu?.open) menu.open = false;
        setOpen(value => !value);
      }}
    >
      <span className="locale-toggle-face">
        <span className="locale-flag" aria-hidden="true">{selected.flag}</span>
        <span className="locale-code">{locale.toUpperCase()}</span>
        <svg className="locale-chevron" viewBox="0 0 12 8" aria-hidden="true"><path d="m1 1 5 5 5-5" /></svg>
      </span>
    </button>
    {open && <nav
      id="locale-options"
      className="locale-options"
      aria-label={label}
      onKeyDown={event => {
        const links = [...event.currentTarget.querySelectorAll('a')];
        const index = links.indexOf(document.activeElement as HTMLAnchorElement);
        if (index < 0) return;
        let next = index;
        if (event.key === 'ArrowDown') next = (index + 1) % links.length;
        else if (event.key === 'ArrowUp') next = (index - 1 + links.length) % links.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = links.length - 1;
        else return;
        event.preventDefault();
        links[next].focus();
      }}
    >
      <ul>
        {options.map(option => <li key={option.locale}>
          <Link
            id={`locale-option-${option.locale}`}
            href={`/${option.locale}`}
            hrefLang={option.locale}
            lang={option.locale}
            prefetch={false}
            scroll={false}
            aria-current={option.locale === locale ? 'page' : undefined}
            onClick={event => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              if (option.locale === locale) {
                event.preventDefault();
                setOpen(false);
                trigger.current?.focus();
                return;
              }
              event.preventDefault();
              const nextPath = `/${option.locale}`;
              const y = scrollY;
              setPending(true);
              setOpen(false);
              void (async () => {
                // The artwork URLs are shared by every locale. Keep this document visible
                // until its current artwork is decoded; navigation then reuses those assets.
                const visibleArt = [...document.querySelectorAll<HTMLImageElement>('.art img, .tail-art img')]
                  .filter(image => {
                    const rect = image.getBoundingClientRect();
                    return rect.bottom > 0 && rect.top < innerHeight;
                  });
                let timeout: ReturnType<typeof setTimeout> | undefined;
                await Promise.race([
                  Promise.allSettled(visibleArt.map(image => image.decode())),
                  new Promise<void>(resolve => { timeout = setTimeout(resolve, visibleArtWaitMs); }),
                ]);
                clearTimeout(timeout);
                try { sessionStorage.setItem(scrollKey, JSON.stringify({ locale: option.locale, y })); } catch { /* Navigation still works if storage is unavailable. */ }
                location.assign(nextPath);
                setTimeout(() => setPending(false), 10000);
              })();
            }}
          >
            <span className="locale-flag" aria-hidden="true">{option.flag}</span>
            <span dir={option.locale === 'ar' ? 'rtl' : 'ltr'}>{option.name}</span>
          </Link>
        </li>)}
      </ul>
    </nav>}
  </div>;
}
