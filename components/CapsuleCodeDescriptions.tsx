import type {Locale} from '@/lib/i18n';
import {capsuleCodeCopy} from '@/lib/capsulecode-descriptions';
import {TextBlock,Divider,IconReadingRow} from './TechnologyText';

export function CapsuleCodeDescriptions({slide,locale}:{slide:number;locale:Locale;descriptor:string}){
 const copy=capsuleCodeCopy[locale][slide];
 return <section className="technology-viewer__descriptions technology-viewer__capsule" aria-label={`CapsuleCode — ${copy.headline.replaceAll('\n',' ')}`} data-capsule-slide={slide}>
 <div className="technology-reading">

 <TextBlock locale={locale} id="capsule-eyebrow" text={copy.eyebrow}/>
 <TextBlock locale={locale} id="capsule-headline" kind="h3" text={copy.headline}/>
 <Divider />
 <TextBlock locale={locale} id="capsule-body" text={copy.body}/>
 {copy.captions.map((text,i)=><IconReadingRow key={i} photo={`capsule-${String(slide+1).padStart(2,'0')}`} id={`capsule-icon-${i}`} locale={locale}><TextBlock locale={locale} id={`capsule-icon-${i}`} weight={700} text={text}/></IconReadingRow>)}
 </div></section>;
}
