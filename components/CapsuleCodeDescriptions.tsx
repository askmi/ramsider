import type {Locale} from '@/lib/i18n';
import {capsuleCodeCopy} from '@/lib/capsulecode-descriptions';
import {TextBlock} from './TechnologyDescriptions';

export function CapsuleCodeDescriptions({slide,locale,descriptor}:{slide:number;locale:Locale;descriptor:string}){
 const copy=capsuleCodeCopy[locale][slide],first=slide===0,width=first?940:941;
 const axes=slide===1?[107,300,516,735]:[105,288,506,733];
 return <section className="technology-viewer__descriptions technology-viewer__capsule" aria-label={`CapsuleCode — ${copy.headline.replaceAll('\n',' ')}`} data-capsule-slide={slide}>
 <svg viewBox={`0 0 ${width} 1522`} role="presentation">
 <text x="50" y="107" fontSize="112" textLength="625" lengthAdjust="spacingAndGlyphs" aria-hidden="true">CapsuleCode</text>
 <TextBlock locale={locale} id="capsule-descriptor" x={54} y={140} width={600} height={43} size={31} line={37} color="#975f41" text={descriptor}/>
 <TextBlock locale={locale} id="capsule-eyebrow" x={first?64:48} y={first?1074:1052} width={830} height={40} size={26} line={34} tracking={first?0:2} color="#975f41" text={copy.eyebrow}/>
 <TextBlock locale={locale} id="capsule-headline" x={first?64:48} y={first?1117:1095} width={830} height={130} size={first?54:50} line={first?62:55} kind="h3" text={copy.headline}/>
 <line x1={first?64:48} x2={878} y1={first?1256:1232} y2={first?1256:1232} stroke="#8f8983" strokeWidth="1" aria-hidden="true"/>
 <TextBlock locale={locale} id="capsule-body" x={first?64:48} y={first?1275:1250} width={first?876:840} height={first?238:159} size={first?28:24} line={first?36:31} text={copy.body}/>
 {copy.captions.map((text,i)=><TextBlock key={i} locale={locale} id={`capsule-icon-${i}`} x={axes[i]-90} y={1484} width={180} height={34} size={14} line={17} weight={700} text={text}/>)}
 </svg></section>;
}
