'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Locale } from '@/lib/i18n';
import previews from '@/lib/technology-previews.json';

const slides = [
  { id: '02', src: '/art/technology/02.webp' },
  { id: '03', src: '/art/technology/03.webp' },
  { id: '04', src: '/art/technology/04.webp' },
  { id: '05', src: '/art/technology/05.webp' },
] as const;

type ViewerCopy = { horizontal: string; vertical: string; details: string; close: string; image: string; nextImage: string; nextGroup: string; unavailable: string; names: readonly [string, string, string, string] };
const copy: Record<Locale, ViewerCopy> = {
  en: { details: 'Swipe for Details', horizontal: 'Swipe horizontally to browse images', vertical: 'Swipe down for the next technology', close: 'Close technology viewer', image: 'Image', nextImage: 'Show next image', nextGroup: 'Next Technology', unavailable: 'The next technology is coming soon.', names: ['Three heaters', 'Active air sails', 'Programmable heat profiles', 'Gold and titanium nitride'] },
  ru: { details: 'Свайп для деталей', horizontal: 'Листайте изображения по горизонтали', vertical: 'Свайп вниз — следующая технология', close: 'Закрыть просмотр технологий', image: 'Изображение', nextImage: 'Следующее изображение', nextGroup: 'Следующая технология', unavailable: 'Следующая технология скоро появится.', names: ['Три нагревателя', 'Активные воздушные паруса', 'Программируемые профили нагрева', 'Золото и нитрид титана'] },
  de: { details: 'Für Details wischen', horizontal: 'Horizontal durch die Bilder wischen', vertical: 'Für die nächste Technologie nach unten wischen', close: 'Technologieansicht schließen', image: 'Bild', nextImage: 'Nächstes Bild anzeigen', nextGroup: 'Nächste Technologie', unavailable: 'Die nächste Technologie kommt bald.', names: ['Drei Heizelemente', 'Aktive Luftsegel', 'Programmierbare Wärmeprofile', 'Gold und Titannitrid'] },
  fr: { details: 'Balayez pour les détails', horizontal: 'Balayez horizontalement pour parcourir les images', vertical: 'Balayez vers le bas pour la technologie suivante', close: 'Fermer la galerie', image: 'Image', nextImage: 'Afficher l’image suivante', nextGroup: 'Technologie suivante', unavailable: 'La prochaine technologie arrive bientôt.', names: ['Trois éléments chauffants', 'Volets d’air actifs', 'Profils de chauffe programmables', 'Or et nitrure de titane'] },
  es: { details: 'Desliza para ver detalles', horizontal: 'Desliza horizontalmente para ver las imágenes', vertical: 'Desliza abajo para la siguiente tecnología', close: 'Cerrar la galería', image: 'Imagen', nextImage: 'Mostrar la siguiente imagen', nextGroup: 'Siguiente tecnología', unavailable: 'La próxima tecnología estará disponible pronto.', names: ['Tres calentadores', 'Aletas de aire activas', 'Perfiles de calor programables', 'Oro y nitruro de titanio'] },
  it: { details: 'Scorri per i dettagli', horizontal: 'Scorri orizzontalmente tra le immagini', vertical: 'Scorri giù per la tecnologia successiva', close: 'Chiudi la galleria', image: 'Immagine', nextImage: 'Mostra l’immagine successiva', nextGroup: 'Tecnologia successiva', unavailable: 'La prossima tecnologia arriverà presto.', names: ['Tre riscaldatori', 'Alette d’aria attive', 'Profili di calore programmabili', 'Oro e nitruro di titanio'] },
  tr: { details: 'Ayrıntılar için kaydırın', horizontal: 'Görseller arasında yatay kaydırın', vertical: 'Sonraki teknoloji için aşağı kaydırın', close: 'Teknoloji görünümünü kapat', image: 'Görsel', nextImage: 'Sonraki görseli göster', nextGroup: 'Sonraki teknoloji', unavailable: 'Sonraki teknoloji yakında sunulacak.', names: ['Üç ısıtıcı', 'Aktif hava kanatları', 'Programlanabilir ısı profilleri', 'Altın ve titanyum nitrür'] },
  ar: { details: 'اسحب لعرض التفاصيل', horizontal: 'اسحب أفقياً لتصفح الصور', vertical: 'اسحب للأسفل للانتقال إلى التقنية التالية', close: 'إغلاق معرض التقنيات', image: 'صورة', nextImage: 'عرض الصورة التالية', nextGroup: 'التقنية التالية', unavailable: 'التقنية التالية ستتوفر قريباً.', names: ['ثلاثة سخانات', 'زعانف هوائية نشطة', 'ملفات حرارة قابلة للبرمجة', 'الذهب ونتريد التيتانيوم'] },
  zh: { details: '滑动查看详情', horizontal: '左右滑动浏览图片', vertical: '向下滑动查看下一项技术', close: '关闭技术图库', image: '图片', nextImage: '显示下一张图片', nextGroup: '下一项技术', unavailable: '下一项技术即将推出。', names: ['三个加热器', '主动导流翼', '可编程加热曲线', '黄金与氮化钛'] },
  ja: { details: 'スワイプして詳細を見る', horizontal: '左右にスワイプして画像を見る', vertical: '下にスワイプして次の技術を見る', close: '技術ギャラリーを閉じる', image: '画像', nextImage: '次の画像を表示', nextGroup: '次の技術', unavailable: '次の技術は近日公開予定です。', names: ['3つのヒーター', 'アクティブエアセイル', 'プログラム可能な加熱プロファイル', '金と窒化チタン'] },
  ko: { details: '스와이프하여 상세 보기', horizontal: '좌우로 스와이프하여 이미지 보기', vertical: '아래로 스와이프하여 다음 기술 보기', close: '기술 갤러리 닫기', image: '이미지', nextImage: '다음 이미지 보기', nextGroup: '다음 기술', unavailable: '다음 기술은 곧 공개됩니다.', names: ['세 개의 히터', '액티브 에어 세일', '프로그래밍 가능한 열 프로필', '금과 질화 티타늄'] },
};

function TechnologyNavigation({ direction, label, accessibleLabel, onClick }: { direction: 'right' | 'down'; label: string; accessibleLabel: string; onClick: () => void }) {
  return <button className={`technology-viewer__next-${direction === 'right' ? 'image' : 'group'}`} type="button" onClick={onClick} aria-label={accessibleLabel}>
    <span>{label}</span>
    <Image src={`/art/technology/arrow-${direction}.png`} width={direction === 'right' ? 28 : 45} height={direction === 'right' ? 45 : 29} alt="" aria-hidden="true" unoptimized />
  </button>;
}

function TechnologyPagination({ index, labels, onSelect }: { index: number; labels: ViewerCopy; onSelect: (index: number) => void }) {
  return <div className="technology-viewer__dots" role="group" aria-label={labels.horizontal}>
    {slides.map((slide, slideIndex) => <button key={slide.id} type="button" onClick={() => onSelect(slideIndex)} aria-label={`${labels.image} ${slideIndex + 1} / ${slides.length}: ${labels.names[slideIndex]}`} aria-current={index === slideIndex ? 'true' : undefined}>
      <Image src={index === slideIndex ? '/art/technology/dot-active.png' : '/art/technology/dot-inactive.png'} width={29} height={29} alt="" aria-hidden="true" unoptimized />
    </button>)}
  </div>;
}

export function TechnologyViewer({ locale }: { locale: Locale }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const previousOverflow = useRef('');
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const displayedIndex = useRef(0);
  const requestedIndex = useRef(0);
  const requestToken = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const labels = copy[locale];

  useEffect(() => {
    const dialogElement = dialog.current;
    const open = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>('[data-technology-open]');
      if (!trigger || !dialogElement || dialogElement.open) return;
      event.preventDefault();
      opener.current = trigger;
      requestToken.current++;
      displayedIndex.current = 0;
      requestedIndex.current = 0;
      setIndex(0);
      setShowUnavailable(false);
      setIsOpen(true);
      dialogElement.showModal();
      dialogElement.focus();
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    };
    document.addEventListener('click', open);
    return () => {
      document.removeEventListener('click', open);
      if (dialogElement?.open) document.body.style.overflow = previousOverflow.current;
    };
  }, []);

  const close = () => dialog.current?.close();
  const showSlide = (position: number) => {
    const next = (position + slides.length) % slides.length;
    setShowUnavailable(false);
    requestedIndex.current = next;
    const token = ++requestToken.current;
    const image = new window.Image();
    image.src = slides[next].src;
    image.decode().then(() => {
      if (token === requestToken.current && dialog.current?.open) {
        displayedIndex.current = next;
        setIndex(next);
      }
    }).catch(() => {
      if (token === requestToken.current) requestedIndex.current = displayedIndex.current;
    });
  };
  const move = (delta: number) => showSlide(requestedIndex.current + delta);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    pointer.current = { x: event.clientX, y: event.clientY };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic test events do not own a pointer. */ }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (dy > 65 && dy > Math.abs(dx) * 1.2) { setShowUnavailable(true); return; }
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    move((dx < 0 ? 1 : -1) * (locale === 'ar' ? -1 : 1));
  };

  return <dialog
    ref={dialog}
    id="technology-viewer"
    className="technology-viewer"
    aria-label="HeatCore"
    aria-describedby="technology-viewer-instructions"
    tabIndex={-1}
    onClose={() => {
      requestToken.current++;
      setIsOpen(false);
      document.body.style.overflow = previousOverflow.current;
      opener.current?.focus();
    }}
    onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(locale === 'ar' ? -1 : 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(locale === 'ar' ? 1 : -1); }
    }}
  >
    <div className="technology-viewer__canvas">
      <div className="technology-viewer__stage" style={{ backgroundImage: isOpen ? `url('${previews[slides[index].id]}')` : undefined }} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pointer.current = null; }}>
        {isOpen && <Image key={slides[index].src} src={slides[index].src} alt={`HeatCore — ${labels.names[index]}`} fill sizes="100vw" unoptimized priority={index === 0} draggable={false} />}
      </div>
      {isOpen && <>
        <Image className="technology-viewer__frame" src="/art/technology/frame-template.webp" width={941} height={1628} alt="" aria-hidden="true" unoptimized priority />
        <TechnologyNavigation direction="right" label={labels.details} accessibleLabel={labels.nextImage} onClick={() => showSlide(requestedIndex.current + 1)} />
        <TechnologyPagination index={index} labels={labels} onSelect={showSlide} />
        <TechnologyNavigation direction="down" label={labels.nextGroup} accessibleLabel={labels.nextGroup} onClick={() => setShowUnavailable(true)} />
      </>}
      {showUnavailable && <p className="technology-viewer__notice" role="status">{labels.unavailable}</p>}
      <button className="technology-viewer__close" type="button" onClick={close} aria-label={labels.close}>×</button>
    </div>
    <p id="technology-viewer-instructions" className="technology-viewer__sr-only">{labels.horizontal}. {labels.vertical}. {labels.image} {index + 1} / {slides.length}.</p>
  </dialog>;
}
