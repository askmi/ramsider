import type {Locale} from '@/lib/i18n';
import {airShieldCopy} from '@/lib/airshield-descriptions';
import {TextBlock,Divider,IconReadingRow} from './TechnologyText';

export function AirShieldDescriptions({slide,locale}:{slide:number;locale:Locale;descriptor:string}){
 const copy=airShieldCopy[locale][slide];
 return <section className="technology-viewer__descriptions technology-viewer__airshield" aria-label={`AirShield — ${copy.headline.replaceAll('\n',' ')}`} data-airshield-slide={slide}>
 <div className="technology-reading">

 <TextBlock locale={locale} id="air-eyebrow" text={copy.eyebrow}/>
 <TextBlock locale={locale} id="air-headline" kind="h3" text={copy.headline}/>
 <Divider />
 <TextBlock locale={locale} id="air-body" text={copy.body}/>
 {copy.captions.map((text,i)=><IconReadingRow key={i} photo={"air-02"} id={`air-icon-${i}`} locale={locale}><TextBlock locale={locale} id={`air-icon-${i}`} weight={700} text={text}/></IconReadingRow>)}
 </div></section>;
}
