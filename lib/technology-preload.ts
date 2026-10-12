import {technologyGroups} from './technology-gallery';
import {loadImage,PAGE_ARTWORK_WARMING_EVENT,PAGE_ARTWORK_WARMING_ATTRIBUTE} from './media-resource';

export function startTechnologyPreload(load:(src:string,priority:'auto'|'low')=>Pick<ReturnType<typeof loadImage>,'ready'>=loadImage){
 let alive=true,started=false,frame=0;
 const warm=()=>{
  if(started)return;started=true;
  // Let the decoded hero paint and the high-priority main requests start.
  frame=requestAnimationFrame(()=>{void(async()=>{
   for(const [index,g] of technologyGroups.entries())for(const s of g.slides){
    if(!alive)return;
    try{await load(s.src,index===0?'auto':'low').ready}catch{/* Optional artwork cannot block the next photo. */}
   }
  })()});
 };
 window.addEventListener(PAGE_ARTWORK_WARMING_EVENT,warm);
 if(document.documentElement.hasAttribute(PAGE_ARTWORK_WARMING_ATTRIBUTE))warm();
 return()=>{alive=false;cancelAnimationFrame(frame);window.removeEventListener(PAGE_ARTWORK_WARMING_EVENT,warm)};
}
