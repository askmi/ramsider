'use client';
import type { Locale } from '@/lib/i18n';
import {ProgressiveImage} from './ProgressiveImage';
export function WellnessPhoto({src,alt,position,hero,preview}:{src:string;alt:string;position:string;hero:boolean;locale:Locale;preview:string}){
 return <figure className="wellness-photo"><ProgressiveImage src={src} preview={preview} alt={alt} width={1024} height={1536} loading="eager" style={{objectPosition:position}} data-hero={hero?'':undefined}/></figure>;
}
