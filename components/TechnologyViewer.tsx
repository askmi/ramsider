 'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type PointerEvent} from 'react';
import type {Locale} from '@/lib/i18n';
import type {TechnologyDescriptionCopy,TechnologySlideId} from '@/lib/technology-descriptions';
import {technologyGroups,technologyGroupCopy} from '@/lib/technology-gallery';
import {loadImage} from '@/lib/media-resource';
import {LoadingStatus,useScrollLock} from './MediaLoading';
import {TechnologyDescriptions} from './TechnologyDescriptions';
import {NobleCraftDescriptions} from './NobleCraftDescriptions';
import {nobleCraftCopy} from '@/lib/noblecraft-descriptions';
type ViewerCopy = { technology: string; close: string; nextGroup: string; names: readonly [string, string, string, string] };
const copy: Record<Locale, ViewerCopy> = {
  en: { technology: 'Technology', close: 'Close technology viewer', nextGroup: 'Next Technology', names: ['Three heaters', 'Active air sails', 'Programmable heat profiles', 'Gold and titanium nitride'] },
  ru: { technology: 'Технология', close: 'Закрыть просмотр технологий', nextGroup: 'Следующая технология', names: ['Три нагревателя', 'Активные воздушные паруса', 'Программируемые профили нагрева', 'Золото и нитрид титана'] },
  de: { technology: 'Technologie', close: 'Technologieansicht schließen', nextGroup: 'Nächste Technologie', names: ['Drei Heizelemente', 'Aktive Luftsegel', 'Programmierbare Wärmeprofile', 'Gold und Titannitrid'] },
  fr: { technology: 'Technologie', close: 'Fermer la galerie', nextGroup: 'Technologie suivante', names: ['Trois éléments chauffants', 'Volets d’air actifs', 'Profils de chauffe programmables', 'Or et nitrure de titane'] },
  es: { technology: 'Tecnología', close: 'Cerrar la galería', nextGroup: 'Siguiente tecnología', names: ['Tres calentadores', 'Aletas de aire activas', 'Perfiles de calor programables', 'Oro y nitruro de titanio'] },
  it: { technology: 'Tecnologia', close: 'Chiudi la galleria', nextGroup: 'Tecnologia successiva', names: ['Tre riscaldatori', 'Alette d’aria attive', 'Profili di calore programmabili', 'Oro e nitruro di titanio'] },
  tr: { technology: 'Teknoloji', close: 'Teknoloji görünümünü kapat', nextGroup: 'Sonraki teknoloji', names: ['Üç ısıtıcı', 'Aktif hava kanatları', 'Programlanabilir ısı profilleri', 'Altın ve titanyum nitrür'] },
  ar: { technology: 'تقنية', close: 'إغلاق معرض التقنيات', nextGroup: 'التقنية التالية', names: ['ثلاثة سخانات', 'زعانف هوائية نشطة', 'ملفات حرارة قابلة للبرمجة', 'الذهب ونتريد التيتانيوم'] },
  zh: { technology: '技术', close: '关闭技术图库', nextGroup: '下一项技术', names: ['三个加热器', '主动导流翼', '可编程加热曲线', '黄金与氮化钛'] },
  ja: { technology: 'テクノロジー', close: '技術ギャラリーを閉じる', nextGroup: '次の技術', names: ['3つのヒーター', 'アクティブエアセイル', 'プログラム可能な加熱プロファイル', '金と窒化チタン'] },
  ko: { technology: '기술', close: '기술 갤러리 닫기', nextGroup: '다음 기술', names: ['세 개의 히터', '액티브 에어 세일', '프로그래밍 가능한 열 프로필', '금과 질화 티타늄'] },
};

function Chevron({direction}:{direction:'left'|'right'|'up'|'down'}){
 return <svg className={`technology-viewer__chevron technology-viewer__chevron--${direction}`} viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3 10 8 5 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

/** Mount the already decoded resource itself, rather than another not-yet-decoded IMG. */
function RetainedPhoto({ image, name }: { image: HTMLImageElement; name: string }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    image.setAttribute('alt', name);
    image.setAttribute('draggable', 'false');
    host.current?.replaceChildren(image);
  }, [image, name]);
  return <div className="technology-viewer__photo" ref={host} />;
}

const photoLabels:Record<Locale,readonly[string,string]>={en:['Previous photo','Next Photo'],ru:['Предыдущее фото','Следующее фото'],de:['Vorheriges Foto','Nächstes Foto'],fr:['Photo précédente','Photo suivante'],es:['Foto anterior','Siguiente foto'],it:['Foto precedente','Foto successiva'],tr:['Önceki fotoğraf','Sonraki fotoğraf'],ar:['الصورة السابقة','الصورة التالية'],zh:['上一张照片','下一张照片'],ja:['前の写真','次の写真'],ko:['이전 사진','다음 사진']};

type Position={group:number;photo:number};
type Contact={x:number;y:number;id:number;up:boolean;down:boolean;axis:'horizontal'|'vertical'|null};
export function TechnologyViewer({locale,descriptions}:{locale:Locale;descriptions:TechnologyDescriptionCopy}){
 const dialog=useRef<HTMLDialogElement>(null),viewport=useRef<HTMLDivElement>(null),opener=useRef<HTMLElement|null>(null);
 const displayed=useRef<Position>({group:0,photo:0}),requested=useRef<Position>({group:0,photo:0}),pending=useRef(false),token=useRef(0),subscription=useRef<(()=>void)|null>(null),locked=useRef(0);
 const contact=useRef<Contact|null>(null),pointer=useRef<Contact|null>(null);
 const wheel=useRef({at:0,x:0,y:0,axis:null as 'horizontal'|'vertical'|null,committed:false,pan:false});
 const [open,setOpen]=useState(false),[position,setPosition]=useState<Position>({group:0,photo:0}),[image,setImage]=useState<HTMLImageElement|null>(null),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false),[progress,setProgress]=useState<number|null>(null);
 const labels=copy[locale],photos=photoLabels[locale],group=technologyGroups[position.group],slide=group.slides[position.photo];
 useScrollLock(open);
 const select=useCallback((next:Position)=>{
  requested.current=next;pending.current=true;contact.current=null;pointer.current=null;locked.current=viewport.current?.scrollTop??0;
  setLoading(true);setFailed(false);setProgress(null);subscription.current?.();const revision=++token.current;
  const resource=loadImage(technologyGroups[next.group].slides[next.photo].src,'auto');
  subscription.current=resource.subscribe(value=>{if(revision===token.current)setProgress(value.total?Math.round(value.loaded/value.total*100):null);});
  resource.ready.then(photo=>{
   if(revision!==token.current||!dialog.current?.open)return;
   displayed.current=next;setPosition(next);setImage(photo);pending.current=false;setLoading(false);subscription.current?.();subscription.current=null;
  }).catch(()=>{if(revision===token.current&&dialog.current?.open){setFailed(true);subscription.current?.();subscription.current=null;}});
 },[]);
 const move=useCallback((axis:'horizontal'|'vertical',delta:number)=>{
  if(pending.current)return;const current=displayed.current;
  const next=axis==='horizontal'?{...current,photo:current.photo+delta}:{group:current.group+delta,photo:0};
  if(next.group<0||next.group>=technologyGroups.length||next.photo<0||next.photo>=technologyGroups[next.group].slides.length)return;
  select(next);
 },[select]);
 useLayoutEffect(()=>{viewport.current?.scrollTo({top:0,left:0,behavior:'instant'});},[image]);
 useLayoutEffect(()=>{
  const v=viewport.current;if(!open||!image||!v)return;
  const update=()=>v.style.setProperty('--technology-touch-action',v.scrollHeight>v.clientHeight+1?'pan-y pinch-zoom':'pinch-zoom');
  update();const observer=new ResizeObserver(update);observer.observe(v);if(v.firstElementChild)observer.observe(v.firstElementChild);
  return()=>observer.disconnect();
 },[open,image]);
 useLayoutEffect(()=>{if(loading&&dialog.current?.open)dialog.current.focus({preventScroll:true});},[loading]);
 useEffect(()=>{
  const warm=()=>technologyGroups.forEach(g=>g.slides.forEach(s=>{void loadImage(s.src).ready.catch(()=>{});}));
  if(document.readyState==='complete')warm();else window.addEventListener('load',warm,{once:true});
  return()=>window.removeEventListener('load',warm);
 },[]);
 useEffect(()=>{
  const activate=(event:MouseEvent)=>{
   const trigger=event.target instanceof Element?event.target.closest<HTMLElement>('[data-technology-open]'):null;
   if(!trigger||dialog.current?.open)return;event.preventDefault();opener.current=trigger;displayed.current={group:0,photo:0};setPosition(displayed.current);setImage(null);setOpen(true);dialog.current?.showModal();select(displayed.current);
  };
  document.addEventListener('click',activate);return()=>{document.removeEventListener('click',activate);subscription.current?.();};
 },[select]);
 const start=useCallback((x:number,y:number,id:number):Contact=>{
  const v=viewport.current;return{x,y,id,axis:null,up:!v||v.scrollTop<=1,down:!v||v.scrollTop>=v.scrollHeight-v.clientHeight-1};
 },[]);
 const finish=useCallback((c:Contact,x:number,y:number)=>{
  const dx=x-c.x,dy=y-c.y;if(c.axis!=='vertical'&&Math.abs(dx)>=24&&Math.abs(dx)>=Math.abs(dy)*1.2)move('horizontal',dx<0?1:-1);
  else if(c.axis!=='horizontal'&&Math.abs(dy)>=24&&Math.abs(dy)>=Math.abs(dx)*1.2&&((dy<0&&c.down)||(dy>0&&c.up)))move('vertical',dy<0?1:-1);
 },[move]);
 useEffect(()=>{
  if(!open||!viewport.current)return;const v=viewport.current;
  wheel.current={at:0,x:0,y:0,axis:null,committed:false,pan:false};
  const onWheel=(event:WheelEvent)=>{
   if(event.ctrlKey||(!event.deltaX&&!event.deltaY))return;
   if(pending.current){event.preventDefault();wheel.current.at=performance.now();wheel.current.committed=true;return;}
   const now=performance.now();if(now-wheel.current.at>180)wheel.current={at:now,x:0,y:0,axis:null,committed:false,pan:false};
   const g=wheel.current;g.at=now;const scale=event.deltaMode===1?16:event.deltaMode===2?v.clientHeight:1;g.x+=event.deltaX*scale;g.y+=event.deltaY*scale;
   if(!g.axis&&Math.max(Math.abs(g.x),Math.abs(g.y))>=12){
    if(Math.abs(g.x)>=Math.abs(g.y)*1.2)g.axis='horizontal';else if(Math.abs(g.y)>=Math.abs(g.x)*1.2){g.axis='vertical';g.pan=g.y>0?v.scrollTop<v.scrollHeight-v.clientHeight-1:v.scrollTop>1;}
   }
   if(g.pan)return;
   if(g.axis||Math.abs(event.deltaX)>Math.abs(event.deltaY)*1.2)event.preventDefault();
   if(!g.axis||g.committed)return;const distance=g.axis==='horizontal'?g.x:g.y;if(Math.abs(distance)<45)return;
   g.committed=true;move(g.axis,g.axis==='horizontal'?(distance<0?1:-1):(distance>0?1:-1));
  };
  const onStart=(e:globalThis.TouchEvent)=>{contact.current=e.touches.length===1&&!pending.current?start(e.touches[0].clientX,e.touches[0].clientY,e.touches[0].identifier):null;};
  const onMove=(e:globalThis.TouchEvent)=>{
   const c=contact.current;if(!c)return;if(e.touches.length!==1){contact.current=null;return;}const t=e.touches[0];if(t.identifier!==c.id){contact.current=null;return;}
   const dx=t.clientX-c.x,dy=t.clientY-c.y;
   if(!c.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=8){if(Math.abs(dx)>=Math.abs(dy)*1.2)c.axis='horizontal';else if(Math.abs(dy)>=Math.abs(dx)*1.2)c.axis='vertical';}
   if(c.axis==='horizontal'||(c.axis==='vertical'&&((dy<0&&c.down)||(dy>0&&c.up))))e.preventDefault();
  };
  const onEnd=(e:globalThis.TouchEvent)=>{const c=contact.current;contact.current=null;if(!c||e.touches.length)return;const t=Array.from(e.changedTouches).find(t=>t.identifier===c.id);if(t)finish(c,t.clientX,t.clientY);};
  const cancel=()=>{contact.current=null;};
  v.addEventListener('wheel',onWheel,{passive:false});v.addEventListener('touchstart',onStart,{passive:true});v.addEventListener('touchmove',onMove,{passive:false});v.addEventListener('touchend',onEnd);v.addEventListener('touchcancel',cancel);
  return()=>{v.removeEventListener('wheel',onWheel);v.removeEventListener('touchstart',onStart);v.removeEventListener('touchmove',onMove);v.removeEventListener('touchend',onEnd);v.removeEventListener('touchcancel',cancel);};
 },[open,move,start,finish]);
 const pointerDown=(e:PointerEvent<HTMLDivElement>)=>{if(e.pointerType==='touch'||!e.isPrimary||e.button!==0||pending.current)return;pointer.current=start(e.clientX,e.clientY,e.pointerId);try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}};
 return <dialog ref={dialog} id="technology-viewer" className="technology-viewer" data-group={group.title} data-photo-index={position.photo} aria-busy={loading} aria-labelledby="technology-viewer-title" tabIndex={-1}
 onClose={()=>{token.current++;pending.current=false;contact.current=null;pointer.current=null;subscription.current?.();subscription.current=null;setOpen(false);setLoading(false);opener.current?.focus({preventScroll:true});}}
 onKeyDown={e=>{
  if(e.key==='Tab'){const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]'));const index=controls.indexOf(document.activeElement as HTMLElement);if(index<0||(e.shiftKey?index===0:index===controls.length-1)){e.preventDefault();(e.shiftKey?controls.at(-1):controls[0])?.focus();}return;}
  const axes:Record<string,readonly['horizontal'|'vertical',number]>={ArrowRight:['horizontal',1],ArrowLeft:['horizontal',-1],ArrowDown:['vertical',1],ArrowUp:['vertical',-1]};if(axes[e.key]){e.preventDefault();const [axis,direction]=axes[e.key],v=viewport.current;if(axis==='vertical'&&v&&(direction>0?v.scrollTop+v.clientHeight<v.scrollHeight-1:v.scrollTop>1)){v.scrollBy({top:direction*80,behavior:'instant'});return;}move(axis,direction);}
 }}>
 <div className="technology-viewer__canvas">
 <header className="technology-viewer__toolbar technology-viewer__toolbar--top">
 <button type="button" className="technology-viewer__arrow" aria-label={photos[0]} disabled={loading||position.photo===0} onClick={()=>move('horizontal',-1)}><Chevron direction="left"/></button>
 <span className="technology-viewer__toolbar-label">{photos[1]}<span className="technology-viewer__photo-dots" aria-hidden="true">{group.slides.map((_,i)=><i key={i} className={i===position.photo?'is-active':''}/>)}</span></span>
 <button type="button" className="technology-viewer__arrow" aria-label={photos[1]} disabled={loading||position.photo===group.slides.length-1} onClick={()=>move('horizontal',1)}><Chevron direction="right"/></button>
 <button type="button" className="technology-viewer__close" onClick={()=>dialog.current?.close()} aria-label={labels.close}>×</button>
 </header>
 <h2 id="technology-viewer-title" className="technology-viewer__sr-only">{group.title} {labels.technology}</h2>
 <div className="technology-viewer__stage">
 <div ref={viewport} className="technology-viewer__scroll" tabIndex={0} role="region" aria-label={`${photos[0]} / ${photos[1]}; ${technologyGroupCopy[locale].previous} / ${labels.nextGroup}`}
 onScroll={e=>{if(pending.current&&e.currentTarget.scrollTop!==locked.current)e.currentTarget.scrollTop=locked.current;}}
 onPointerDown={pointerDown} onPointerUp={e=>{const c=pointer.current;pointer.current=null;if(c?.id===e.pointerId)finish(c,e.clientX,e.clientY);}} onPointerCancel={()=>{pointer.current=null;}}>
 {open&&image&&<article className="technology-viewer__content" data-photo={slide.src}>
 <RetainedPhoto image={image} name={`${group.title} — ${position.group===1?labels.names[position.photo]:nobleName(locale,position.photo)}`}/>
 {position.group===1?<TechnologyDescriptions slide={slide.id as TechnologySlideId} locale={locale} name={labels.names[position.photo]} copy={descriptions} cropTop={102}/>:<NobleCraftDescriptions slide={position.photo} locale={locale}/>}
 </article>}
 </div>
 {open&&loading&&<div className="technology-viewer__loading"><LoadingStatus locale={locale} progress={progress} error={failed} onRetry={()=>select(requested.current)}/></div>}
 </div>
 <footer className="technology-viewer__toolbar technology-viewer__toolbar--bottom">
 <button type="button" className="technology-viewer__arrow" aria-label={technologyGroupCopy[locale].previous} disabled={loading||position.group===0} onClick={()=>move('vertical',-1)}><Chevron direction="up"/></button>
 <span className="technology-viewer__toolbar-label">{labels.nextGroup}</span>
 <button type="button" className="technology-viewer__arrow" aria-label={labels.nextGroup} disabled={loading||position.group===technologyGroups.length-1} onClick={()=>move('vertical',1)}><Chevron direction="down"/></button>
 </footer>
 </div></dialog>;
}
function nobleName(locale:Locale,index:number){return nobleCraftCopy[locale][index===0?1:4].replaceAll('\n',' ');}
