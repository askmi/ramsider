import type {Locale} from '@/lib/i18n';
import {charcoalTiles} from '@/lib/charcoal-assets';
import previews from '@/lib/media-previews.json';
import {ProgressiveImage} from './ProgressiveImage';
export function CharcoalArtwork({index,visibleHeight}:{index:number;visibleHeight:number;locale:Locale}){
 return <div className="charcoal-art-host" style={{aspectRatio:`1080 / ${visibleHeight}`}}>{charcoalTiles[index-1].map(tile=><div key={tile.src} className="charcoal-tile" style={{top:`calc(${tile.top}/1080*100cqw)`,aspectRatio:`1080 / ${Math.min(tile.height,visibleHeight-tile.top)}`}}><div className="charcoal-tile__image"><ProgressiveImage src={tile.src} preview={previews[tile.src as keyof typeof previews].src} className="charcoal-art" width={1080} height={tile.height} alt="" aria-hidden="true" draggable={false}/></div></div>)}</div>;
}
