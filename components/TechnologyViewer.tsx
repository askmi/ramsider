'use client';
import {PowerArmorDescriptions} from './PowerArmorDescriptions';
import {powerArmorCopy} from '@/lib/power-armor-descriptions';
import {MoodAquaDescriptions} from './MoodAquaDescriptions';
import {moodAquaCopy} from '@/lib/mood-aqua-descriptions';
import {TouchLinkDescriptions} from './TouchLinkDescriptions';
import {touchLinkCopy} from '@/lib/touchlink-descriptions';
import {CyberMindDescriptions} from './CyberMindDescriptions';
import {cyberMindCopy} from '@/lib/cybermind-descriptions';
import {AirShieldDescriptions} from './AirShieldDescriptions';
import {airShieldCopy} from '@/lib/airshield-descriptions';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type PointerEvent} from 'react';
import type {Locale} from '@/lib/i18n';
import type {TechnologyDescriptionCopy,TechnologySlideId} from '@/lib/technology-descriptions';
import {technologyGroups,technologyGroupCopy} from '@/lib/technology-gallery';
import {loadImage,retryStoryMedia} from '@/lib/media-resource';
import {MediaFeedback,useScrollLock} from './MediaLoading';
import {useMediaScroll} from '@/lib/media-scroll';
import {TechnologyDescriptions} from './TechnologyDescriptions';
import {NobleCraftDescriptions} from './NobleCraftDescriptions';
import {nobleCraftCopy} from '@/lib/noblecraft-descriptions';
import {CapsuleCodeDescriptions} from './CapsuleCodeDescriptions';
import {capsuleCodeCopy} from '@/lib/capsulecode-descriptions';
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
  return <div className={`technology-viewer__photo${image.hasAttribute("data-media-ready")?"":" media-preview"}`} ref={host} />;
}

const photoLabels:Record<Locale,readonly[string,string]>={en:['Previous photo','Next Slide'],ru:['Предыдущее фото','Следующее фото'],de:['Vorheriges Foto','Nächstes Foto'],fr:['Photo précédente','Photo suivante'],es:['Foto anterior','Siguiente foto'],it:['Foto precedente','Foto successiva'],tr:['Önceki fotoğraf','Sonraki fotoğraf'],ar:['الصورة السابقة','الصورة التالية'],zh:['上一张照片','下一张照片'],ja:['前の写真','次の写真'],ko:['이전 사진','다음 사진']};

type Position={group:number;photo:number};
type Contact={x:number;y:number;id:number;up:boolean;down:boolean;axis:'horizontal'|'vertical'|null;lastY:number;at:number;velocity:number;navigation:number|null};
export function TechnologyViewer({locale,descriptions}:{locale:Locale;descriptions:TechnologyDescriptionCopy}){
 const dialog=useRef<HTMLDialogElement>(null),viewport=useRef<HTMLDivElement>(null),opener=useRef<HTMLElement|null>(null);
 const keyboardFocus=useRef(false),inertia=useRef<number|null>(null);
 const stopInertia=useCallback(()=>{if(inertia.current!==null)cancelAnimationFrame(inertia.current);inertia.current=null;},[]);
 useEffect(()=>stopInertia,[stopInertia]);
 const neighborLeases=useRef<ReturnType<ReturnType<typeof loadImage>['demand']>[]>([]);
 const priorityLease=useRef<ReturnType<ReturnType<typeof loadImage>['demand']>|null>(null);
 const lastNavigation=useRef(-Infinity);
 const displayed=useRef<Position>({group:0,photo:0}),requested=useRef<Position>({group:0,photo:0}),pending=useRef(false),token=useRef(0),subscription=useRef<(()=>void)|null>(null),locked=useRef(0);
 const contact=useRef<Contact|null>(null),pointer=useRef<Contact|null>(null);
 const wheel=useRef({at:0,x:0,y:0,axis:null as 'horizontal'|'vertical'|null,committed:false,pan:false});
 const [waiting,setWaiting]=useState(false);
 const [open,setOpen]=useState(false),[position,setPosition]=useState<Position>({group:0,photo:0}),[image,setImage]=useState<HTMLImageElement|null>(null),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false),[progress,setProgress]=useState<number|null>(null);
 const labels=copy[locale],photos=photoLabels[locale],group=technologyGroups[position.group],slide=group.slides[position.photo];
 useScrollLock(open);
 const media=useMediaScroll(viewport,false,open,slide.src);
 const select=useCallback((next:Position)=>{
  priorityLease.current?.release();neighborLeases.current.forEach(lease=>lease.release());neighborLeases.current=[];stopInertia();requested.current=next;pending.current=true;contact.current=null;pointer.current=null;locked.current=viewport.current?.scrollTop??0;
  setWaiting(true);setLoading(true);setFailed(false);setProgress(null);subscription.current?.();const revision=++token.current;
  const src=technologyGroups[next.group].slides[next.photo].src;
  const bank=JSON.parse(document.querySelector('[data-section-previews]')?.textContent??'{}') as Record<string,{src:string;width:number;height:number}>;
  const entry=bank[src];
  if(entry){const tiny=new Image();tiny.src=entry.src;void tiny.decode().then(()=>{
   if(revision!==token.current||!dialog.current?.open||resource.progress.ready)return;
   tiny.dataset.media='';tiny.dataset.original=src;tiny.dataset.preview='ready';
   displayed.current=next;setPosition(next);setImage(tiny);pending.current=false;setWaiting(false);
  }).catch(()=>{});}
  const resource=loadImage(src,'high');priorityLease.current=resource.demand('high');
  const neighbors=technologyGroups[next.group].slides;for(const neighbor of [neighbors[next.photo+1],neighbors[next.photo-1]])if(neighbor){const adjacent=loadImage(neighbor.src,'auto');neighborLeases.current.push(adjacent.demand('auto'));void adjacent.ready.catch(()=>{});}
  subscription.current=resource.subscribe(value=>{if(revision===token.current){setProgress(value.total?Math.min(98,value.loaded/value.total*98):null);setFailed(value.error);}});
  resource.ready.then(photo=>{
   if(revision!==token.current||!dialog.current?.open)return;
   photo.dataset.media='';photo.dataset.original=src;photo.dataset.preview='ready';photo.dataset.mediaReady='';
   if(document.activeElement===viewport.current)dialog.current.focus({preventScroll:true});
   displayed.current=next;setPosition(next);setImage(photo);pending.current=false;setWaiting(false);setLoading(false);subscription.current?.();subscription.current=null;
   const slides=technologyGroups[next.group].slides;for(const neighbor of [slides[next.photo+1],slides[next.photo-1]])if(neighbor)void loadImage(neighbor.src,'low').ready.catch(()=>{});
  }).catch(()=>{if(revision===token.current&&dialog.current?.open){setFailed(true);subscription.current?.();subscription.current=null;}});
 },[stopInertia]);
 const move=useCallback((axis:'horizontal'|'vertical',delta:number)=>{
  if(pending.current)return;if(loading&&performance.now()-lastNavigation.current<450)return;const current=displayed.current;
  const next=axis==='horizontal'?{...current,photo:current.photo+delta}:{group:current.group+delta,photo:0};
  if(next.group<0||next.group>=technologyGroups.length||next.photo<0||next.photo>=technologyGroups[next.group].slides.length)return;
  lastNavigation.current=performance.now();select(next);
 },[select,loading]);
 useLayoutEffect(()=>{viewport.current?.scrollTo({top:0,left:0,behavior:'instant'});},[slide.src]);
 useLayoutEffect(()=>{if(loading&&dialog.current?.open)dialog.current.focus({preventScroll:true});},[loading]);
 useEffect(()=>{
  const activate=(event:MouseEvent)=>{
   const trigger=event.target instanceof Element?event.target.closest<HTMLElement>('[data-technology-open]'):null;
   if(!trigger||dialog.current?.open)return;event.preventDefault();lastNavigation.current=-Infinity;opener.current=trigger;wheel.current={at:0,x:0,y:0,axis:null,committed:false,pan:false};displayed.current={group:0,photo:0};setPosition(displayed.current);setImage(null);setOpen(true);dialog.current?.showModal();select(displayed.current);
  };
  const key=()=>{keyboardFocus.current=true;opener.current?.removeAttribute('data-pointer-return');};
  const pointer=()=>{keyboardFocus.current=false;};
  document.addEventListener('keydown',key,true);document.addEventListener('pointerdown',pointer,true);document.addEventListener('click',activate);return()=>{document.removeEventListener('keydown',key,true);document.removeEventListener('pointerdown',pointer,true);document.removeEventListener('click',activate);subscription.current?.();};
 },[select]);
 const start=useCallback((x:number,y:number,id:number):Contact=>{
  const v=viewport.current;return{x,y,id,axis:null,lastY:y,at:performance.now(),velocity:0,navigation:null,up:!v||v.scrollTop<=1,down:!v||v.scrollTop>=v.scrollHeight-v.clientHeight-1};
 },[]);
 const finish=useCallback((c:Contact,x:number,y:number)=>{
  const dx=x-c.x,dy=y-c.y;if(c.axis!=='vertical'&&Math.abs(dx)>=24&&Math.abs(dx)>=Math.abs(dy)*1.2)move('horizontal',dx<0?1:-1);
  else if(c.axis!=='horizontal'&&Math.abs(dy)>=24&&Math.abs(dy)>=Math.abs(dx)*1.2){
   const direction=c.navigation??(dy<0&&c.down?1:dy>0&&c.up?-1:0);
   if(direction===(dy<0?1:-1))move('vertical',direction);
  }
 },[move]);
 const coast=useCallback((velocity:number)=>{
  stopInertia();if(Math.abs(velocity)<.05||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let at=performance.now();
  const frame=(now:number)=>{
   const v=viewport.current;if(!v||pending.current||!dialog.current?.open){inertia.current=null;return;}
   const dt=Math.min(now-at,32);at=now;const previous=v.scrollTop,max=Math.max(0,v.scrollHeight-v.clientHeight);
   v.scrollTop=Math.max(0,Math.min(max,previous+velocity*dt));velocity*=Math.exp(-dt/180);
   if(Math.abs(velocity)<.02||v.scrollTop<=0||v.scrollTop>=max||v.scrollTop===previous){inertia.current=null;return;}
   inertia.current=requestAnimationFrame(frame);
  };
  inertia.current=requestAnimationFrame(frame);
 },[stopInertia]);
 useEffect(()=>{
  if(!open||!viewport.current)return;const v=viewport.current;
  const onWheel=(event:WheelEvent)=>{
   if(event.defaultPrevented)return;stopInertia();if(event.ctrlKey||(!event.deltaX&&!event.deltaY))return;
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
  const onStart=(e:globalThis.TouchEvent)=>{stopInertia();contact.current=e.touches.length===1&&!pending.current?start(e.touches[0].clientX,e.touches[0].clientY,e.touches[0].identifier):null;};
  const onMove=(e:globalThis.TouchEvent)=>{
   if(e.defaultPrevented)return;const c=contact.current;if(!c)return;if(e.touches.length!==1){contact.current=null;return;}const t=e.touches[0];if(t.identifier!==c.id){contact.current=null;return;}
   const dx=t.clientX-c.x,dy=t.clientY-c.y;
   if(!c.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=8){if(Math.abs(dx)>=Math.abs(dy)*1.2)c.axis='horizontal';else if(Math.abs(dy)>=8){c.axis='vertical';c.navigation=dy<0&&c.down?1:dy>0&&c.up?-1:0;}}
   if(c.axis)e.preventDefault();
   if(c.axis==='vertical'&&c.navigation===0){
    const now=performance.now(),dt=now-c.at;
    if(dt>0)c.velocity=Math.max(-2.5,Math.min(2.5,(c.lastY-t.clientY)/dt));
    v.scrollTop=Math.max(0,Math.min(v.scrollHeight-v.clientHeight,v.scrollTop+c.lastY-t.clientY));
    c.lastY=t.clientY;c.at=now;
   }
  };
  const onEnd=(e:globalThis.TouchEvent)=>{const c=contact.current;contact.current=null;if(!c||e.touches.length)return;const t=Array.from(e.changedTouches).find(t=>t.identifier===c.id);if(t){
   const pan=c.axis==='vertical'&&c.navigation===0;
   finish(c,t.clientX,t.clientY);
   if(pan&&performance.now()-c.at<80)coast(c.velocity);
  }};
  const cancel=()=>{contact.current=null;};
  v.addEventListener('wheel',onWheel,{passive:false});v.addEventListener('touchstart',onStart,{passive:true});v.addEventListener('touchmove',onMove,{passive:false});v.addEventListener('touchend',onEnd);v.addEventListener('touchcancel',cancel);
  return()=>{v.removeEventListener('wheel',onWheel);v.removeEventListener('touchstart',onStart);v.removeEventListener('touchmove',onMove);v.removeEventListener('touchend',onEnd);v.removeEventListener('touchcancel',cancel);};
 },[open,slide.src,move,start,finish,coast,stopInertia]);
 const pointerDown=(e:PointerEvent<HTMLDivElement>)=>{if(e.pointerType==='touch'||!e.isPrimary||e.button!==0||pending.current)return;stopInertia();pointer.current=start(e.clientX,e.clientY,e.pointerId);try{e.currentTarget.setPointerCapture(e.pointerId);}catch{}};
 return <dialog ref={dialog} id="technology-viewer" className="technology-viewer" data-waiting={waiting?"":undefined} data-group={group.title} data-photo-index={position.photo} aria-busy={loading} aria-labelledby="technology-viewer-title" tabIndex={-1}
 onClose={()=>{stopInertia();priorityLease.current?.release();priorityLease.current=null;neighborLeases.current.forEach(lease=>lease.release());neighborLeases.current=[];token.current++;pending.current=false;contact.current=null;pointer.current=null;subscription.current?.();subscription.current=null;setOpen(false);setLoading(false);opener.current?.toggleAttribute("data-pointer-return",!keyboardFocus.current);opener.current?.focus({preventScroll:true});}}
 onKeyDown={e=>{
  if(e.defaultPrevented)return;stopInertia();
  if(e.key==='Tab'){const controls=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]'));const index=controls.indexOf(document.activeElement as HTMLElement);if(index<0||(e.shiftKey?index===0:index===controls.length-1)){e.preventDefault();(e.shiftKey?controls.at(-1):controls[0])?.focus();}return;}
  const axes:Record<string,readonly['horizontal'|'vertical',number]>={ArrowRight:['horizontal',1],ArrowLeft:['horizontal',-1],ArrowDown:['vertical',1],ArrowUp:['vertical',-1]};if(axes[e.key]){e.preventDefault();const [axis,direction]=axes[e.key],v=viewport.current;if(axis==='vertical'&&v&&(direction>0?v.scrollTop+v.clientHeight<v.scrollHeight-1:v.scrollTop>1)){v.scrollBy({top:direction*80,behavior:'instant'});return;}move(axis,direction);}
 }}>
 <div className="technology-viewer__canvas">
 <header className="technology-viewer__toolbar technology-viewer__toolbar--top">
 <button type="button" className="technology-viewer__arrow" aria-label={photos[0]} disabled={waiting||position.photo===0} onClick={()=>move('horizontal',-1)}><Chevron direction="left"/></button>
 <span className="technology-viewer__toolbar-label">{photos[1]}<span className="technology-viewer__photo-dots" aria-hidden="true">{group.slides.map((_,i)=><i key={i} className={i===position.photo?'is-active':''}/>)}</span></span>
 <button type="button" className="technology-viewer__arrow" aria-label={photos[1]} disabled={waiting||position.photo===group.slides.length-1} onClick={()=>move('horizontal',1)}><Chevron direction="right"/></button>
 <button type="button" className="technology-viewer__close" onClick={()=>dialog.current?.close()} aria-label={labels.close}>×</button>
 </header>
 <h2 id="technology-viewer-title" className="technology-viewer__sr-only">{group.title} {labels.technology}</h2>
 <div className="technology-viewer__stage">
 <div key={slide.src} ref={viewport} className="technology-viewer__scroll" tabIndex={0} role="region" aria-label={`${photos[0]} / ${photos[1]}; ${technologyGroupCopy[locale].previous} / ${labels.nextGroup}`}
 onScroll={e=>{if(pending.current&&e.currentTarget.scrollTop!==locked.current)e.currentTarget.scrollTop=locked.current;}}
 onPointerDown={pointerDown} onPointerUp={e=>{const c=pointer.current;pointer.current=null;if(c?.id===e.pointerId)finish(c,e.clientX,e.clientY);}} onPointerCancel={()=>{pointer.current=null;}}>
 {open&&image&&<article className="technology-viewer__content" data-photo={slide.src} style={{aspectRatio:`${slide.src.includes("aqua-01")||slide.src.includes("capsule-01")?940:941}/1522`}}>
 <RetainedPhoto image={image} name={`${group.title} — ${group.title==='QuickCell'||group.title==='PolyArmor'?powerArmorCopy[locale].headlines[group.title==='PolyArmor'?2:position.photo].replaceAll('\n',' '):group.title==='MoodEngine'||group.title==='AquaSense'?moodAquaCopy[locale][group.title==='MoodEngine'?'mood':'aqua'].headlines[position.photo].replaceAll('\n',' '):group.title==='TouchLink'?(position.photo===0?touchLinkCopy[locale].headline:position.photo===1?touchLinkCopy[locale].appHeading:touchLinkCopy[locale].directHeading).replaceAll('\n',' '):group.title==='AirShield'?airShieldCopy[locale][position.photo].headline.replaceAll('\n',' '):group.title==='HeatCore'?labels.names[position.photo]:group.title==='CapsuleCode'?capsuleCodeCopy[locale][position.photo].headline.replaceAll('\n',' '):group.title==='CyberMind'?(position.photo===0?cyberMindCopy[locale].headline1:cyberMindCopy[locale].headline2).replaceAll('\n',' '):nobleName(locale,position.photo)}`}/>
 {group.title==='QuickCell'||group.title==='PolyArmor'?<PowerArmorDescriptions kind={group.title==='QuickCell'?'quick':'poly'} slide={position.photo} locale={locale} descriptor={labels.technology}/>:group.title==='MoodEngine'||group.title==='AquaSense'?<MoodAquaDescriptions kind={group.title==='MoodEngine'?'mood':'aqua'} slide={position.photo} locale={locale} descriptor={labels.technology}/>:group.title==='TouchLink'?<TouchLinkDescriptions slide={position.photo} locale={locale} descriptor={labels.technology}/>:group.title==='AirShield'?<AirShieldDescriptions slide={position.photo} locale={locale} descriptor={labels.technology}/>:group.title==='CapsuleCode'?<CapsuleCodeDescriptions slide={position.photo} locale={locale} descriptor={labels.technology}/>:group.title==='HeatCore'?<TechnologyDescriptions slide={slide.id as TechnologySlideId} locale={locale} name={labels.names[position.photo]} copy={descriptions} cropTop={102}/>:group.title==='CyberMind'?<CyberMindDescriptions slide={slide.id as '01'|'02'} locale={locale} name={group.title} copy={cyberMindCopy[locale]} descriptor={labels.technology}/>:<NobleCraftDescriptions slide={position.photo} locale={locale}/>}
 </article>}
 </div>
 <MediaFeedback className="technology-viewer__loading" active={open&&((loading&&waiting)||failed||media.blocked)} locale={locale} progress={progress} error={failed} onRetry={()=>{retryStoryMedia();select(requested.current);}}/>
 </div>
 <footer className="technology-viewer__toolbar technology-viewer__toolbar--bottom">
 <button type="button" className="technology-viewer__arrow" aria-label={technologyGroupCopy[locale].previous} disabled={waiting||position.group===0} onClick={()=>move('vertical',-1)}><Chevron direction="up"/></button>
 <span className="technology-viewer__toolbar-label">{labels.nextGroup}</span>
 <button type="button" className="technology-viewer__arrow" aria-label={labels.nextGroup} disabled={waiting||position.group===technologyGroups.length-1} onClick={()=>move('vertical',1)}><Chevron direction="down"/></button>
 </footer>
 </div></dialog>;
}
function nobleName(locale:Locale,index:number){return nobleCraftCopy[locale][index===0?1:4].replaceAll('\n',' ');}
