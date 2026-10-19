'use client';
import { useEffect, useSyncExternalStore } from 'react';
import type { CertificateDebugTrace } from '@/lib/certificate-debug';

export function CertificateDiagnostics({trace, label}: {trace: CertificateDebugTrace; label: string}) {
 const state = useSyncExternalStore(trace.subscribe, trace.snapshot, trace.snapshot);
 useEffect(() => {if(!state.waiting)return;const timer=setInterval(trace.refreshWaiting,1000);return () => clearInterval(timer);},[trace,state.waiting]);
 return <aside className="certificate-debug" tabIndex={0} aria-label={label}>
  <strong>{label}</strong>
  <pre dir="ltr">{state.summary}</pre>
  <details open={state.failed || undefined}><summary>{label} · Trace</summary><pre dir="ltr">{state.events}</pre></details>
 </aside>;
}
