'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { CERTIFICATE_DEBUG_ENABLED, CERTIFICATE_DEBUG_REVISION, type CertificateDebugTrace, type DebugSnapshot } from '@/lib/certificate-debug';

const unavailable:DebugSnapshot={summary:'Diagnostic trace unavailable; device/network measurements unavailable.',events:'',failed:true,waiting:false};
const subscribeUnavailable=()=>()=>{};
const snapshotUnavailable=()=>unavailable;
function useSnapshot(trace?:CertificateDebugTrace) {return useSyncExternalStore(trace?.subscribe??subscribeUnavailable,trace?.snapshot??snapshotUnavailable,trace?.snapshot??snapshotUnavailable);}

export function CertificateDiagnostics({trace, label, problem}: {trace?: CertificateDebugTrace; label: string; problem?:string}) {
 const state = useSnapshot(trace);
 useEffect(() => {if(!trace||!state.waiting)return;const timer=setInterval(trace.refreshWaiting,1000);return () => clearInterval(timer);},[trace,state.waiting]);
 if(!CERTIFICATE_DEBUG_ENABLED)return null;
 return <aside className="certificate-debug" tabIndex={0} aria-label={label}>
  <strong>{label} · {CERTIFICATE_DEBUG_REVISION}</strong>
  <pre dir="ltr">{problem ? problem+'\n' : ''}{state.summary}</pre>
  {state.events && <details open={state.failed || undefined}><summary>{label} · Trace</summary><pre dir="ltr">{state.events}</pre></details>}
 </aside>;
}

/** Error details are also colocated with Retry, independent of the top panel. */
export function CertificateProblemDetails({trace,problem}: {trace?:CertificateDebugTrace;problem?:string}) {
 const state=useSnapshot(trace);
 if(!CERTIFICATE_DEBUG_ENABLED)return null;
 return <pre className="certificate-error-debug" dir="ltr">DEBUG · {CERTIFICATE_DEBUG_REVISION}{'\n'}{problem || state.summary.split('\n').find(line=>line.startsWith('ERROR ')) || 'Error details unavailable; diagnostic trace unavailable.'}</pre>;
}
