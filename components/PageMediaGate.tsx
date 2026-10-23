'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import type {Locale} from '@/lib/i18n';
import {markStoryMediaReady,resetStoryMedia} from '@/lib/media-resource';
import {useMediaScroll} from '@/lib/media-scroll';
import {MediaFeedback} from './MediaLoading';
export function PageMediaGate({locale,children}:{locale:Locale;children:ReactNode}){
 const ref=useRef<HTMLDivElement>(null),state=useMediaScroll(ref,true);
 useEffect(()=>{
  document.documentElement.setAttribute('data-media-hydrated','');window.dispatchEvent(new Event('media-hydrated'));resetStoryMedia();
  const update=()=>{const images=ref.current?.querySelectorAll('img[data-media]');if(images?.length&&[...images].every(image=>image.hasAttribute('data-media-ready')))markStoryMediaReady();};
  document.addEventListener('media-state',update);return()=>{document.removeEventListener('media-state',update);resetStoryMedia();};
 },[]);
 return <div ref={ref} className="page-media-shell" data-media-blocked={state.blocked?'':undefined}><div className="page-media-content">{children}</div>
 <MediaFeedback className="page-media-overlay" active={state.blocked||state.error} locale={locale} progress={state.progress} error={state.error} onRetry={state.retry}/></div>;
}
