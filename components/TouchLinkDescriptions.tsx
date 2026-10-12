'use client';
import type { Locale } from '@/lib/i18n';
import { touchLinkCopy } from '@/lib/touchlink-descriptions';
import { Divider, TextBlock, IconReadingRow } from './TechnologyText';

export function TouchLinkDescriptions({ slide, locale }: { slide: number; locale: Locale; descriptor: string }) {
 const copy=touchLinkCopy[locale],common={locale};
 return <section className="technology-viewer__descriptions" aria-label="TouchLink" data-touchlink-slide={slide+1}>
  <div className="technology-reading">
   {slide===0?<>
    <TextBlock {...common} id="touch-eyebrow" text={copy.eyebrow}/>
    <TextBlock {...common} id="touch-headline" kind="h3" text={copy.headline}/>
    <Divider/>
    <TextBlock {...common} id="touch-body" text={copy.body}/>
   </>:<>
    <TextBlock {...common} id="touch-headline" kind="h3" text={slide===1?copy.appHeading:copy.directHeading}/>
    {(slide===1?copy.app:copy.direct).map((feature,i)=><IconReadingRow photo={slide===1?'touch-02':'touch-03'} id={`touch-feature-${i}`} locale={locale} key={i}>
     <TextBlock {...common} id={`touch-feature-${i+1}-title`} weight={700} kind="h4" text={feature.title}/>
     <TextBlock {...common} id={`touch-feature-${i+1}-body`} text={feature.body}/>
    </IconReadingRow>)}
   </>}
  </div>
 </section>;
}
