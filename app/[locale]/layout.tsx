import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const restoreScroll = `try{const key='ramsider:locale-scroll';const raw=sessionStorage.getItem(key);if(raw){const state=JSON.parse(raw);if(state.locale===${JSON.stringify(locale)}&&Number.isFinite(state.y)&&state.y>=0){history.scrollRestoration='manual';scrollTo({top:state.y,behavior:'instant'});sessionStorage.removeItem(key)}}}catch{}`;
  return <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}><body>{children}<script dangerouslySetInnerHTML={{ __html: restoreScroll }} /></body></html>;
}
