'use client';
import {useEffect,useState,type RefObject} from 'react';
import {retryStoryMedia} from './media-resource';
type State={blocked:boolean;error:boolean;progress:number|null};
/** Only pending artwork adds resistance; completed pages keep native input/momentum. */
export function useMediaScroll(ref:RefObject<HTMLElement|null>,page=false,enabled=true,revision=''){
 const [state,setState]=useState<State>({blocked:false,error:false,progress:null});
 useEffect(()=>{
  const root=ref.current;if(!root||!enabled)return;
  const target:HTMLElement|Window=page?window:root;
  const height=()=>page?innerHeight:root.clientHeight;
  const top=()=>page?scrollY:root.scrollTop;
  const setTop=(value:number)=>{if(page)window.scrollTo({top:value,behavior:'instant'});else root.scrollTop=value;internalTarget=top();last=top();};
  let internalTarget:number|null=null,last=top(),frame=0,velocity=0,wanted=0,at=0,position=top();
  let touch:{x:number;y:number;lastY:number;owned:boolean;axis:'vertical'|'horizontal'|null}|null=null;
  const stop=()=>{cancelAnimationFrame(frame);frame=0;velocity=0;wanted=0;at=0;position=top();internalTarget=null;last=top();};
  const pending=()=>[...root.querySelectorAll<HTMLImageElement>('img[data-media]:not([data-media-ready])')].map(image=>{
   const box=image.getBoundingClientRect(),base=page?0:root.getBoundingClientRect().top;
   return {image,from:box.top-base,to:box.bottom-base};
  }).filter(item=>item.to>item.from&&item.image.getClientRects().length).sort((a,b)=>a.from-b.from);
  const factors=()=>{
   if(page&&document.querySelector('dialog[open]'))return {factor:1,cap:Infinity};
   const items=pending(),item=items.find(v=>v.to>0),missing=items.find(v=>v.image.dataset.preview!=='ready');
   const distance=item?Math.max(0,item.from-height()):Infinity;
   const t=Math.min(1,distance/(height()*.75));const factor=item && item.from<=height()*1.75 ? .18+.82*t*t*(3-2*t) : 1;
   return {factor,cap:missing?Math.max(0,top()+missing.from-height()):Infinity};
  };
  const refresh=()=>{
   const candidates=pending().filter(v=>v.from<=height()+1&&v.to>0);
   const visible=candidates.find(v=>v.image.dataset.preview!=='ready')??candidates.find(v=>v.image.hasAttribute('data-media-error'))??candidates[0],blocked=!!visible&&visible.image.dataset.preview!=='ready';
   const value=visible?.image.dataset.mediaProgress;
   const next={blocked,error:!!visible?.image.hasAttribute('data-media-error'),progress:value?Number(value):null};
   setState(old=>old.blocked===next.blocked&&old.error===next.error&&old.progress===next.progress?old:next);
  };
  const animate=(now:number)=>{
   // A native gesture/anchor may advance between frames. Never replay an old position.
   if(Math.abs(top()-last)>1||(page&&document.querySelector('dialog[open]'))){stop();refresh();return;}
   const dt=Math.min(32,now-(at||now-16));at=now;const alpha=1-Math.exp(-dt/90);velocity+=(wanted-velocity)*alpha;const step=velocity*dt/16;
   position=Math.min(Math.max(top(),factors().cap),position+step);setTop(position);wanted*=Math.exp(-dt/75);
   if(Math.abs(wanted)+Math.abs(velocity)>.08)frame=requestAnimationFrame(animate);else{frame=0;velocity=0;wanted=0;at=0;}refresh();
  };
  const move=(delta:number)=>{
   const {factor,cap}=factors();
   if(delta<=0){stop();setTop(top()+delta);refresh();return;}
   if(top()+delta>cap){stop();setTop(Math.max(top(),cap));refresh();return;}
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){setTop(top()+delta*factor);refresh();return;}
   wanted+=delta*factor*.3;if(!frame){position=top();frame=requestAnimationFrame(animate);}
  };
  const eligible=(event:Event)=>!(event.target instanceof Element&&event.target.closest('.menu nav,.locale-options,textarea,select,[data-scroll-native]'))&&(!page||!(event.target instanceof Element&&event.target.closest('dialog[open]')));
  const navigationBoundary=(delta:number)=>root.classList.contains('technology-viewer__scroll')&&(delta>0?root.scrollTop>=root.scrollHeight-root.clientHeight-1:root.scrollTop<=1);
  const wheel=(event:WheelEvent)=>{
   const {factor,cap}=factors();
   if(!eligible(event)||event.defaultPrevented||!event.cancelable||event.ctrlKey||event.metaKey||Math.abs(event.deltaX)>Math.abs(event.deltaY)||navigationBoundary(event.deltaY)||(factor===1&&cap===Infinity)){stop();return;}
   event.preventDefault();move(event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?height():1));
  };
  const start=(event:TouchEvent)=>{
   stop();touch=null;if(!eligible(event)||event.defaultPrevented||event.touches.length!==1)return;
   // A control tap (including normal finger jitter) must keep its native click.
   if(event.target instanceof Element&&event.target.closest('button,a[href],input,select,textarea,summary,label,[contenteditable],[role="button"],[role="link"]'))return;
   const point=event.touches[0],{factor,cap}=factors();
   // Ownership cannot change after native scrolling has begun, even if a tile loads.
   touch={x:point.clientX,y:point.clientY,lastY:point.clientY,owned:factor<1||cap!==Infinity,axis:null};
  };
  const drag=(event:TouchEvent)=>{
   if(!eligible(event)||event.defaultPrevented||touch===null||event.touches.length!==1||!event.cancelable){touch=null;stop();return;}
   const point=event.touches[0],delta=touch.lastY-point.clientY;touch.lastY=point.clientY;
   if(!touch.owned)return;
   if(touch.axis===null){
    const dx=Math.abs(point.clientX-touch.x),dy=Math.abs(point.clientY-touch.y);
    // Reserve an owned gesture on its FIRST move, before native scrolling commits.
    // Axis slop controls motion, not whether cancellation can be deferred.
    if(Math.max(dx,dy)<8){event.preventDefault();return;}
    if(dx>dy*1.2)touch.axis='horizontal';
    else{if(navigationBoundary(delta)){touch=null;stop();return;}touch.axis='vertical';}
   }
   // Once a vertical move is cancelled, native input cannot take it back mid-swipe.
   if(touch.axis==='vertical'){event.preventDefault();move(delta);}
  };
  const end=()=>{touch=null;};
  const cancel=()=>{touch=null;stop();};
  const key=(event:KeyboardEvent)=>{
   if(!eligible(event)||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||(event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])')))return;
   if(event.key===' '&&event.target instanceof Element&&event.target.closest('button,summary'))return;
   if((event.key==='ArrowDown'&&navigationBoundary(1))||(event.key==='ArrowUp'&&navigationBoundary(-1)))return;
   if(factors().factor===1&&factors().cap===Infinity){stop();return;}
   const deltas:Record<string,number>={ArrowDown:60,ArrowUp:-60,PageDown:height()*.85,PageUp:-height()*.85,' ':height()*.85*(event.shiftKey?-1:1),End:height()*3,Home:-top()};
   if(event.key in deltas){event.preventDefault();move(deltas[event.key]);}
  };
  // Scroll events arrive AFTER the browser has moved (often on its compositor).
  // Applying resistance here used to paint forward, then visibly jump backward.
  const scroll=()=>{if(internalTarget!==null&&Math.abs(top()-internalTarget)<=1){internalTarget=null;last=top();refresh();return;}stop();refresh();};
  target.addEventListener('wheel',wheel as EventListener,{passive:false});target.addEventListener('touchstart',start as EventListener,{passive:true});target.addEventListener('touchmove',drag as EventListener,{passive:false});target.addEventListener('touchend',end);target.addEventListener('touchcancel',cancel);target.addEventListener('keydown',key as EventListener);target.addEventListener('scroll',scroll,{passive:true});
  document.addEventListener('media-state',refresh);window.addEventListener('resize',refresh);const mutation=new MutationObserver(refresh);mutation.observe(root,{subtree:true,attributes:true,attributeFilter:['data-media-ready','data-preview','data-media-error']});refresh();
  return()=>{stop();mutation.disconnect();target.removeEventListener('wheel',wheel as EventListener);target.removeEventListener('touchstart',start as EventListener);target.removeEventListener('touchmove',drag as EventListener);target.removeEventListener('touchend',end);target.removeEventListener('touchcancel',cancel);target.removeEventListener('keydown',key as EventListener);target.removeEventListener('scroll',scroll);document.removeEventListener('media-state',refresh);window.removeEventListener('resize',refresh);};
 },[ref,page,enabled,revision]);
 return {...state,retry:retryStoryMedia};
}
