import type {Locale} from '@/lib/i18n';
import {createContext,useContext,useLayoutEffect,useRef,type ReactNode,type CSSProperties} from 'react';
import {readingIconSource} from '@/lib/technology-icons';

type BlockProps = {
  id: string;
  kind?: 'h3' | 'h4' | 'p' | 'span';
  text: string;
  locale: Locale;
  weight?: number;
};

/** Reading text flows independently from the illustration and never shrinks to fit. */
export function TextBlock({id, kind: Tag = 'p', text, locale, weight}: BlockProps) {
  return <Tag data-description-block={id} className={`technology-description__copy${id.includes('eyebrow') ? ' technology-description__eyebrow' : ''}`} lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} style={{fontWeight: weight ?? (Tag === 'h4' ? 700 : 400)}}>
    {text.replaceAll('\n', ' ')}
  </Tag>;
}

export function Divider() {
  return <hr className="technology-reading__divider" aria-hidden="true"/>;
}

const brandWidths: Record<string, number> = {CapsuleCode:625, CyberMind:500, TouchLink:465, MoodEngine:575, AquaSense:528, AirShield:407, QuickCell:437, PolyArmor:477};

/** NobleCraft and HeatCore already contain their source brand lettering. */
export function TechnologyArtTitle({name, descriptor, width, height}: {name: string; descriptor: string; width: number; height: number}) {
  const brandWidth = brandWidths[name];
  if (!brandWidth) return null;
  return <div className="technology-viewer__art-title" aria-hidden="true">
    <svg viewBox={`0 0 ${width} ${height}`}><text x="50" y="107" fontSize="112" textLength={brandWidth} lengthAdjust="spacingAndGlyphs">{name}</text></svg>
    <span>{descriptor}</span>
  </div>;
}

export const ReadingIconSources=createContext<Readonly<Record<string,HTMLImageElement>>>({});

/** Insert the actual decoded resource before paint, keeping one complete frame. */
export function RetainedDecoration({image,className,style,width,height}: {image:HTMLImageElement;className?:string;style?:CSSProperties;width:number;height:number}) {
 const host=useRef<HTMLSpanElement>(null);
 useLayoutEffect(()=>{
  image.setAttribute('alt','');image.setAttribute('aria-hidden','true');image.setAttribute('draggable','false');
  image.setAttribute('width',String(width));image.setAttribute('height',String(height));image.setAttribute('class',className??'');
  image.removeAttribute('style');
  if(style)Object.assign(image.style,style);
  host.current?.replaceChildren(image);
 },[image,className,style,width,height]);
 return <span ref={host} style={{display:'contents'}} aria-hidden="true"/>;
}

/** One source pictogram and its readable localized content form one row. */
export function IconReadingRow({photo,id,locale,children}: {photo:string;id:string;locale:Locale;children:ReactNode}) {
  const sources=useContext(ReadingIconSources);
  const source=readingIconSource(photo,id);
  return <div className="technology-reading__icon-row" data-reading-icon={id} data-icon-photo={photo} dir={locale==='ar'?'rtl':'ltr'}>
    {sources[source]&&<RetainedDecoration image={sources[source]} width={48} height={48}/>}
    <div className="technology-reading__icon-copy">{children}</div>
  </div>;
}
