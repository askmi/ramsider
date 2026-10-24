import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n';
import { contentLanguage, documentData, documentNames, reservationCopy, type DocumentName } from '@/lib/preorder/content';
import { preorderChrome } from '@/lib/preorder/chrome';
import { SourceDocument } from '@/components/preorder/SourceDocument';
import { ReservationController } from '@/components/preorder/ReservationController';
import '@/components/preorder/package.css';
import '@/components/preorder/adaptation.css';

type Params = { locale: string; document: string };
export const dynamicParams = false;
export function generateStaticParams() { return documentNames.map(document => ({ document })); }
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { document } = await params;
  return { title: `UNO ${document} · RAMSIDER Beta`, robots: { index: false, follow: false } };
}
export default async function DocumentPage({ params }: { params: Promise<Params> }) {
  const { locale: value, document } = await params;
  if (!locales.includes(value as Locale) || !documentNames.includes(document as DocumentName)) notFound();
  const locale = value as Locale; const name = document as DocumentName;
  const language = contentLanguage(locale, name); const copy = preorderChrome[locale];
  return <div className={`uno-package up-page-${name} ${documentData[name].bodyClass}`} lang={language} dir="ltr">
    <aside className="up-beta" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-label="Beta">
      <p>{copy.preview}</p>
      <nav aria-label={copy.languages}><a href={`/en/${name === 'privacy-ru' ? 'privacy' : name}`} data-preorder-language hrefLang="en" lang="en">English</a><a href={`/ru/${name === 'privacy' ? 'privacy-ru' : name}`} data-preorder-language hrefLang="ru" lang="ru">Русский</a></nav>
      {(language !== locale || ['terms', 'returns'].includes(name)) && <p>{copy.original}</p>}
    </aside>
    {name === 'reserve' && <noscript><p className="up-no-script" lang={locale}>{copy.noScript}</p></noscript>}
    <div id="uno-document" data-document={name}><SourceDocument name={name} locale={locale} language={language} /></div>
    {name === 'reserve' && <ReservationController copy={reservationCopy(language)} />}
  </div>;
}
