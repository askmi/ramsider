'use client';
import type {Locale} from '@/lib/i18n';
import {moodAquaCopy,type MoodAquaKind} from '@/lib/mood-aqua-descriptions';
import {TextBlock,Divider} from './TechnologyDescriptions';

function BrandTitle({name,width,locale,descriptor}:{name:string;width:number;locale:Locale;descriptor:string}){
 return <g data-mood-aqua-title="live"><text x="50" y="107" fontSize="112" textLength={width} lengthAdjust="spacingAndGlyphs" aria-hidden="true">{name}</text><TextBlock locale={locale} id="mood-aqua-descriptor" x={54} y={131} width={260} height={43} size={31} line={37} color="#975f41" text={descriptor}/></g>;
}
function MoodEngineTitle(props:{locale:Locale;descriptor:string}){return <BrandTitle {...props} name="MoodEngine" width={575}/>}
function AquaSenseTitle(props:{locale:Locale;descriptor:string}){return <BrandTitle {...props} name="AquaSense" width={528}/>}

export function MoodAquaDescriptions({kind,slide,locale,descriptor}:{kind:MoodAquaKind;slide:number;locale:Locale;descriptor:string}){
 const copy=moodAquaCopy[locale][kind],common={locale},mood=kind==='mood',first=slide===0;
 const sourceWidth=!mood&&first?940:941;
 const eyebrow=first?1110:mood?965:1008,headline=first?1163:mood?1010:1050,divider=first?1311:mood?1150:1194,body=first?(mood?1326:1343):(mood?1175:1220);
 return <section className="technology-viewer__descriptions technology-viewer__mood-aqua" aria-label={mood?'MoodEngine':'AquaSense'} data-mood-aqua={kind} data-mood-aqua-slide={slide+1}>
  <svg viewBox={`0 0 ${sourceWidth} 1522`} role="presentation">
   {mood?<MoodEngineTitle locale={locale} descriptor={descriptor}/>:<AquaSenseTitle locale={locale} descriptor={descriptor}/>}
   <TextBlock {...common} id="mood-aqua-eyebrow" x={first?64:54} y={eyebrow} width={824} height={40} size={26} line={34} color="#975f41" tracking={first?0:1} text={copy.eyebrows[slide]}/>
   <TextBlock {...common} id="mood-aqua-headline" x={first?64:54} y={headline} width={865} height={137} size={first?54:52} line={first?62:57} kind="h3" text={copy.headlines[slide]}/>
   <Divider y={divider}/>
   <TextBlock {...common} id="mood-aqua-body" x={first?64:54} y={body} width={824} height={mood&&!first?185:1522-body-9} size={first?28:mood?25:27} line={first&&!mood?42:mood&&!first?34:37} text={copy.bodies[slide]}/>
   {!first&&mood&&<>
    {copy.features.slice(0,5).map((feature,i)=>{const y=[365,470,574,697,801][i];return <g key={i}>
     <TextBlock {...common} id={`mood-number-${i}`} x={54} y={y} width={37} height={37} size={22} line={28} color="#fff" text={String(i+1).padStart(2,'0')}/>
     <TextBlock {...common} id={`mood-feature-${i}-title`} x={94} y={y} width={255} height={39} size={22} line={28} weight={700} kind="h4" color="#fff" text={feature.title}/>
     <TextBlock {...common} id={`mood-feature-${i}-body`} x={54} y={y+31} width={292} height={i===2?74:54} size={16} line={21} color="#fff" text={feature.body}/>
    </g>})}
    <TextBlock {...common} id="mood-online-title" x={733} y={858} width={195} height={34} size={20} line={26} weight={700} kind="h4" color="#fff" text={copy.features[5].title}/>
    <TextBlock {...common} id="mood-online-body" x={733} y={889} width={195} height={61} size={16} line={21} color="#fff" text={copy.features[5].body}/>
    {copy.captions.map((text,i)=><TextBlock {...common} key={i} id={`mood-caption-${i}`} x={[96,272,444,628,808][i]-88} y={1455} width={176} height={58} size={16} line={21} weight={700} text={text}/>)}
   </>}
   {!first&&!mood&&<>
    {copy.features.map((feature,i)=>{const y=[288,431,576][i];return <g key={i}>
     <TextBlock {...common} id={`aqua-number-${i}`} x={681} y={y-3} width={57} height={44} size={29} line={36} text={String(i+1).padStart(2,'0')}/>
     <TextBlock {...common} id={`aqua-feature-${i}-title`} x={747} y={y} width={177} height={38} size={18} line={24} weight={700} kind="h4" text={feature.title}/>
     <TextBlock {...common} id={`aqua-feature-${i}-body`} x={747} y={y+34} width={188} height={81} size={18} line={24} text={feature.body}/>
    </g>})}
    <TextBlock {...common} id="aqua-core" x={706} y={703} width={134} height={66} size={16} line={20} weight={700} text={copy.core}/>
    {copy.statuses.map((text,i)=><TextBlock {...common} key={i} id={`aqua-status-${i}`} x={[121,392,681][i]} y={913} width={[229,250,195][i]} height={39} size={18} line={24} weight={i?400:700} text={text}/>)}
   </>}
  </svg>
 </section>;
}
