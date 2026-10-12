'use client';
import type {Locale} from '@/lib/i18n';
import {powerArmorCopy} from '@/lib/power-armor-descriptions';
import {TextBlock,Divider,IconReadingRow} from './TechnologyText';

export function PowerArmorDescriptions({kind,slide,locale}:{kind:'quick'|'poly';slide:number;locale:Locale;descriptor:string}){
 const copy=powerArmorCopy[locale],index=kind==='poly'?2:slide,common={locale},detailed=index===1;
 return <section className="technology-viewer__descriptions technology-viewer__power-armor" aria-label={kind==='quick'?'QuickCell':'PolyArmor'} data-power-armor={kind} data-power-armor-slide={slide+1}>
  <div className="technology-reading">
   <TextBlock {...common} id="power-armor-eyebrow" text={copy.eyebrows[index]}/>
   <TextBlock {...common} id="power-armor-headline" kind="h3" text={copy.headlines[index]}/>
   <Divider/>
   <TextBlock {...common} id="power-armor-body" text={copy.bodies[index]}/>
   {detailed&&copy.captions.map((text,i)=><IconReadingRow key={i} photo={"quick-02"} id={`quick-caption-${i}`} locale={locale}><TextBlock {...common} id={`quick-caption-${i}`} weight={700} text={text}/></IconReadingRow>)}
   {index===2&&<TextBlock {...common} id="poly-summary" text={copy.summary}/>}
  </div>
 </section>;
}
