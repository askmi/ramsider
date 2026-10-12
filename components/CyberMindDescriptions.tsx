'use client';

import type { Locale } from '@/lib/i18n';
import type { CyberMindCopy } from '@/lib/cybermind-descriptions';
import { Divider, TextBlock, IconReadingRow } from './TechnologyText';

export function CyberMindDescriptions({ slide, locale, name, copy }: { slide: '01' | '02'; locale: Locale; name: string; copy: CyberMindCopy; descriptor: string }) {
  const common = { locale };
  return <section className="technology-viewer__descriptions" aria-label={name} data-cybermind-slide={slide}>
    <div className="technology-reading">

      {slide === '01' ? <>
        <TextBlock {...common} id="cyber-eyebrow" text={copy.eyebrow1} />
        <TextBlock {...common} id="cyber-headline" kind="h3" text={copy.headline1} />
        <Divider />
        <TextBlock {...common} id="cyber-body" text={copy.body1} />
      </> : <>
        {copy.callouts.map((callout, index) => <IconReadingRow photo="cyber-02" id={`cyber-callout-${index}`} locale={locale} key={index}>
          <TextBlock {...common} id={`cyber-callout-${index + 1}-title`} kind="h4" weight={700} text={callout.title} />
          <TextBlock {...common} id={`cyber-callout-${index + 1}-body`} text={callout.body} />
        </IconReadingRow>)}
        <TextBlock {...common} id="cyber-eyebrow" text={copy.eyebrow2} />
        <TextBlock {...common} id="cyber-headline" kind="h3" text={copy.headline2} />
        <Divider />
        <TextBlock {...common} id="cyber-body" text={copy.body2} />
      </>}
    </div>
  </section>;
}
