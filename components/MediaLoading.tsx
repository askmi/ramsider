'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n';

const copy: Record<Locale, [string, string, string]> = {
  en: ['Loading image…', 'The image could not load.', 'Retry'],
  ru: ['Загрузка изображения…', 'Не удалось загрузить изображение.', 'Повторить'],
  de: ['Bild wird geladen…', 'Das Bild konnte nicht geladen werden.', 'Erneut versuchen'],
  fr: ['Chargement de l’image…', 'Impossible de charger l’image.', 'Réessayer'],
  es: ['Cargando imagen…', 'No se pudo cargar la imagen.', 'Reintentar'],
  it: ['Caricamento immagine…', 'Impossibile caricare l’immagine.', 'Riprova'],
  tr: ['Görsel yükleniyor…', 'Görsel yüklenemedi.', 'Tekrar dene'],
  ar: ['جارٍ تحميل الصورة…', 'تعذّر تحميل الصورة.', 'إعادة المحاولة'],
  zh: ['正在加载图片…', '图片加载失败。', '重试'],
  ja: ['画像を読み込み中…', '画像を読み込めませんでした。', '再試行'],
  ko: ['이미지 로딩 중…', '이미지를 불러올 수 없습니다.', '다시 시도'],
};

export function LoadingStatus({ locale, progress = null, error = false, onRetry }: {
  locale: Locale; progress?: number | null; error?: boolean; onRetry?: () => void;
}) {
  const value = progress === null ? null : Math.max(0, Math.min(100, progress));
  const [loading, failed, retry] = copy[locale];
  return <div className="media-loading" role="status" aria-live="polite" dir={locale === 'ar' ? 'rtl' : undefined}>
    {!error && <div className="media-orbit" role="progressbar" aria-label={loading} aria-valuemin={0} aria-valuemax={100} {...(value !== null ? {'aria-valuenow':Math.floor(value)} : {})}>
      <span className="media-orbit__scale" style={{transform:`scale(${value===null?1:Math.max(0,1-value/100)})`}}><span className="media-orbit__milk" /></span>
    </div>}
    <p className={error?'media-loading__error':'visually-hidden'}>{error?failed:loading}</p>
    {error && onRetry && <button type="button" onClick={onRetry}>{retry}</button>}
  </div>;
}

/** Keep the final zero-radius frame long enough to animate before removing the indicator. */
export function MediaFeedback({active,className,...props}:Parameters<typeof LoadingStatus>[0]&{active:boolean;className?:string}){
 const [visible,setVisible]=useState(active),[finished,setFinished]=useState(false);
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>|undefined;
  if(active){queueMicrotask(()=>{setVisible(true);setFinished(false);});}
  else{queueMicrotask(()=>setFinished(true));timer=setTimeout(()=>setVisible(false),320);}
  return()=>clearTimeout(timer);
 },[active]);
 return visible?<div className={className}><LoadingStatus {...props} progress={finished?100:props.progress}/></div>:null;
}

let locks = 0;
let restore: (() => void) | undefined;
/** Multiple media views can own a lock without prematurely unlocking each other. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (locks++ === 0) {
      const roots = [document.documentElement, document.body];
      const previous = roots.map(element => ({ overflow: element.style.overflow, overscroll: element.style.overscrollBehavior, scrollBehavior: element.style.scrollBehavior }));
      // Cancel a smooth anchor/opener scroll already in flight before freezing the view.
      window.scrollTo({ left: scrollX, top: scrollY, behavior: 'instant' });
      roots.forEach(element => { element.style.overflow = 'hidden'; element.style.overscrollBehavior = 'none'; element.style.scrollBehavior = 'auto'; });
      const keydown = (event: KeyboardEvent) => {
        if (document.querySelector('dialog[open]') || (event.target as Element)?.closest('button,input,textarea,select,a')) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) event.preventDefault();
      };
      const preventScroll = (event: Event) => {
        if ((event.target as Element)?.closest?.('dialog[open]')) return;
        event.preventDefault();
      };
      document.addEventListener('keydown', keydown);
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      restore = () => {
        roots.forEach((element, index) => { element.style.overflow = previous[index].overflow; element.style.overscrollBehavior = previous[index].overscroll; element.style.scrollBehavior = previous[index].scrollBehavior; });
        document.removeEventListener('keydown', keydown);
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
      };
    }
    return () => { if (--locks === 0) { restore?.(); restore = undefined; } };
  }, [active]);
}
