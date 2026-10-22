'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { LoadingStatus } from './MediaLoading';

/** The supplied PNG bytes remain untouched, including their untagged colour space. */
export function WellnessPhoto({ src, alt, position, hero, locale }: {
  src: string; alt: string; position: string; hero: boolean; locale: Locale;
}) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<'pending' | 'ready' | 'error'>('pending');
  return <figure className="wellness-photo" data-state={state}>
    <Image key={attempt} src={attempt ? `${src}?wellness-retry=${attempt}` : src}
      alt={alt} width={1024} height={1536} unoptimized loading={hero ? 'eager' : 'lazy'}
      fetchPriority={hero ? 'high' : 'auto'} style={{ objectPosition: position }}
      onLoad={() => setState('ready')} onError={() => setState('error')} />
    {state !== 'ready' && <div className="wellness-photo__status">
      <LoadingStatus locale={locale} error={state === 'error'} onRetry={() => {
        setState('pending'); setAttempt(value => value + 1);
      }} />
    </div>}
  </figure>;
}
