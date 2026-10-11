import type {Locale} from '@/lib/i18n';
import {airShieldCopy} from '@/lib/airshield-descriptions';
import {TextBlock} from './TechnologyDescriptions';

export function AirShieldDescriptions({slide,locale,descriptor}:{slide:number;locale:Locale;descriptor:string}){
 const copy=airShieldCopy[locale][slide],first=slide===0,axes=[137.5,469.5,801.5];
 return <section className="technology-viewer__descriptions technology-viewer__airshield" aria-label={`AirShield — ${copy.headline.replaceAll('\n',' ')}`} data-airshield-slide={slide}>
 <svg viewBox="0 0 941 1522" role="presentation">
 <text x="50" y="107" fontSize="112" textLength="407" lengthAdjust="spacingAndGlyphs" aria-hidden="true">AirShield</text>
 <TextBlock locale={locale} id="air-descriptor" x={54} y={140} width={600} height={43} size={31} line={37} color="#975f41" text={descriptor}/>
 <TextBlock locale={locale} id="air-eyebrow" x={first?64:50} y={first?1110:954} width={first?830:520} height={40} size={26} line={34} tracking={first?0:2} color="#975f41" text={copy.eyebrow}/>
 <TextBlock locale={locale} id="air-headline" x={first?64:50} y={first?1167:1000} width={first?830:520} height={130} size={first?54:50} line={first?62:55} kind="h3" text={copy.headline}/>
 <line x1={first?64:50} x2={first?877:536} y1={first?1310:1138} y2={first?1310:1138} stroke="#8f8983" strokeWidth="1" aria-hidden="true"/>
 <TextBlock locale={locale} id="air-body" x={first?64:50} y={first?1344:1160} width={first?850:520} height={178} size={first?28:23} line={first?42:32} text={copy.body}/>
 {copy.captions.map((text,i)=><TextBlock key={i} locale={locale} id={`air-icon-${i}`} x={axes[i]-120} y={1484} width={240} height={34} size={14} line={17} weight={700} text={text}/>)}
 </svg></section>;
}
