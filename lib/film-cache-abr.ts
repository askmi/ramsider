import type Hls from 'hls.js';
import type { Events, FragBufferedData, FragLoadedData, Fragment } from 'hls.js';

/** Keep upstream ABR, but local startup reads cannot measure internet speed. */
export function filmCacheAbr(Engine: typeof Hls) {
  return class extends Engine.DefaultConfig.abrController {
    private readonly localFragments = new WeakSet<Fragment>();

    protected override onFragLoaded(event: Events.FRAG_LOADED, data: FragLoadedData) {
      const details = data.networkDetails;
      const hit = details instanceof XMLHttpRequest ? details.getResponseHeader('X-Film-Cache') :
        details instanceof Response ? details.headers.get('X-Film-Cache') : null;
      if (hit === 'hit') this.localFragments.add(data.frag);
      else this.localFragments.delete(data.frag);
      // Preserve upstream load/timer/level bookkeeping.
      super.onFragLoaded(event, data);
    }

    protected override onFragBuffered(event: Events.FRAG_BUFFERED, data: FragBufferedData) {
      if (this.localFragments.has(data.frag)) return;
      super.onFragBuffered(event, data);
    }
  };
}
