'use client';
/* eslint-disable @next/next/no-img-element -- Exact original bytes and decoded blobs bypass optimization. */
import {useEffect,useRef,useState,type ImgHTMLAttributes} from 'react';
import {decodeImageElement,loadImage,type ImageResource,type ImageProgress} from '@/lib/media-resource';
type Props=Omit<ImgHTMLAttributes<HTMLImageElement>,'src'|'onProgress'>&{src:string;preview:string;hero?:boolean};
export function ProgressiveImage({src,preview,hero=false,style,alt,...props}:Props){
 const ref=useRef<HTMLImageElement>(null);
 const [ready,setReady]=useState(false),[previewReady,setPreviewReady]=useState(false),[previewBroken,setPreviewBroken]=useState(false),[failed,setFailed]=useState(false);
 const [display,setDisplay]=useState(hero?src:preview);
 useEffect(()=>{
  const image=ref.current!,dialog=image.closest('dialog'),scroller=image.closest<HTMLElement>('.wellness-scroll,.charcoal-viewer__scroll');
  let alive=true,resource:ImageResource|undefined,unsubscribe:(()=>void)|undefined,lease:ReturnType<ImageResource['demand']>|undefined,failedRequest=false;
  const tiny=new Image();tiny.src=preview;void tiny.decode().then(()=>{if(alive)setPreviewReady(true);}).catch(()=>{if(alive)setPreviewBroken(true);});
  const report=(value:ImageProgress)=>{image.dataset.mediaProgress=value.total?String(Math.min(98,value.loaded/value.total*98)):'';failedRequest=value.error;if(alive)setFailed(value.error);document.dispatchEvent(new Event('media-state'));};
  const start=(priority:'high'|'auto'|'low')=>{
   if(hero||failedRequest)return;
   if(resource){lease?.set(priority);return;}
   resource=loadImage(src,priority);lease=resource.demand(priority);unsubscribe=resource.subscribe(report);
   void resource.ready.then(photo=>{if(alive)setDisplay(photo.src);}).catch(()=>{if(alive)setFailed(true);});
  };
  const update=()=>{
   const box=image.getBoundingClientRect(),view=scroller?.getBoundingClientRect(),top=view?.top??0,bottom=view?.bottom??innerHeight,height=bottom-top;
   const hidden=dialog?!dialog.open:!!document.querySelector('dialog[open]');
   if(hidden){lease?.set('low');return;}
   const visible=box.bottom>top&&box.top<bottom;
   const near=box.bottom>top-height&&box.top<bottom+height;
   if(visible||near||!dialog||dialog.open)start(visible?'high':near?'auto':'low');else lease?.set('low');
  };
  const near=new IntersectionObserver(update,{root:scroller,rootMargin:'100% 0px'}),visible=new IntersectionObserver(update,{root:scroller});
  near.observe(image);visible.observe(image);
  const dialogs=new MutationObserver(update);document.querySelectorAll('dialog').forEach(node=>dialogs.observe(node,{attributes:true,attributeFilter:['open']}));
  if(hero&&image.complete){if(image.naturalWidth)void decodeImageElement(image).then(()=>{if(alive)setReady(true);}).catch(()=>{if(alive)setFailed(true);});else setTimeout(()=>{if(alive)setFailed(true);},0);}
  update();
  const retry=()=>{if(!image.hasAttribute('data-media-error'))return;const box=image.getBoundingClientRect(),view=scroller?.getBoundingClientRect();if((dialog?!dialog.open:!!document.querySelector('dialog[open]'))||box.bottom<=(view?.top??0)||box.top>(view?.bottom??innerHeight)+1)return;unsubscribe?.();lease?.release();resource=undefined;failedRequest=false;setFailed(false);if(hero)image.src=`${src}?media-retry=${Date.now()}`;else update();};
  document.addEventListener('story-media-retry',retry);
  return()=>{alive=false;near.disconnect();visible.disconnect();dialogs.disconnect();unsubscribe?.();lease?.release();document.removeEventListener('story-media-retry',retry);};
 },[src,preview,hero]);
 useEffect(()=>{document.dispatchEvent(new Event('media-state'));},[ready,previewReady,failed]);
 return <><img {...props} alt={alt??''} loading="eager" ref={ref} src={display} data-media data-native-hero={hero?'':undefined} data-original={src} data-preview={previewReady?'ready':'pending'} data-media-ready={ready?'':undefined} data-media-error={failed?'':undefined}
  className={`${props.className??''} media-managed${!ready&&!hero?' media-preview':''}`} style={{aspectRatio:`${props.width}/${props.height}`,...style,...(!hero&&previewBroken&&!ready?{visibility:'hidden'}:{}),...(hero&&!ready?{backgroundImage:`url("${preview}")`,backgroundSize:'100% 100%'}:{})}}
  onLoad={event=>{const image=event.currentTarget;if(!hero&&image.getAttribute('src')===preview)return;void decodeImageElement(image).then(()=>{setReady(true);image.dataset.mediaProgress='100';}).catch(()=>setFailed(true));}}
  onError={()=>{if(display!==preview||hero)setFailed(true);else{setPreviewReady(false);setPreviewBroken(true);}}}/>
  {!hero&&<noscript><style>{`.media-managed:not([data-native-hero]){display:none!important}noscript{display:contents}`}</style><img {...props} alt={alt??''} src={src} style={style} data-media-ready=""/></noscript>}</>;
}
