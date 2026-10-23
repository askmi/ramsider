export type ImageProgress = { loaded: number; total: number | null; ready: boolean; error: boolean };
type Priority = 'low' | 'auto' | 'high';
export type ImageResource = { ready: Promise<HTMLImageElement>; progress: ImageProgress; subscribe: (listener: (progress: ImageProgress) => void) => () => void; promote: (priority: Priority) => void; demand: (priority:Priority) => {set:(priority:Priority)=>void;release:()=>void} };
const images = new Map<string, ImageResource>();
const failedSources = new Set<string>();
const decoded = new WeakMap<HTMLImageElement, Promise<void>>();
const rank = { low: 0, auto: 1, high: 2 };
type Job = { priority: Priority; sequence: number; run: () => Promise<void> };
const queue: Job[] = [];
const running = new Set<Job>();
let active = 0, background = 0, near = 0, sequence = 0;
function pump() {
  queue.sort((a,b) => rank[b.priority] - rank[a.priority] || a.sequence - b.sequence);
  while (active < 3) {
    const index = queue.findIndex(job => job.priority === 'high' || (job.priority === 'auto' ? near < 1 : background < 1 && ![...running].some(active => active.priority === 'high')));
    if (index < 0) break;
    const job = queue.splice(index,1)[0], low = job.priority === 'low', nearby = job.priority === 'auto';
    active++; running.add(job); if (low) background++; if(nearby) near++;
    void job.run().finally(() => { active--; running.delete(job); if(low) background--; if(nearby) near--; pump(); });
  }
}
export function decodeImageElement(image: HTMLImageElement): Promise<void> {
  const existing = decoded.get(image); if(existing) return existing;
  const ready = image.decode().then(() => { if(!image.naturalWidth) throw new Error('Image has no decoded pixels'); }).catch(error => { decoded.delete(image); throw error; });
  decoded.set(image,ready); return ready;
}
/** One original transfer/decoded object per URL. Promotion changes queued order, never restarts bytes. */
export function loadImage(src: string, priority: Priority = 'low'): ImageResource {
  const existing=images.get(src); if(existing) { existing.promote(priority); return existing; }
  const listeners=new Set<(value:ImageProgress)=>void>();
  const demands=new Map<symbol,Priority>();
  const refreshPriority=()=>{job.priority=[...demands.values()].sort((a,b)=>rank[b]-rank[a])[0]??'low';pump();};
  let resolve!: (image:HTMLImageElement)=>void, reject!: (reason:unknown)=>void;
  const promise=new Promise<HTMLImageElement>((yes,no)=>{resolve=yes;reject=no;});
  const update=(patch:Partial<ImageProgress>)=>{ Object.assign(resource.progress,patch); listeners.forEach(listener=>listener(resource.progress)); };
  const job: Job={priority,sequence:sequence++,run:async()=>{
    let url:string|undefined;
    try {
      const response=await fetch(src,{priority:job.priority,cache:failedSources.has(src)?'reload':'default'});
      if(!response.ok) throw new Error(`Image response ${response.status}`);
      const length=Number(response.headers.get('content-length'));
      update({total:!response.headers.get('content-encoding') && length>0 ? length : null});
      const chunks:Uint8Array<ArrayBuffer>[]=[];
      const reader=response.body?.getReader();
      if(reader) { for(;;) { const {value,done}=await reader.read(); if(done) break; chunks.push(new Uint8Array(value)); update({loaded:resource.progress.loaded+value.byteLength}); } }
      else { chunks.push(new Uint8Array(await response.arrayBuffer())); update({loaded:chunks[0].byteLength}); }
      if(resource.progress.total!==null && resource.progress.loaded!==resource.progress.total) throw new Error('Incomplete image transfer');
      url=URL.createObjectURL(new Blob(chunks,{type:response.headers.get('content-type')??'application/octet-stream'}));
      const image=new Image(); image.dataset.source=src; image.src=url; await decodeImageElement(image);
      failedSources.delete(src); update({ready:true}); resolve(image);
    } catch(error) { if(url) URL.revokeObjectURL(url); failedSources.add(src); update({error:true}); images.delete(src); reject(error); }
  }};
  const resource:ImageResource={ready:promise,progress:{loaded:0,total:null,ready:false,error:false},subscribe(listener){listeners.add(listener);listener(resource.progress);return()=>{listeners.delete(listener);};},promote(next){if(rank[next]>rank[job.priority]) { job.priority=next; pump(); }},demand(priority){const key=Symbol();demands.set(key,priority);refreshPriority();return {set(next){demands.set(key,next);refreshPriority();},release(){demands.delete(key);refreshPriority();}};}};
  images.set(src,resource); queue.push(job); pump(); return resource;
}
// Main readiness is informational, never a prerequisite for opening another section.
export function markStoryMediaReady(){document.documentElement.setAttribute('data-story-media-ready','');}
export function resetStoryMedia(){document.documentElement.removeAttribute('data-story-media-ready');}
export function retryStoryMedia(){document.dispatchEvent(new Event('story-media-retry'));}
