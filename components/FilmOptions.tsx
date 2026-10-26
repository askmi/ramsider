'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { FilmOptionsCopy } from '@/lib/product-film';
import { selectFilmQuality, selectFilmRate, type FilmSettings } from '@/lib/film-playback';

const speeds = [.5, .75, 1, 1.25, 1.5, 2];

/** In-flow settings leave the moving picture and native transport controls clear. */
export function FilmOptions({ media, copy }: { media: RefObject<HTMLVideoElement | null>; copy: FilmOptionsCopy }) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<'quality' | 'speed'>('quality');
  const [rate, setRate] = useState(1);
  const [settings, setSettings] = useState<FilmSettings>({ available: [], selected: null, adaptive: true });
  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };

  useEffect(() => {
    const video = media.current;
    if (!video) return;
    const update = (event: Event) => {
      const value = (event as CustomEvent<FilmSettings>).detail;
      setSettings(value);
      if (!value.available.length) setOpen(false);
    };
    const speed = () => setRate(video.playbackRate);
    video.addEventListener('film-settings', update);
    video.addEventListener('ratechange', speed);
    return () => { video.removeEventListener('film-settings', update); video.removeEventListener('ratechange', speed); };
  }, [media]);

  useEffect(() => {
    if (!open) return;
    // Collapse after the click completes: hiding an in-flow menu on pointerdown
    // would recenter the dialog and move its Close button before pointerup.
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus({ preventScroll: true }); }
    };
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape, true);
    return () => { document.removeEventListener('click', outside); document.removeEventListener('keydown', escape, true); };
  }, [open]);

  return <div ref={root} className="film-options" data-open={open}>
    <button ref={trigger} className="film-options__trigger" type="button" aria-expanded={open} aria-controls="film-options-menu" onClick={() => { setPane('quality'); setOpen(value => !value); }}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 17h16M8 4v6m8 4v6" /></svg>
      <span>{copy.options}</span><span className="film-options__value" dir="ltr"><bdi>{settings.selected === null ? copy.auto : `${settings.selected}p`}</bdi> · <bdi>{rate}×</bdi></span>
      <svg className="film-options__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
    </button>
    <div id="film-options-menu" className="film-options__menu" hidden={!open}>
      <div className="film-options__sections" role="group" aria-label={copy.options}>
        <button type="button" aria-pressed={pane === 'quality'} aria-controls="film-quality-options" onClick={() => setPane('quality')}>{copy.quality}</button>
        <button type="button" aria-pressed={pane === 'speed'} aria-controls="film-speed-options" onClick={() => setPane('speed')}>{copy.speed}</button>
      </div>
      <fieldset id="film-quality-options" hidden={pane !== 'quality'} disabled={!settings.available.length}>
        <legend className="visually-hidden">{copy.quality}</legend>
        <div className="film-options__choices">
          {settings.adaptive && <label><input type="radio" name="film-quality" value="auto" checked={settings.selected === null} onChange={() => { if (media.current) selectFilmQuality(media.current, null); close(); }} /><span>{copy.auto}</span></label>}
          {[...new Set(settings.available)].sort((a, b) => b - a).map(height => <label key={height}><input type="radio" name="film-quality" value={height} checked={settings.selected === height} onChange={() => { if (media.current) selectFilmQuality(media.current, height); close(); }} /><span>{height}p</span></label>)}
        </div>
      </fieldset>
      <fieldset id="film-speed-options" hidden={pane !== 'speed'}>
        <legend className="visually-hidden">{copy.speed}</legend>
        <div className="film-options__choices film-options__speeds">
          {speeds.map(value => <label key={value}><input type="radio" name="film-speed" value={value} checked={rate === value} onChange={() => { if (media.current) selectFilmRate(media.current, value); setRate(value); close(); }} /><span dir="ltr">{value}×</span></label>)}
        </div>
      </fieldset>
      {settings.adaptive && pane === 'quality' && <p className="film-options__hint">{copy.hint}</p>}
    </div>
  </div>;
}
