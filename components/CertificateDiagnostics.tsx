'use client';
import { useSyncExternalStore } from 'react';
import type { CertificateDebugTrace } from '@/lib/certificate-debug';

export function CertificateDiagnostics({trace, label}: {trace: CertificateDebugTrace; label: string}) {
 const state = useSyncExternalStore(trace.subscribe, trace.snapshot, trace.snapshot);
 return <aside className="certificate-debug" tabIndex={0} aria-label={label}>
  <strong>{label}</strong>
  <pre dir="ltr">{state.summary}</pre>
  <details open={state.failed || undefined}><summary>{label} · Trace</summary><pre dir="ltr">{state.events}</pre></details>
 </aside>;
}
