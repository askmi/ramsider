'use client';
import type {Locale} from '@/lib/i18n';
import {powerArmorCopy} from '@/lib/power-armor-descriptions';
import {TextBlock,Divider} from './TechnologyDescriptions';

function BrandTitle({name,width,locale,descriptor}:{name:string;width:number;locale:Locale;descriptor:string}){
 return <g data-power-armor-title="live"><text x="50" y="107" fontSize="112" textLength={width} lengthAdjust="spacingAndGlyphs" aria-hidden="true">{name}</text><TextBlock locale={locale} id="power-armor-descriptor" x={54} y={131} width={260} height={43} size={31} line={37} color="#975f41" text={descriptor}/></g>;
}
function QuickCellTitle(props:{locale:Locale;descriptor:string}){return <BrandTitle {...props} name="QuickCell" width={437}/>}
function PolyArmorTitle(props:{locale:Locale;descriptor:string}){return <BrandTitle {...props} name="PolyArmor" width={477}/>}
export function PowerArmorDescriptions({kind,slide,locale,descriptor}:{kind:'quick'|'poly';slide:number;locale:Locale;descriptor:string}){
 const copy=powerArmorCopy[locale],index=kind==='poly'?2:slide,common={locale},detailed=index===1;
 const eyebrow=[1184,989,1106][index],headline=[1233,1038,1170][index],divider=[1367,1162,1250][index],body=[1380,1187,1285][index];
 return <section className="technology-viewer__descriptions technology-viewer__power-armor" aria-label={kind==='quick'?'QuickCell':'PolyArmor'} data-power-armor={kind} data-power-armor-slide={slide+1}>
  <svg viewBox="0 0 941 1522" role="presentation">
   {kind==='quick'?<QuickCellTitle locale={locale} descriptor={descriptor}/>:<PolyArmorTitle locale={locale} descriptor={descriptor}/>}
   <TextBlock {...common} id="power-armor-eyebrow" x={detailed?50:64} y={eyebrow} width={824} height={40} size={26} line={34} color="#975f41" tracking={detailed?1:0} text={copy.eyebrows[index]}/>
   <TextBlock {...common} id="power-armor-headline" x={detailed?50:64} y={headline} width={865} height={index===2?74:130} size={detailed?52:54} line={detailed?57:62} kind="h3" text={copy.headlines[index]}/>
   <Divider y={divider}/>
   <TextBlock {...common} id="power-armor-body" x={detailed?50:64} y={body} width={824} height={index===0?132:index===1?172:150} size={detailed?25:28} line={index===2?42:34} text={copy.bodies[index]}/>
   {detailed&&copy.captions.map((text,i)=><TextBlock {...common} key={i} id={`quick-caption-${i}`} x={[112,318,555,797][i]-105} y={1463} width={210} height={50} size={16} line={21} weight={700} text={text}/>)}
   {index===2&&<TextBlock {...common} id="poly-summary" x={64} y={1460} width={824} height={51} size={22} line={28} text={copy.summary}/>}
  </svg>
 </section>;
}
