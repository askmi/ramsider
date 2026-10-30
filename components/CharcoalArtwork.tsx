import type {Locale} from '@/lib/i18n';
import {charcoalTiles,charcoalHeights} from '@/lib/charcoal-assets';
import previews from '@/lib/media-previews.json';
import {ProgressiveImage} from './ProgressiveImage';

const previewHeight=charcoalHeights.reduce((sum,height)=>sum+height,0);
export function CharcoalArtwork({index,visibleHeight}:{index:number;visibleHeight:number;locale:Locale}){
 const sourceTop=charcoalHeights.slice(0,index-1).reduce((sum,height)=>sum+height,0);
 return <div className="charcoal-art-host" style={{aspectRatio:`1080 / ${visibleHeight}`}}>
  {charcoalTiles[index-1].map(tile=>{
   const preview=previews[tile.src as keyof typeof previews].src;
   return <div key={tile.src} className={`charcoal-tile${tile.top?' charcoal-tile--fade':''}`} style={{top:`calc(${tile.top}/1080*100cqw)`,aspectRatio:`1080 / ${Math.min(tile.height,visibleHeight-tile.top)}`}}>
    <div className="charcoal-tile__image">
     <div aria-hidden="true" className="charcoal-tile__preview" style={{aspectRatio:`1080 / ${tile.height}`,backgroundImage:`url("${preview}")`,backgroundSize:`100% calc(${previewHeight}/1080*100cqw)`,backgroundPosition:`0 calc(-${sourceTop+tile.top}/1080*100cqw)`}}/>
     <ProgressiveImage src={tile.src} preview={preview} className="charcoal-art" width={1080} height={tile.height} decoding="sync" alt="" aria-hidden="true" draggable={false}/>
    </div>
   </div>;
  })}
 </div>;
}
