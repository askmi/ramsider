'use client';
import type {Locale} from '@/lib/i18n';
import {moodAquaCopy,type MoodAquaKind} from '@/lib/mood-aqua-descriptions';
import {TextBlock,Divider,IconReadingRow} from './TechnologyText';

export function MoodAquaDescriptions({kind,slide,locale}:{kind:MoodAquaKind;slide:number;locale:Locale;descriptor:string}){
 const copy=moodAquaCopy[locale][kind],common={locale},mood=kind==='mood',first=slide===0;
 return <section className="technology-viewer__descriptions technology-viewer__mood-aqua" aria-label={mood?'MoodEngine':'AquaSense'} data-mood-aqua={kind} data-mood-aqua-slide={slide+1}>
  <div className="technology-reading">
   <TextBlock {...common} id="mood-aqua-eyebrow" text={copy.eyebrows[slide]}/>
   <TextBlock {...common} id="mood-aqua-headline" kind="h3" text={copy.headlines[slide]}/>
   <Divider/>
   <TextBlock {...common} id="mood-aqua-body" text={copy.bodies[slide]}/>
   {!first&&mood&&<>
    {copy.features.slice(0,5).map((feature,i)=>{return <div className="technology-reading__feature" key={i}>
     <TextBlock {...common} id={`mood-number-${i}`} text={String(i+1).padStart(2,'0')}/>
     <TextBlock {...common} id={`mood-feature-${i}-title`} weight={700} kind="h4" text={feature.title}/>
     <TextBlock {...common} id={`mood-feature-${i}-body`} text={feature.body}/>
    </div>})}
    <IconReadingRow photo="mood-02" id="mood-online" locale={locale}>
      <TextBlock {...common} id="mood-online-title" weight={700} kind="h4" text={copy.features[5].title}/>
      <TextBlock {...common} id="mood-online-body" text={copy.features[5].body}/>
    </IconReadingRow>
    {copy.captions.map((text,i)=><IconReadingRow key={i} photo="mood-02" id={`mood-caption-${i}`} locale={locale}><TextBlock {...common} id={`mood-caption-${i}`} weight={700} text={text}/></IconReadingRow>)}
   </>}
   {!first&&!mood&&<>
    {copy.features.map((feature,i)=>{return <div className="technology-reading__feature" key={i}>
     <TextBlock {...common} id={`aqua-number-${i}`} text={String(i+1).padStart(2,'0')}/>
     <TextBlock {...common} id={`aqua-feature-${i}-title`} weight={700} kind="h4" text={feature.title}/>
     <TextBlock {...common} id={`aqua-feature-${i}-body`} text={feature.body}/>
    </div>})}
    <TextBlock {...common} id="aqua-core" weight={700} text={copy.core}/>
    {copy.statuses.map((text,i)=><TextBlock {...common} key={i} id={`aqua-status-${i}`} weight={i?400:700} text={text}/>)}
   </>}
  </div>
 </section>;
}
