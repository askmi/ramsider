import type {Locale} from '@/lib/i18n';
import {nobleCraftCopy,nobleMaterials,nobleMaterialDetails,nobleIconCaptions} from '@/lib/noblecraft-descriptions';
import {TextBlock,Divider} from './TechnologyDescriptions';
export function NobleCraftDescriptions({slide,locale}:{slide:number;locale:Locale}){
 const copy=nobleCraftCopy[locale],common={locale};
 return <section className="technology-viewer__descriptions" aria-label="NobleCraft"><svg viewBox="0 0 941 1522" preserveAspectRatio="none" role="presentation">
 {slide===0?<>
 <TextBlock {...common} id="noble-eyebrow" x={64} y={1085} height={40} size={26} color="#975f41" text={copy[0]}/>
 <TextBlock {...common} id="noble-headline" x={64} y={1127} height={185} size={50} line={61} kind="h3" text={copy[1]}/>
 <Divider y={1329}/><TextBlock {...common} id="noble-body" x={64} y={1340} height={178} size={30} line={35} text={copy[2]}/>
 </>:<>
 {nobleMaterials[locale].map((text,i)=><TextBlock {...common} key={text} id={`material-${i}`} x={38+i*181} y={915} width={173} height={38} size={16} line={20} weight={600} text={`${String(i+1).padStart(2,'0')}  ${text}`}/>)}
 {nobleMaterialDetails[locale].map((text,i)=><TextBlock {...common} key={text} id={`material-detail-${i}`} x={38+i*181} y={954} width={173} height={76} size={22} line={25} text={text}/>)}
 <TextBlock {...common} id="noble-eyebrow" x={48} y={1040} height={40} size={26} color="#975f41" tracking={2} text={copy[3]}/>
 <TextBlock {...common} id="noble-headline" x={48} y={1086} height={112} size={49} line={57} kind="h3" text={copy[4]}/>
 <Divider y={1218}/><TextBlock {...common} id="noble-body" x={48} y={1237} height={143} size={28} line={35} text={copy[5]}/>
 {nobleIconCaptions(locale).map((text,i)=><TextBlock {...common} key={text} id={`material-icon-${i}`} x={10+i*176} y={1485} width={173} height={36} size={14} line={16} weight={700} text={text}/>)}
 </>}
 </svg></section>;
}
