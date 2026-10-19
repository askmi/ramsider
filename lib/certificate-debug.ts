/** Temporary, local-only diagnostics. Set false to remove the entire debug UI. */
export const CERTIFICATE_DEBUG_ENABLED = true;

export function safeDiagnostic(value: unknown): string {
 const raw = value instanceof Error ? `${value.name}: ${value.message}` : String(value);
 return raw.replace(/https?:\/\/[^\s"'<>]+/gi, input => {
  try { const url = new URL(input); return url.origin === location.origin ? url.pathname : '[external URL]'; } catch { return '[URL]'; }
 }).replace(/(?:bearer\s+)[\w.\-]+/gi, 'Bearer [redacted]')
  .replace(/\b(token|password|secret|authorization|cookie|key)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]')
  .replace(/[?&#][^\s"'<>]*/g, '[parameters removed]').slice(0, 420);
}

export function reportedBrowser(ua: string): string {
 const tokens=['EdgiOS','EdgA','Edg','OPR','SamsungBrowser','CriOS','FxiOS','Firefox','Chrome','Version'];
 for(const token of tokens) {
  const match=new RegExp(token+'/([\\d.]+)').exec(ua);
  if(match) return `${({EdgiOS:'Edge',EdgA:'Edge',Edg:'Edge',OPR:'Opera',CriOS:'Chrome',FxiOS:'Firefox',Version:'Safari'} as Record<string,string>)[token] ?? token} ${match[1]}`;
 }
 return 'unavailable';
}

type Connection = {type?: string; effectiveType?: string; downlink?: number; rtt?: number};
type DebugNavigator = Navigator & {deviceMemory?: number; connection?: Connection};
export type DebugSnapshot = {summary: string; events: string; failed: boolean};

export class CertificateDebugTrace {
 private started = performance.now();
 private listeners = new Set<() => void>();
 private rows: string[] = [];
 private failed = false;
 private failure = '';
 private transfer = 'PDF: measuring…';
 private render = '';
 private phase = 'renderer.import';
 private device: string[];
 private state: DebugSnapshot;
 constructor(private source: string) {
  const nav = navigator as DebugNavigator, ua = nav.userAgent;
  const ios = /(?:CPU(?: iPhone)? OS|iPhone OS) ([\d_]+)/.exec(ua)?.[1]?.replaceAll('_', '.');
  const android = /Android ([\d.]+)/.exec(ua)?.[1];

  const connection = nav.connection;
  const field = (value: unknown) => value === undefined ? 'unavailable' : String(value);
  this.device = [
   `OS (reported): ${ios ? 'iOS '+ios : android ? 'Android '+android : /Mac/.test(ua) ? (nav.maxTouchPoints > 1 ? 'macOS/iPadOS (unavailable)' : 'macOS (version unavailable)') : /Windows NT ([\d.]+)/.test(ua) ? 'Windows NT '+/Windows NT ([\d.]+)/.exec(ua)![1] : 'unavailable'} | Browser: ${reportedBrowser(ua)}`,
   `Viewport: ${innerWidth}×${innerHeight} @${devicePixelRatio} | CPU threads: ${field(nav.hardwareConcurrency)} | RAM hint: ${nav.deviceMemory === undefined ? 'unavailable' : nav.deviceMemory+' GiB (approx.)'}`,
   `NET: ${nav.onLine ? 'online flag' : 'offline flag'} | interface: ${field(connection?.type)} | effective: ${field(connection?.effectiveType)} | VPN: unavailable`,
   `NET API estimate: ${connection?.downlink === undefined ? 'unavailable' : connection.downlink+' Mbps'} | RTT: ${connection?.rtt === undefined ? 'unavailable' : connection.rtt+' ms'}`,

  ];
  this.state = this.makeSnapshot();
  this.add('viewer.open');
  this.add('features', `Worker=${typeof Worker !== 'undefined'}; Promise.withResolvers=${typeof Promise.withResolvers === 'function'}; Map.getOrInsertComputed=${typeof (Map.prototype as unknown as Record<string, unknown>).getOrInsertComputed === 'function'}`);
 }
 private makeSnapshot(): DebugSnapshot {return {summary:[this.failed ? 'ERROR '+this.failure : '', this.transfer, this.render, ...this.device].filter(Boolean).join('\n'),events:this.rows.join('\n'),failed:this.failed};}
 private publish() {this.state=this.makeSnapshot();this.listeners.forEach(listener=>listener());}
 subscribe = (listener: () => void) => {this.listeners.add(listener);return () => {this.listeners.delete(listener);};};
 snapshot = () => this.state;
 add(phase: string, detail = '') {this.phase=phase;this.rows.push(`${((performance.now()-this.started)/1000).toFixed(2)}s ${phase}${detail ? ' · '+safeDiagnostic(detail) : ''}`);this.rows=this.rows.slice(-24);this.publish();}
 fail(phase: string, reason: unknown) {
  this.failed=true;if(this.transfer==='PDF: measuring…')this.transfer='PDF: download incomplete; size/speed unavailable';this.failure=phase+': '+safeDiagnostic(reason);this.add(phase, safeDiagnostic(reason));
  for(const item of performance.getEntriesByType('resource').filter(entry=>{try{return entry.startTime >= this.started && new URL(entry.name).pathname.startsWith('/pdfjs/');}catch{return false;}}).slice(-4)) {
   const entry=item as PerformanceResourceTiming & {responseStatus?:number};
   this.add('resource.observed', `${new URL(entry.name).pathname}; ${Math.round(entry.duration)} ms; HTTP ${entry.responseStatus || 'unavailable'}; transfer ${entry.transferSize} B (0 may mean cache/blocked/unavailable)`);
  }
 }
 reset() {this.started=performance.now();this.rows=[];this.failed=false;this.failure='';this.transfer='PDF: measuring…';this.render='';this.add('retry');}
 downloaded(bytes: number, elapsed: number, status: number, mime: string, declared: number | null) {
  const url=new URL(this.source, location.origin).href;
  const entry=performance.getEntriesByName(url).filter(item=>item.entryType==='resource' && item.startTime >= this.started).at(-1) as PerformanceResourceTiming | undefined;
  const cached=entry && entry.transferSize===0 && entry.decodedBodySize>0;
  const speed=elapsed>0 ? `${(bytes*8/elapsed/1000).toFixed(2)} Mbps` : 'unavailable';
  this.transfer=`PDF: ${bytes.toLocaleString('en-US')} B (${(bytes/1024).toFixed(1)} KiB) | ${(elapsed/1000).toFixed(2)} s | ${cached ? '0 network bytes reported; internet speed unavailable' : speed+' delivery (latency/cache may affect)'}`;
  this.add('pdf.body.complete',`HTTP ${status}; MIME ${mime}; Content-Length ${declared ?? 'unavailable'} B; received ${bytes} B; ${entry ? 'transferSize '+entry.transferSize+' B' : 'cache status unavailable'}`);
 }
 rendered(elapsed: number) {this.render=`Render: ${(elapsed/1000).toFixed(2)} s (elapsed, not CPU usage)`;this.add('render.ready');}
 currentPhase() {return this.phase;}
}

export function createCertificateDebug(source: string) {return CERTIFICATE_DEBUG_ENABLED ? new CertificateDebugTrace(source) : undefined;}
