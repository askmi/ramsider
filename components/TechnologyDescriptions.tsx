'use client';

import { useLayoutEffect, useRef } from 'react';
import type { Locale } from '@/lib/i18n';
import type { TechnologyDescriptionCopy, TechnologySlideId } from '@/lib/technology-descriptions';

type BlockProps = {
  id: string; x?: number; y: number; width?: number; height: number;
  size: number; line?: number; color?: string; tracking?: number; weight?: number;
  kind?: 'h3' | 'h4' | 'p' | 'span'; text: string; locale: Locale;
};

/** HTML stays semantic; the source plane follows the same X/Y fit as the PNG. */
export function TextBlock({ id, x = 54, y, width = 824, height, size, line = size * 1.2, color = '#000', tracking = 0, weight = 400, kind: Tag = 'p', text, locale }: BlockProps) {
  const box = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const container = box.current;
      const textElement = container?.firstElementChild as HTMLElement | null;
      if (!container || !textElement) return;
      let scale = 1;
      do {
        textElement.style.fontSize = `${size * scale}px`;
        textElement.style.lineHeight = `${line * scale}px`;
        if (textElement.scrollHeight <= container.clientHeight + 1 && textElement.scrollWidth <= container.clientWidth + 1) break;
        scale -= .025;
      } while (scale >= .6);
    };
    fit();
    void document.fonts.ready.then(fit);
  }, [text, locale, size, line, width, height, tracking]);
  return <foreignObject x={x} y={y} width={width} height={height} data-description-block={id}>
    <div ref={box} className="technology-description__box" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Tag className={`technology-description__copy${color === '#975f41' ? ' technology-description__warm' : ''}`} style={{ fontSize: size, lineHeight: `${line}px`, color, letterSpacing: tracking, fontWeight: weight }}>
        {text}
      </Tag>
    </div>
  </foreignObject>;
}

export function Divider({ y }: { y: number }) {
  return <line x1="56" x2="877" y1={y} y2={y} stroke="#8f8983" strokeWidth="1" aria-hidden="true" />;
}

export function TechnologyDescriptions({ slide, locale, name, copy }: { slide: TechnologySlideId; locale: Locale; name: string; copy: TechnologyDescriptionCopy }) {
  const common = { locale };
  const brown = '#975f41';
  return <section className="technology-viewer__descriptions" aria-label={name} data-slide={slide}>
    <svg viewBox="0 0 941 1672" preserveAspectRatio="none" role="presentation">
      {slide === '02' && <>
        <TextBlock {...common} id="headline" x={56} y={332} height={128} kind="h3" size={50} line={58} text={copy.three} />
        <TextBlock {...common} id="upper-label" x={94} y={703} width={195} height={32} kind="h4" size={23} line={30} text={copy.upper} />
        <TextBlock {...common} id="upper-temperature" x={94} y={735} width={180} height={32} size={22} line={30} color={brown} text="0–280°C" />
        <TextBlock {...common} id="upper-body" y={767} width={235} height={60} size={21} line={28} text={copy.upperBody} />
        <TextBlock {...common} id="grill-label" x={94} y={832} width={195} height={32} kind="h4" size={23} line={30} text={copy.grillMode} />
        <TextBlock {...common} id="grill-body" y={866} width={235} height={86} size={21} line={28} text={copy.grillBody} />
        <TextBlock {...common} id="lower-label" x={94} y={972} width={195} height={32} kind="h4" size={23} line={30} text={copy.lower} />
        <TextBlock {...common} id="lower-temperature" x={94} y={1004} width={180} height={32} size={22} line={30} color={brown} text="0–160°C" />
        <TextBlock {...common} id="lower-body" y={1036} width={235} height={60} size={21} line={28} text={copy.lowerBody} />
        <TextBlock {...common} id="eyebrow" y={1322} height={42} size={26} line={34} color={brown} text={copy.architecture} />
        <Divider y={1381} />
        <TextBlock {...common} id="body" y={1399} height={205} size={28} line={42} text={copy.heatersBody} />
      </>}
      {slide === '03' && <>
        <TextBlock {...common} id="eyebrow" y={1123} height={42} size={26} line={34} tracking={2.6} color={brown} text={copy.sails} />
        <TextBlock {...common} id="headline" x={52} y={1176} height={128} kind="h3" size={50.5} line={58} text={copy.release} />
        <Divider y={1324} />
        <TextBlock {...common} id="body" y={1347} width={840} height={244} size={27.5} line={42} text={copy.sailsBody} />
      </>}
      {slide === '04' && <>
        <TextBlock {...common} id="phone-brand" x={130} y={512} width={101} height={30} size={14} line={24} color="#fff" tracking={2} text="RAMSIDER" />
        <TextBlock {...common} id="phone-curve" x={130} y={588} width={142} height={32} size={14} line={24} color="#fff" text={copy.heatingCurve} />
        <TextBlock {...common} id="phone-upper" x={80} y={638} width={119} height={30} size={16} line={24} color="#00e4ed" text={copy.upperShort} />
        <TextBlock {...common} id="phone-grill" x={80} y={807} width={119} height={30} size={16} line={24} color="#00e4ed" text={copy.grill} />
        <TextBlock {...common} id="phone-lower" x={80} y={971} width={119} height={30} size={16} line={24} color="#00e4ed" text={copy.lowerShort} />
        <foreignObject x="250" y="521" width="28" height="25" aria-hidden="true"><div className="technology-description__status">96%</div></foreignObject>
        <TextBlock {...common} id="diagram-upper" x={866} y={849} width={70} height={30} size={16} line={24} tracking={1.4} text={copy.upperShort} />
        <TextBlock {...common} id="diagram-grill" x={866} y={948} width={70} height={30} size={16} line={24} tracking={1.4} text={copy.grill} />
        <TextBlock {...common} id="diagram-lower" x={866} y={1061} width={70} height={30} size={16} line={24} tracking={1.4} text={copy.lowerShort} />
        <TextBlock {...common} id="eyebrow" y={1238} height={42} size={26} line={34} tracking={2} color={brown} text={copy.profiles} />
        <TextBlock {...common} id="headline" x={52} y={1284} height={70} kind="h3" size={51} line={58} text={copy.power} />
        <Divider y={1371} />
        <TextBlock {...common} id="body" y={1387} height={186} size={29} line={42} text={copy.profilesBody} />
        <TextBlock {...common} id="workflow-create" y={1581} width={160} height={32} size={17} line={25} tracking={1.5} text={copy.create} />
        <TextBlock {...common} id="workflow-control" x={260} y={1581} width={190} height={32} size={17} line={25} tracking={1.5} text={copy.control} />
        <TextBlock {...common} id="workflow-refine" x={504} y={1581} width={255} height={32} size={17} line={25} tracking={1.5} text={copy.refine} />
        <text x="224" y="1601" fontSize="17" aria-hidden="true">/</text><text x="469" y="1601" fontSize="17" aria-hidden="true">/</text>
      </>}
      {slide === '05' && <>
        <TextBlock {...common} id="eyebrow" y={1233} height={42} size={26} line={34} tracking={2} color={brown} text={copy.surface} />
        <TextBlock {...common} id="headline" x={52} y={1273} height={118} kind="h3" size={49.5} line={55} text={copy.finishes} />
        <Divider y={1408} />
        <TextBlock {...common} id="body" y={1418} height={201} size={28.5} line={37} text={copy.finishesBody} />
      </>}
    </svg>
  </section>;
}
