import type {Locale} from '@/lib/i18n';
import {nobleCraftCopy,nobleMaterials,nobleMaterialDetails,nobleIconCaptions} from '@/lib/noblecraft-descriptions';
import {TextBlock,Divider,IconReadingRow} from './TechnologyText';
export function NobleCraftDescriptions({slide,locale}:{slide:number;locale:Locale}){
 const copy=nobleCraftCopy[locale],common={locale};
 return <section className="technology-viewer__descriptions" aria-label="NobleCraft"><div className="technology-reading">
 {slide===0?<>
 <TextBlock {...common} id="noble-eyebrow" text={copy[0]}/>
 <TextBlock {...common} id="noble-headline" kind="h3" text={copy[1]}/>
 <Divider/><TextBlock {...common} id="noble-body" text={copy[2]}/>
 </>:<>
 {nobleMaterials[locale].map((text,i)=><div className="technology-reading__feature" key={text}><TextBlock {...common} id={`material-${i}`} kind="h4" weight={700} text={`${String(i+1).padStart(2,'0')}  ${text}`}/><TextBlock {...common} id={`material-detail-${i}`} text={nobleMaterialDetails[locale][i]}/></div>)}
 <TextBlock {...common} id="noble-eyebrow" text={copy[3]}/>
 <TextBlock {...common} id="noble-headline" kind="h3" text={copy[4]}/>
 <Divider/><TextBlock {...common} id="noble-body" text={copy[5]}/>
 {nobleIconCaptions(locale).map((text,i)=><IconReadingRow key={i} photo={"noble-02"} id={`material-icon-${i}`} locale={locale}><TextBlock {...common} id={`material-icon-${i}`} weight={700} text={text}/></IconReadingRow>)}
 </>}
 </div></section>;
}
