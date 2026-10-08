'use client';

import Image from 'next/image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
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

type Selection = { group: number; slide: number };

type ViewerCopy = { technology: string; horizontal: string; vertical: string; details: string; close: string; image: string; nextImage: string; nextGroup: string; unavailable: string; names: readonly [string, string, string, string] };
const copy: Record<Locale, ViewerCopy> = {
  en: { technology: 'Technology', details: 'Swipe for Details', horizontal: 'Swipe horizontally to browse images', vertical: 'Scroll vertically to view the full image. Use the buttons to change technology', close: 'Close technology viewer', image: 'Image', nextImage: 'Show next image', nextGroup: 'Next Technology', unavailable: 'The next technology is coming soon.', names: ['Three heaters', 'Active air sails', 'Programmable heat profiles', 'Gold and titanium nitride'] },
  ru: { technology: 'Технология', details: 'Свайп для деталей', horizontal: 'Листайте изображения по горизонтали', vertical: 'Прокрутите по вертикали, чтобы увидеть изображение целиком. Переключайте технологии кнопками', close: 'Закрыть просмотр технологий', image: 'Изображение', nextImage: 'Следующее изображение', nextGroup: 'Следующая технология', unavailable: 'Следующая технология скоро появится.', names: ['Три нагревателя', 'Активные воздушные паруса', 'Программируемые профили нагрева', 'Золото и нитрид титана'] },
  de: { technology: 'Technologie', details: 'Für Details wischen', horizontal: 'Horizontal durch die Bilder wischen', vertical: 'Vertikal scrollen, um das ganze Bild zu sehen. Technologien mit den Schaltflächen wechseln', close: 'Technologieansicht schließen', image: 'Bild', nextImage: 'Nächstes Bild anzeigen', nextGroup: 'Nächste Technologie', unavailable: 'Die nächste Technologie kommt bald.', names: ['Drei Heizelemente', 'Aktive Luftsegel', 'Programmierbare Wärmeprofile', 'Gold und Titannitrid'] },
  fr: { technology: 'Technologie', details: 'Balayez pour les détails', horizontal: 'Balayez horizontalement pour parcourir les images', vertical: 'Faites défiler verticalement pour voir toute l’image. Changez de technologie avec les boutons', close: 'Fermer la galerie', image: 'Image', nextImage: 'Afficher l’image suivante', nextGroup: 'Technologie suivante', unavailable: 'La prochaine technologie arrive bientôt.', names: ['Trois éléments chauffants', 'Volets d’air actifs', 'Profils de chauffe programmables', 'Or et nitrure de titane'] },
  es: { technology: 'Tecnología', details: 'Desliza para ver detalles', horizontal: 'Desliza horizontalmente para ver las imágenes', vertical: 'Desplázate verticalmente para ver toda la imagen. Cambia de tecnología con los botones', close: 'Cerrar la galería', image: 'Imagen', nextImage: 'Mostrar la siguiente imagen', nextGroup: 'Siguiente tecnología', unavailable: 'La próxima tecnología estará disponible pronto.', names: ['Tres calentadores', 'Aletas de aire activas', 'Perfiles de calor programables', 'Oro y nitruro de titanio'] },
  it: { technology: 'Tecnologia', details: 'Scorri per i dettagli', horizontal: 'Scorri orizzontalmente tra le immagini', vertical: 'Scorri in verticale per vedere tutta l’immagine. Cambia tecnologia con i pulsanti', close: 'Chiudi la galleria', image: 'Immagine', nextImage: 'Mostra l’immagine successiva', nextGroup: 'Tecnologia successiva', unavailable: 'La prossima tecnologia arriverà presto.', names: ['Tre riscaldatori', 'Alette d’aria attive', 'Profili di calore programmabili', 'Oro e nitruro di titanio'] },
  tr: { technology: 'Teknoloji', details: 'Ayrıntılar için kaydırın', horizontal: 'Görseller arasında yatay kaydırın', vertical: 'Görselin tamamını görmek için dikey kaydırın. Teknolojiyi düğmelerle değiştirin', close: 'Teknoloji görünümünü kapat', image: 'Görsel', nextImage: 'Sonraki görseli göster', nextGroup: 'Sonraki teknoloji', unavailable: 'Sonraki teknoloji yakında sunulacak.', names: ['Üç ısıtıcı', 'Aktif hava kanatları', 'Programlanabilir ısı profilleri', 'Altın ve titanyum nitrür'] },
  ar: { technology: 'تقنية', details: 'اسحب لعرض التفاصيل', horizontal: 'اسحب أفقياً لتصفح الصور', vertical: 'مرّر عمودياً لعرض الصورة كاملة. استخدم الأزرار لتغيير التقنية', close: 'إغلاق معرض التقنيات', image: 'صورة', nextImage: 'عرض الصورة التالية', nextGroup: 'التقنية التالية', unavailable: 'التقنية التالية ستتوفر قريباً.', names: ['ثلاثة سخانات', 'زعانف هوائية نشطة', 'ملفات حرارة قابلة للبرمجة', 'الذهب ونتريد التيتانيوم'] },
  zh: { technology: '技术', details: '滑动查看详情', horizontal: '左右滑动浏览图片', vertical: '上下滚动查看完整图片，使用按钮切换技术', close: '关闭技术图库', image: '图片', nextImage: '显示下一张图片', nextGroup: '下一项技术', unavailable: '下一项技术即将推出。', names: ['三个加热器', '主动导流翼', '可编程加热曲线', '黄金与氮化钛'] },
  ja: { technology: 'テクノロジー', details: 'スワイプして詳細を見る', horizontal: '左右にスワイプして画像を見る', vertical: '縦にスクロールして画像全体を表示します。ボタンで技術を切り替えます', close: '技術ギャラリーを閉じる', image: '画像', nextImage: '次の画像を表示', nextGroup: '次の技術', unavailable: '次の技術は近日公開予定です。', names: ['3つのヒーター', 'アクティブエアセイル', 'プログラム可能な加熱プロファイル', '金と窒化チタン'] },
  ko: { technology: '기술', details: '스와이프하여 상세 보기', horizontal: '좌우로 스와이프하여 이미지 보기', vertical: '세로로 스크롤하여 전체 이미지를 보고 버튼으로 기술을 전환하세요', close: '기술 갤러리 닫기', image: '이미지', nextImage: '다음 이미지 보기', nextGroup: '다음 기술', unavailable: '다음 기술은 곧 공개됩니다.', names: ['세 개의 히터', '액티브 에어 세일', '프로그래밍 가능한 열 프로필', '금과 질화 티타늄'] },
};

function TechnologyNavigation({ direction, label, accessibleLabel, onClick, disabled }: { direction: 'right' | 'down'; label: string; accessibleLabel: string; onClick: () => void; disabled?: boolean }) {
  return <button className={`technology-viewer__next-${direction === 'right' ? 'image' : 'group'}`} type="button" onClick={onClick} aria-label={accessibleLabel} disabled={disabled}>
    <span>{label}</span>
    <Image src={`/art/technology/arrow-${direction}.png`} width={direction === 'right' ? 28 : 45} height={direction === 'right' ? 45 : 29} alt="" aria-hidden="true" unoptimized />
  </button>;
}

function TechnologyPagination({ index, labels, names, onSelect, disabled }: { index: number; labels: ViewerCopy; names: readonly string[]; onSelect: (index: number) => void; disabled: boolean }) {
  return <div className="technology-viewer__dots" role="group" aria-label={labels.horizontal}>
    {names.map((name, slideIndex) => <button key={slideIndex} type="button" onClick={() => onSelect(slideIndex)} disabled={disabled} aria-label={`${labels.image} ${slideIndex + 1} / ${names.length}: ${name}`} aria-current={index === slideIndex ? 'true' : undefined}>
      <Image src={index === slideIndex ? '/art/technology/dot-active.png' : '/art/technology/dot-inactive.png'} width={29} height={29} alt="" aria-hidden="true" unoptimized />
    </button>)}
  </div>;
}

export function TechnologyViewer({ locale, descriptions, cyberMindDescriptions }: { locale: Locale; descriptions: TechnologyDescriptionCopy; cyberMindDescriptions: CyberMindCopy }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const photo = useRef<HTMLDivElement>(null);
  const contentViewport = useRef<HTMLDivElement>(null);
  const lockedScroll = useRef(0);
  const resetScroll = useRef(false);
  const asset = useRef<HTMLImageElement | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const displayed = useRef<Selection>({ group: 0, slide: 0 });
  const requested = useRef<Selection>({ group: 0, slide: 0 });
  const remembered = useRef([0, 0]);
  const requestToken = useRef(0);
  const restoreGroupFocus = useRef(false);
  const pending = useRef(false);
  const unsubscribe = useRef<(() => void) | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<Selection>({ group: 0, slide: 0 });
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [hasAsset, setHasAsset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  useScrollLock(isOpen);
  const labels = copy[locale];
  const groupLabels = technologyGroupCopy[locale];
  const group = technologyGroups[selection.group];
  const slide = group.slides[selection.slide];
  const names = selection.group === 0 ? labels.names : groupLabels.names;
  useLayoutEffect(() => {
    // A disabled navigation button can lose focus to the document in desktop browsers.
    if (loading && dialog.current?.open) dialog.current.focus({ preventScroll: true });
    if (asset.current && photo.current) {
      asset.current.alt = `${group.title} — ${names[selection.slide]}`;
      asset.current.draggable = false;
      photo.current.replaceChildren(asset.current);
    }
    if (resetScroll.current && contentViewport.current) {
      resetScroll.current = false;
      contentViewport.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    if (restoreGroupFocus.current && dialog.current?.open) {
      restoreGroupFocus.current = false;
      dialog.current.focus({ preventScroll: true });
    }
  }, [hasAsset, loading, group.title, names, selection.slide, selection.group]);

  const select = useCallback((next: Selection) => {
    setShowUnavailable(false);
    requested.current = next;
    pending.current = true;
    pointer.current = null;
    const viewport = contentViewport.current;
    lockedScroll.current = viewport?.scrollTop ?? 0;
    // Stop an existing scroll before the pending frame freezes this viewport.
    viewport?.scrollTo({ top: lockedScroll.current, left: 0, behavior: 'instant' });
    setLoading(true);
    setFailed(false);
    const token = ++requestToken.current;
    unsubscribe.current?.();
    const resource = loadImage(technologyGroups[next.group].slides[next.slide].src, 'high');
    const update = (value: typeof resource.progress) => setProgress(value.total ? Math.round(value.loaded / value.total * 100) : null);
    update(resource.progress);
    unsubscribe.current = resource.subscribe(update);
    resource.ready.then(image => {
      if (token !== requestToken.current || !dialog.current?.open) return;
      const active = document.activeElement;
      restoreGroupFocus.current = next.group !== displayed.current.group && active instanceof Element && !!active.closest('.technology-viewer__dots, .technology-viewer__previous-group');
      displayed.current = next;
      remembered.current[next.group] = next.slide;
      asset.current = image;
      resetScroll.current = true;
      setHasAsset(true);
      setSelection(next);
      pending.current = false;
      setLoading(false);
      unsubscribe.current?.();
    }).catch(() => {
      if (token !== requestToken.current || !dialog.current?.open) return;
      setFailed(true);
      // Keep navigation locked until retry or close; the current complete frame stays visible.
      unsubscribe.current?.();
    });
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const warm = () => {
      // Run after load dispatch; never compete with the initial page resources.
      timer = setTimeout(() => {
        technologyGroups.forEach(group => group.slides.slice(0, 2).forEach(slide => { void loadImage(slide.src).ready.catch(() => {}); }));
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
      requestToken.current++;
      displayed.current = { group: 0, slide: 0 };
      requested.current = displayed.current;
      remembered.current = [0, 0];
      setSelection(displayed.current);
      asset.current = null;
      setHasAsset(false);
      setShowUnavailable(false);
      restoreGroupFocus.current = false;
      setIsOpen(true);
      dialogElement.showModal();
      dialogElement.focus({ preventScroll: true });
      select(displayed.current);
      technologyGroups.forEach(group => group.slides.forEach(slide => { void loadImage(slide.src).ready.catch(() => {}); }));
    };
    document.addEventListener('click', open);
    return () => {
      document.removeEventListener('click', open);
      unsubscribe.current?.();
    };
  }, [select]);

  const close = () => dialog.current?.close();
  const showSlide = (position: number, groupIndex = displayed.current.group) => {
    const length = technologyGroups[groupIndex].slides.length;
    if (pending.current || position < 0 || position >= length) return;
    if (groupIndex === displayed.current.group && position === displayed.current.slide) return;
    select({ group: groupIndex, slide: position });
  };
  const move = (delta: number) => {
    if (pending.current) return;
    setShowUnavailable(false);
    const current = displayed.current;
    showSlide(current.slide + delta, current.group);
  };
  const moveGroup = (delta: number) => {
    if (pending.current) return;
    const currentGroup = displayed.current.group;
    const nextGroup = currentGroup + delta;
    if (nextGroup < 0) return;
    if (nextGroup >= technologyGroups.length) { setShowUnavailable(true); return; }
    select({ group: nextGroup, slide: remembered.current[nextGroup] });
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (pending.current) return;
    pointer.current = { x: event.clientX, y: event.clientY };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic test events do not own a pointer. */ }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    move((dx < 0 ? 1 : -1) * (locale === 'ar' ? -1 : 1));
  };

  return <dialog
    ref={dialog}
    id="technology-viewer"
    className="technology-viewer"
    aria-labelledby={isOpen && hasAsset ? 'technology-viewer-title' : undefined}
    aria-label={isOpen && hasAsset ? undefined : group.title}
    data-group={group.title}
    aria-busy={loading}
    aria-describedby="technology-viewer-instructions"
    tabIndex={-1}
    onClose={() => {
      requestToken.current++;
      restoreGroupFocus.current = false;
      setIsOpen(false);
      pending.current = false;
      unsubscribe.current?.();
      setLoading(false);
      opener.current?.focus();
    }}
    onKeyDown={event => {
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
      if (event.key === 'ArrowRight') { event.preventDefault(); move(locale === 'ar' ? -1 : 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(locale === 'ar' ? 1 : -1); }
    }}
  >
    <div className="technology-viewer__canvas">
      <div className="technology-viewer__stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointer.current = null; }}>
        <div className="technology-viewer__scroll" ref={contentViewport} role="region" aria-label={labels.vertical} tabIndex={0} onScroll={event => {
          if (pending.current && event.currentTarget.scrollTop !== lockedScroll.current) event.currentTarget.scrollTop = lockedScroll.current;
        }}>
          {isOpen && hasAsset && <div className="technology-viewer__content">
            <div className="technology-viewer__photo" ref={photo} />
            <TechnologyTitle descriptor={labels.technology} brand={group.title} />
            {selection.group === 0 && <TechnologyDescriptions slide={slide.id as TechnologySlideId} locale={locale} name={names[selection.slide]} copy={descriptions} />}
            {selection.group === 1 && <CyberMindDescriptions slide={slide.id as '01' | '02'} locale={locale} name={names[selection.slide]} copy={cyberMindDescriptions} />}
          </div>}
        </div>
        {isOpen && loading && <LoadingStatus locale={locale} progress={progress} error={failed} onRetry={() => select(requested.current)} className="technology-viewer__loading" />}
      </div>
      {isOpen && <>
        <div className="technology-viewer__frame" aria-hidden="true" />
        <TechnologyNavigation direction="right" label={labels.details} accessibleLabel={labels.nextImage} onClick={() => move(1)} disabled={loading || selection.slide === group.slides.length - 1} />
        <TechnologyPagination index={selection.slide} labels={labels} names={names} onSelect={position => showSlide(position)} disabled={loading} />
        <TechnologyNavigation direction="down" label={labels.nextGroup} accessibleLabel={labels.nextGroup} onClick={() => moveGroup(1)} disabled={loading} />
        {selection.group > 0 && <button className="technology-viewer__previous-group" type="button" onClick={() => moveGroup(-1)} disabled={loading} aria-label={groupLabels.previous} title={groupLabels.previous}>
          <Image src="/art/technology/arrow-down.png" width={45} height={29} alt="" aria-hidden="true" unoptimized />
        </button>}
      </>}
      {showUnavailable && <p className="technology-viewer__notice" role="status">{labels.unavailable}</p>}
      <button className="technology-viewer__close" type="button" onClick={close} aria-label={labels.close}>×</button>
    </div>
    <p id="technology-viewer-instructions" className="technology-viewer__sr-only">{labels.horizontal}. {labels.vertical}. {selection.group > 0 && `${groupLabels.previous}. `}{labels.image} {selection.slide + 1} / {group.slides.length}.</p>
  </dialog>;
}
