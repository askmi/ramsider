import {test,expect} from '@playwright/test';
import {startTechnologyPreload} from '../../lib/technology-preload';
import {technologyGroups} from '../../lib/technology-gallery';
import {PAGE_ARTWORK_WARMING_EVENT} from '../../lib/media-resource';
import {mkdir,writeFile} from 'node:fs/promises';

test('controlled exact queue setup cancels and remounts without duplicate transfers',async({},info)=>{
 test.skip(info.project.name!=='desktop-chromium','one Node lifecycle run; mobile integration is separate');
 const names=['window','document','requestAnimationFrame','cancelAnimationFrame'];
 const descriptors=names.map(name=>Object.getOwnPropertyDescriptor(globalThis,name));
 const events=new EventTarget();let marker=false,id=0;const frames=new Map<number,FrameRequestCallback>();
 const values=[events,{documentElement:{hasAttribute:()=>marker}},(callback:FrameRequestCallback)=>{frames.set(++id,callback);return id},(frame:number)=>frames.delete(frame)];
 names.forEach((name,i)=>Object.defineProperty(globalThis,name,{configurable:true,value:values[i]}));
 const flush=()=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(callback=>callback(0))};
 const photos=technologyGroups.flatMap(group=>group.slides.map(slide=>slide.src));
 let release!:()=>void;const held=new Promise<HTMLImageElement>(resolve=>release=()=>resolve({} as HTMLImageElement));
 const requests:string[]=[],calls:string[]=[],cache=new Map<string,{ready:Promise<HTMLImageElement>}>();
 const load=(src:string)=>{calls.push(src);let resource=cache.get(src);if(!resource){requests.push(src);resource={ready:src===photos[1]?held:Promise.resolve({} as HTMLImageElement)};cache.set(src,resource)}return resource};
 let cleanup=()=>{};
 try{
  cleanup=startTechnologyPreload(load);events.dispatchEvent(new Event(PAGE_ARTWORK_WARMING_EVENT));cleanup();flush();expect(requests).toEqual([]);
  marker=true;cleanup=startTechnologyPreload(load);events.dispatchEvent(new Event(PAGE_ARTWORK_WARMING_EVENT));events.dispatchEvent(new Event(PAGE_ARTWORK_WARMING_EVENT));flush();await expect.poll(()=>requests.length).toBe(2);expect(calls).toEqual(photos.slice(0,2));
  cleanup();release();await new Promise(resolve=>setTimeout(resolve,20));expect(requests).toEqual(photos.slice(0,2));
  // The marker alone starts the new mount; retained resources are reused.
  cleanup=startTechnologyPreload(load);flush();await expect.poll(()=>requests.length).toBe(photos.length);expect(requests).toEqual(photos);expect(calls).toEqual([...photos.slice(0,2),...photos]);cleanup();
  // Remount while a resource is still in flight also uses the same cache entry.
  cache.clear();requests.length=0;calls.length=0;let releaseInflight!:()=>void;const inflight=new Promise<HTMLImageElement>(resolve=>releaseInflight=()=>resolve({} as HTMLImageElement));
  const loadInflight=(src:string)=>{let resource=cache.get(src);if(!resource){requests.push(src);resource={ready:src===photos[0]?inflight:Promise.resolve({} as HTMLImageElement)};cache.set(src,resource)}return resource};
  cleanup=startTechnologyPreload(loadInflight);flush();expect(requests).toEqual([photos[0]]);cleanup();cleanup=startTechnologyPreload(loadInflight);flush();expect(requests).toEqual([photos[0]]);releaseInflight();await expect.poll(()=>requests.length).toBe(photos.length);expect(requests).toEqual(photos);
  await mkdir('screenshots/technology-preload',{recursive:true});await writeFile('screenshots/technology-preload/controlled-lifecycle.json',JSON.stringify({kind:'controlled exact setup/cleanup with injected retained-resource promises; not browser navigation',cancelBeforeFrame:true,cancelHeld:true,durableMarkerRemount:true,inflightReuse:true,requests},null,2));
 }finally{cleanup();names.forEach((name,i)=>{const descriptor=descriptors[i];if(descriptor)Object.defineProperty(globalThis,name,descriptor);else Reflect.deleteProperty(globalThis,name)})}
});
