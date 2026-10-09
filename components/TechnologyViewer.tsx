'use client';

import Image from 'next/image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent, TouchEvent } from 'react';
import type { Locale } from '@/lib/i18n';
import { TechnologyTitle } from './TechnologyTitle';
import { TechnologyDescriptions } from './TechnologyDescriptions';
import { CyberMindDescriptions } from './CyberMindDescriptions';
import type { TechnologyDescriptionCopy } from '@/lib/technology-descriptions';
import type { CyberMindCopy } from '@/lib/cybermind-descriptions';

import { technologyGroups, technologyGroupCopy } from '@/lib/technology-gallery';
import type { TechnologySlideId } from '@/lib/technology-descriptions';
import { loadImage } from '@/lib/media-resource';
import { LoadingStatus, useScrollLock } from './MediaLoading';

type ViewerCopy = { technology: string; horizontal: string; vertical: string; close: string; nextGroup: string; names: readonly [string, string, string, string] };
const copy: Record<Locale, ViewerCopy> = {
  en: { technology: 'Technology', horizontal: 'Swipe right for the next technology, left to return', vertical: 'Scroll vertically through the technology ribbon', close: 'Close technology viewer', nextGroup: 'Next Technology', names: ['Three heaters', 'Active air sails', 'Programmable heat profiles', 'Gold and titanium nitride'] },
  ru: { technology: 'Технология', horizontal: 'Свайп вправо — следующая технология, влево — обратно', vertical: 'Прокручивайте ленту технологии по вертикали', close: 'Закрыть просмотр технологий', nextGroup: 'Следующая технология', names: ['Три нагревателя', 'Активные воздушные паруса', 'Программируемые профили нагрева', 'Золото и нитрид титана'] },
  de: { technology: 'Technologie', horizontal: 'Nach rechts zur nächsten Technologie wischen, nach links zurück', vertical: 'Vertikal durch das Technologieband scrollen', close: 'Technologieansicht schließen', nextGroup: 'Nächste Technologie', names: ['Drei Heizelemente', 'Aktive Luftsegel', 'Programmierbare Wärmeprofile', 'Gold und Titannitrid'] },
  fr: { technology: 'Technologie', horizontal: 'Balayez à droite pour la technologie suivante, à gauche pour revenir', vertical: 'Faites défiler verticalement le ruban technologique', close: 'Fermer la galerie', nextGroup: 'Technologie suivante', names: ['Trois éléments chauffants', 'Volets d’air actifs', 'Profils de chauffe programmables', 'Or et nitrure de titane'] },
  es: { technology: 'Tecnología', horizontal: 'Desliza a la derecha para la siguiente tecnología y a la izquierda para volver', vertical: 'Desplázate verticalmente por la cinta tecnológica', close: 'Cerrar la galería', nextGroup: 'Siguiente tecnología', names: ['Tres calentadores', 'Aletas de aire activas', 'Perfiles de calor programables', 'Oro y nitruro de titanio'] },
  it: { technology: 'Tecnologia', horizontal: 'Scorri a destra per la tecnologia successiva e a sinistra per tornare', vertical: 'Scorri in verticale il nastro della tecnologia', close: 'Chiudi la galleria', nextGroup: 'Tecnologia successiva', names: ['Tre riscaldatori', 'Alette d’aria attive', 'Profili di calore programmabili', 'Oro e nitruro di titanio'] },
  tr: { technology: 'Teknoloji', horizontal: 'Sonraki teknoloji için sağa, geri dönmek için sola kaydırın', vertical: 'Teknoloji şeridini dikey kaydırın', close: 'Teknoloji görünümünü kapat', nextGroup: 'Sonraki teknoloji', names: ['Üç ısıtıcı', 'Aktif hava kanatları', 'Programlanabilir ısı profilleri', 'Altın ve titanyum nitrür'] },
  ar: { technology: 'تقنية', horizontal: 'اسحب إلى اليمين للتقنية التالية وإلى اليسار للعودة', vertical: 'مرّر شريط التقنية عمودياً', close: 'إغلاق معرض التقنيات', nextGroup: 'التقنية التالية', names: ['ثلاثة سخانات', 'زعانف هوائية نشطة', 'ملفات حرارة قابلة للبرمجة', 'الذهب ونتريد التيتانيوم'] },
  zh: { technology: '技术', horizontal: '向右滑动查看下一项技术，向左滑动返回', vertical: '上下滚动查看技术长图', close: '关闭技术图库', nextGroup: '下一项技术', names: ['三个加热器', '主动导流翼', '可编程加热曲线', '黄金与氮化钛'] },
  ja: { technology: 'テクノロジー', horizontal: '右にスワイプして次の技術へ、左にスワイプして戻る', vertical: '縦にスクロールして技術の画像を見る', close: '技術ギャラリーを閉じる', nextGroup: '次の技術', names: ['3つのヒーター', 'アクティブエアセイル', 'プログラム可能な加熱プロファイル', '金と窒化チタン'] },
  ko: { technology: '기술', horizontal: '오른쪽으로 스와이프하여 다음 기술로, 왼쪽으로 돌아가기', vertical: '기술 이미지 띠를 세로로 스크롤하세요', close: '기술 갤러리 닫기', nextGroup: '다음 기술', names: ['세 개의 히터', '액티브 에어 세일', '프로그래밍 가능한 열 프로필', '금과 질화 티타늄'] },
};

/** Mount the already decoded resource itself, rather than another not-yet-decoded IMG. */
function RetainedPhoto({ image, name }: { image: HTMLImageElement; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    image.setAttribute('alt', name);
    image.setAttribute('draggable', 'false');
    host.current?.replaceChildren(image);
  }, [image, name]);
  return <div className="technology-viewer__photo" ref={host} />;
}

export function TechnologyViewer({ locale, descriptions, cyberMindDescriptions }: { locale: Locale; descriptions: TechnologyDescriptionCopy; cyberMindDescriptions: CyberMindCopy }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const contentViewport = useRef<HTMLDivElement>(null);
  const lockedScroll = useRef(0);
  const pointer = useRef<{ x: number; y: number; id: number } | null>(null);
  const touch = useRef<{ x: number; y: number; id: number } | null>(null);
  const wheelGesture = useRef<{ lastAt: number; distance: number; verticalDistance: number; committed: boolean; axis: 'horizontal' | 'vertical' | null }>({ lastAt: 0, distance: 0, verticalDistance: 0, committed: false, axis: null });
  const displayed = useRef(0);
  const requested = useRef(0);
  const requestToken = useRef(0);
  const pending = useRef(false);
  const unsubscribe = useRef<(() => void)[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [groupIndex, setGroupIndex] = useState(0);
  const [photos, setPhotos] = useState<HTMLImageElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  useScrollLock(isOpen);
  const labels = copy[locale];
  const groupLabels = technologyGroupCopy[locale];
  const group = technologyGroups[groupIndex];
  const names = groupIndex === 0 ? labels.names : groupLabels.names;
  const clearSubscriptions = useCallback(() => {
    unsubscribe.current.forEach(stop => stop());
    unsubscribe.current = [];
  }, []);

  useLayoutEffect(() => {
    // Keep focus inside the dialog while disabled controls wait for a complete ribbon.
    if (loading && dialog.current?.open) dialog.current.focus({ preventScroll: true });
  }, [loading]);
  useLayoutEffect(() => {
    contentViewport.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [photos]);

  const select = useCallback((nextGroup: number) => {
    requested.current = nextGroup;
    pending.current = true;
    pointer.current = null;
    touch.current = null;
    const viewport = contentViewport.current;
    lockedScroll.current = viewport?.scrollTop ?? 0;
    viewport?.scrollTo({ top: lockedScroll.current, left: 0, behavior: 'instant' });
    setLoading(true);
    setFailed(false);
    const token = ++requestToken.current;
    clearSubscriptions();
    // Parallel group readiness; background warming still requests all six at low priority.
    const resources = technologyGroups[nextGroup].slides.map(slide => loadImage(slide.src, 'auto'));
    const update = () => {
      if (token !== requestToken.current) return;
      const total = resources.reduce((sum, resource) => sum + (resource.progress.total ?? 0), 0);
      const known = resources.every(resource => resource.progress.total !== null);
      const loaded = resources.reduce((sum, resource) => sum + resource.progress.loaded, 0);
      setProgress(known && total > 0 ? Math.round(loaded / total * 100) : null);
    };
    unsubscribe.current = resources.map(resource => resource.subscribe(update));
    Promise.all(resources.map(resource => resource.ready)).then(images => {
      if (token !== requestToken.current || !dialog.current?.open) return;
      displayed.current = nextGroup;
      setGroupIndex(nextGroup);
      setPhotos(images);
      pending.current = false;
      setLoading(false);
      clearSubscriptions();
    }).catch(() => {
      if (token !== requestToken.current || !dialog.current?.open) return;
      setFailed(true);
      clearSubscriptions();
      // Keep the previous complete ribbon visible, frozen until Retry or Close.
    });
  }, [clearSubscriptions]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const warm = () => {
      timer = setTimeout(() => {
        technologyGroups.forEach(group => group.slides.forEach(slide => { void loadImage(slide.src).ready.catch(() => {}); }));
      }, 0);
    };
    if (document.readyState === 'complete') warm();
    else window.addEventListener('load', warm, { once: true });
    return () => {
      window.removeEventListener('load', warm);
      clearTimeout(timer);
    };
  }, []);

  useLayoutEffect(() => {
    const dialogElement = dialog.current;
    const open = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>('[data-technology-open]');
      if (!trigger || !dialogElement || dialogElement.open) return;
      event.preventDefault();
      opener.current = trigger;
      displayed.current = 0;
      requested.current = 0;
      setGroupIndex(0);
      setPhotos([]);
      setIsOpen(true);
      dialogElement.showModal();
      dialogElement.focus({ preventScroll: true });
      select(0);
      technologyGroups.forEach(group => group.slides.forEach(slide => { void loadImage(slide.src).ready.catch(() => {}); }));
    };
    document.addEventListener('click', open);
    return () => {
      document.removeEventListener('click', open);
      clearSubscriptions();
    };
  }, [select, clearSubscriptions]);

  useEffect(() => {
    if (!isOpen) return;
    const viewport = contentViewport.current;
    if (!viewport) return;
    wheelGesture.current = { lastAt: 0, distance: 0, verticalDistance: 0, committed: false, axis: null };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || (!event.deltaX && !event.deltaY)) return;
      const now = performance.now();
      const gesture = wheelGesture.current;
      if (now - gesture.lastAt > 180) {
        gesture.distance = 0; gesture.verticalDistance = 0; gesture.committed = false; gesture.axis = null;
      }
      gesture.lastAt = now;
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientWidth : 1;
      gesture.distance += event.deltaX * scale;
      gesture.verticalDistance += Math.abs(event.deltaY * scale);
      // Trackpads can begin with a tiny cross-axis sample. Wait for real intent.
      if (gesture.axis === null && Math.max(Math.abs(gesture.distance), gesture.verticalDistance) >= 12) {
        if (Math.abs(gesture.distance) >= gesture.verticalDistance * 1.2) gesture.axis = 'horizontal';
        else if (gesture.verticalDistance >= Math.abs(gesture.distance) * 1.2) gesture.axis = 'vertical';
      }
      if (gesture.axis === 'vertical') return; // Preserve native vertical scrolling for this burst.
      if (event.deltaX && Math.abs(event.deltaX) >= Math.abs(event.deltaY) * 1.2) event.preventDefault();
      if (gesture.axis !== 'horizontal') return;
      event.preventDefault(); // Consume horizontal input, including browser history gestures.
      if (pending.current) { gesture.committed = true; return; }
      if (gesture.committed) return;
      if (Math.abs(gesture.distance) < 45) return;
      gesture.committed = true;
      // Natural scrolling reports finger movement to the right as negative deltaX.
      const next = displayed.current + (gesture.distance < 0 ? 1 : -1);
      if (next >= 0 && next < technologyGroups.length) select(next);
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [isOpen, select]);

  const moveGroup = (delta: number) => {
    if (pending.current) return;
    const next = displayed.current + delta;
    if (next < 0 || next >= technologyGroups.length) return;
    select(next);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // Touch uses its own lifecycle: Safari may cancel pointer events during a pan.
    if (event.pointerType === 'touch' || !event.isPrimary || event.button !== 0 || pending.current || (event.target as Element).closest('button')) return;
    pointer.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic events do not own a pointer. */ }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    if (!start || start.id !== event.pointerId) return;
    pointer.current = null;
    finishSwipe(start, event.clientX, event.clientY);
  };
  const finishSwipe = (start: { x: number; y: number }, x: number, y: number) => {
    if (pending.current) return;
    const dx = x - start.x;
    const dy = y - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    // The requested physical direction is the same in every locale, including Arabic.
    moveGroup(dx > 0 ? 1 : -1);
  };
  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touch.current = null;
    if (pending.current || event.touches.length !== 1 || (event.target as Element).closest('button')) return;
    const contact = event.touches[0];
    touch.current = { x: contact.clientX, y: contact.clientY, id: contact.identifier };
  };
  const onTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const start = touch.current;
    if (!start) return;
    const contact = Array.from(event.touches).find(item => item.identifier === start.id);
    if (event.touches.length !== 1 || !contact) { touch.current = null; return; }
    const dx = Math.abs(contact.clientX - start.x);
    const dy = Math.abs(contact.clientY - start.y);
    // Once a vertical scroll begins, bending the gesture must not change groups.
    if (dy > 10 && dy >= dx) touch.current = null;
  };
  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touch.current;
    touch.current = null;
    if (!start || event.touches.length) return;
    const contact = Array.from(event.changedTouches).find(item => item.identifier === start.id);
    if (contact) finishSwipe(start, contact.clientX, contact.clientY);
  };

  return <dialog ref={dialog} id="technology-viewer" className="technology-viewer"
    aria-labelledby={isOpen && photos.length ? 'technology-viewer-title' : undefined}
    aria-label={isOpen && photos.length ? undefined : `${group.title} ${labels.technology}`}
    data-group={group.title} aria-busy={loading} aria-describedby="technology-viewer-instructions" tabIndex={-1}
    onClose={() => {
      requestToken.current++;
      setIsOpen(false);
      pending.current = false;
      pointer.current = null;
      touch.current = null;
      clearSubscriptions();
      setLoading(false);
      opener.current?.focus({ preventScroll: true });
    }}
    onKeyDown={event => {
      if (event.key === 'Tab') {
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'))
          .filter(element => element.getClientRects().length > 0);
        const index = controls.indexOf(document.activeElement as HTMLElement);
        if (index < 0 || (event.shiftKey ? index === 0 : index === controls.length - 1)) {
          event.preventDefault();
          (event.shiftKey ? controls.at(-1) : controls[0])?.focus({ preventScroll: true });
        }
        return;
      }
      const viewport = contentViewport.current;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
        if (event.key === ' ' && (event.target as Element).closest('button')) return;
        event.preventDefault();
        if (!viewport || pending.current) return;
        const direction = ['ArrowUp', 'PageUp', 'Home'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 1;
        const distance = event.key.startsWith('Arrow') ? 40 : viewport.clientHeight * .9;
        const top = event.key === 'Home' ? 0 : event.key === 'End' ? viewport.scrollHeight : viewport.scrollTop + direction * distance;
        viewport.scrollTo({ top, behavior: 'instant' });
      }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveGroup(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveGroup(-1); }
    }}>
    <div className="technology-viewer__canvas" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointer.current = null; }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={() => { touch.current = null; }}>
      <div className="technology-viewer__stage">
        <div className="technology-viewer__scroll" ref={contentViewport} role="region" aria-label={labels.vertical} tabIndex={0} onScroll={event => {
          if (pending.current && event.currentTarget.scrollTop !== lockedScroll.current) event.currentTarget.scrollTop = lockedScroll.current;
        }}>
          {isOpen && photos.length > 0 && <div className="technology-viewer__ribbon">
            {group.slides.map((slide, index) => <article key={slide.src} className="technology-viewer__content" style={{ zIndex: group.slides.length - index }} data-photo={slide.src}>
              <RetainedPhoto image={photos[index]} name={`${group.title} — ${names[index]}`} />
              {index === 0 && <TechnologyTitle descriptor={labels.technology} brand={group.title} />}
              {groupIndex === 0
                ? <TechnologyDescriptions slide={slide.id as TechnologySlideId} locale={locale} name={names[index]} copy={descriptions} />
                : <CyberMindDescriptions slide={slide.id as '01' | '02'} locale={locale} name={names[index]} copy={cyberMindDescriptions} />}
            </article>)}
          </div>}
        </div>
        {isOpen && loading && <div className="technology-viewer__loading"><LoadingStatus locale={locale} progress={progress} error={failed} onRetry={() => select(requested.current)} /></div>}
      </div>
      {isOpen && <>
        <button className="technology-viewer__next-image" type="button" onClick={() => moveGroup(groupIndex === 0 ? 1 : -1)} disabled={loading} aria-label={groupIndex === 0 ? labels.nextGroup : groupLabels.previous}>
          <span>{groupIndex === 0 ? labels.nextGroup : groupLabels.previous}</span>
          <Image className={groupIndex === 1 ? 'is-previous' : undefined} src="/art/technology/arrow-right.png" width={28} height={45} alt="" aria-hidden="true" unoptimized />
        </button>
        <div className="technology-viewer__dots" role="group" aria-label={labels.horizontal}>
          {technologyGroups.map((item, index) => <button key={item.title} type="button" onClick={() => { if (!pending.current && index !== displayed.current) select(index); }} disabled={loading} aria-label={`${item.title} ${labels.technology}`} aria-current={groupIndex === index ? 'true' : undefined}>
            <Image src={groupIndex === index ? '/art/technology/dot-active.png' : '/art/technology/dot-inactive.png'} width={29} height={29} alt="" aria-hidden="true" unoptimized />
          </button>)}
        </div>
      </>}
      <button className="technology-viewer__close" type="button" onClick={() => dialog.current?.close()} aria-label={labels.close}>×</button>
    </div>
    <p id="technology-viewer-instructions" className="technology-viewer__sr-only">{labels.horizontal}. {labels.vertical}.</p>
  </dialog>;
}
