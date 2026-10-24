import { test, expect } from '@playwright/test';
import type Hls from 'hls.js';
import type { Events, FragBufferedData, FragLoadedData } from 'hls.js';
import { filmCacheAbr } from '../../lib/film-cache-abr';

test('cache filtering preserves bookkeeping and resumes real samples on a reused fragment', async ({}, info) => {
  test.skip(info.project.name !== 'desktop-chromium', 'One owner for pure adapter contract');
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'XMLHttpRequest');
  Object.defineProperty(globalThis, 'XMLHttpRequest', { configurable: true, value: class {} });
  let loaded = 0, sampled = 0;
  class Upstream {
    protected onFragLoaded() { loaded++; }
    protected onFragBuffered() { sampled++; }
  }
  const engine = { DefaultConfig: { abrController: Upstream } } as unknown as typeof Hls;
  class Probe extends filmCacheAbr(engine) {
    load(data: FragLoadedData) { this.onFragLoaded('hlsFragLoaded' as Events.FRAG_LOADED, data); }
    buffer(data: FragBufferedData) { this.onFragBuffered('hlsFragBuffered' as Events.FRAG_BUFFERED, data); }
  }
  try {
    const probe = new Probe({} as Hls), frag = {};
    const buffered = { frag } as FragBufferedData;
    probe.load({ frag, networkDetails: new Response(null, { headers: { 'X-Film-Cache': 'hit' } }) } as FragLoadedData);
    probe.buffer(buffered);
    expect([loaded, sampled]).toEqual([1, 0]);
    probe.load({ frag, networkDetails: new Response(null) } as FragLoadedData);
    probe.buffer(buffered);
    expect([loaded, sampled]).toEqual([2, 1]);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'XMLHttpRequest', descriptor);
    else Reflect.deleteProperty(globalThis, 'XMLHttpRequest');
  }
});
