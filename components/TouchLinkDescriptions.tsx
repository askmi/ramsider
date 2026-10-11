'use client';
import type { Locale } from '@/lib/i18n';
import { touchLinkCopy } from '@/lib/touchlink-descriptions';
import { Divider, TextBlock } from './TechnologyDescriptions';

function TouchLinkTitle({ locale, descriptor }: { locale: Locale; descriptor: string }) {
 return <g data-touchlink-title="live">
  <text x="50" y="107" fontSize="112" textLength="465" lengthAdjust="spacingAndGlyphs" aria-hidden="true">TouchLink</text>
  <TextBlock locale={locale} id="touch-descriptor" x={54} y={131} width={600} height={43} size={31} line={37} color="#975f41" text={descriptor}/>
 </g>;
}

export function TouchLinkDescriptions({ slide, locale, descriptor }: { slide: number; locale: Locale; descriptor: string }) {
 const copy=touchLinkCopy[locale],common={locale};
 const tops=slide===1?[1058,1143,1227,1312,1396]:[429,590,756,927,1104];
 return <section className="technology-viewer__descriptions" aria-label="TouchLink" data-touchlink-slide={slide+1}>
  <svg viewBox="0 0 941 1522" role="presentation">
   <TouchLinkTitle locale={locale} descriptor={descriptor}/>
   {slide===0?<>
    <TextBlock {...common} id="touch-eyebrow" x={64} y={1155} width={810} height={40} size={26} line={34} color="#975f41" text={copy.eyebrow}/>
    <TextBlock {...common} id="touch-headline" x={64} y={1186} width={873} height={133} size={54.5} line={62} kind="h3" text={copy.headline}/>
    <Divider y={1340}/>
    <TextBlock {...common} id="touch-body" x={64} y={1354} width={873} height={162} size={28} line={37} text={copy.body}/>
   </>:<>
    <TextBlock {...common} id="touch-headline" x={54} y={slide===1?211:245} width={800} height={120} size={51} line={55} kind="h3" text={slide===1?copy.appHeading:copy.directHeading}/>
    {(slide===1?copy.app:copy.direct).map((feature,i)=><g key={i}>
     <TextBlock {...common} id={`touch-feature-${i+1}-title`} x={slide===1?163:135} y={tops[i]} width={slide===1?705:275} height={43} size={slide===1?23:25} line={30} weight={700} kind="h4" text={feature.title}/>
     <TextBlock {...common} id={`touch-feature-${i+1}-body`} x={slide===1?163:135} y={tops[i]+(slide===1?38:43)} width={slide===1?705:275} height={slide===1?39:i===3||i===4?109:84} size={slide===1?18:21} line={slide===1?25:28} text={feature.body}/>
    </g>)}
   </>}
  </svg>
 </section>;
}
