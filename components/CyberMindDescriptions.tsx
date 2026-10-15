'use client';

import type { Locale } from '@/lib/i18n';
import type { CyberMindCopy } from '@/lib/cybermind-descriptions';
import { Divider, TextBlock } from './TechnologyDescriptions';

export function CyberMindDescriptions({ slide, locale, name, copy, descriptor }: { slide: '01' | '02'; locale: Locale; name: string; copy: CyberMindCopy; descriptor: string }) {
  const common = { locale };
  const brown = '#975f41';
  const calloutWidth = locale === 'ar' ? 240 : 290;
  const tops = [316, 486, 641, 787, 929];
  return <section className="technology-viewer__descriptions" aria-label={name} data-cybermind-slide={slide}>
    <svg viewBox="0 0 941 1522" role="presentation">
      <text x="50" y="107" fontSize="112" textLength="500" lengthAdjust="spacingAndGlyphs" aria-hidden="true">CyberMind</text>
      <TextBlock {...common} id="cyber-descriptor" x={54} y={140} width={600} height={43} size={31} line={37} color={brown} text={descriptor}/>
      {slide === '01' ? <>
        <TextBlock {...common} id="cyber-eyebrow" x={64} y={1105} width={760} height={42} size={26} line={34} color={brown} text={copy.eyebrow1} />
        <TextBlock {...common} id="cyber-headline" x={64} y={1153} width={805} height={178} kind="h3" size={50} line={58} text={copy.headline1} />
        <Divider y={1357} />
        <TextBlock {...common} id="cyber-body" x={64} y={1360} width={810} height={158} size={28} line={30} text={copy.body1} />
      </> : <>
        {copy.callouts.map((callout, index) => <g key={index}>
          <TextBlock {...common} id={`cyber-callout-${index + 1}-title`} x={142} y={tops[index]} width={calloutWidth} height={33} kind="h4" size={21} line={26} weight={700} text={callout.title} />
          <TextBlock {...common} id={`cyber-callout-${index + 1}-body`} x={142} y={tops[index] + 35} width={Math.min(calloutWidth,287)} height={58} size={18} line={25} text={callout.body} />
        </g>)}
        <TextBlock {...common} id="cyber-eyebrow" x={56} y={1137} width={820} height={40} size={26} line={34} color={brown} tracking={2} text={copy.eyebrow2} />
        <TextBlock {...common} id="cyber-headline" x={56} y={1175} width={823} height={122} kind="h3" size={50} line={55} text={copy.headline2} />
        <Divider y={1317} />
        <TextBlock {...common} id="cyber-body" x={56} y={1328} width={820} height={185} size={28} line={42} text={copy.body2} />
      </>}
    </svg>
  </section>;
}
