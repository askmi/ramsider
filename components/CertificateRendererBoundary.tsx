'use client';
import {Component,type ReactNode} from 'react';
import {safeDiagnostic,type CertificateDebugTrace} from '@/lib/certificate-debug';
import type {CertificateCopy} from '@/lib/certificate-copy';
import type {Locale} from '@/lib/i18n';
import {LoadingStatus} from './MediaLoading';
import {CertificateProblemDetails} from './CertificateDiagnostics';

type Props={children:ReactNode;trace?:CertificateDebugTrace;locale:Locale;copy:CertificateCopy;onRetry:()=>void};
export class CertificateRendererBoundary extends Component<Props,{problem:string}> {
 state={problem:''};
 static getDerivedStateFromError(error:unknown) {let problem='renderer.runtime: exception details unavailable';try {problem='renderer.runtime: '+safeDiagnostic(error);} catch {}return {problem};}
 componentDidCatch(error:Error) {try {this.props.trace?.fail('renderer.runtime',error);} catch { /* The local error remains visible if diagnostics also fail. */ }}
 render() {
  return this.state.problem ? <LoadingStatus locale={this.props.locale} labels={this.props.copy} error onRetry={this.props.onRetry}><CertificateProblemDetails trace={this.props.trace} problem={this.state.problem}/></LoadingStatus> : this.props.children;
 }
}
