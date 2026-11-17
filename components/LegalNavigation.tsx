import { legalCopy, legalDocuments, legalHref } from '@/lib/legal-copy';
import type { Locale } from '@/lib/i18n';
import Link from 'next/link';

export function LegalNavigation({ locale }: { locale: Locale }) {
  const copy = legalCopy[locale];
  return <nav className="site-footer__documents" aria-labelledby="legal-documents-heading">
    <h2 id="legal-documents-heading">{copy.documents}</h2>
    <ul>{legalDocuments.map(document => <li key={document}>
      <Link className="site-footer__link" href={legalHref(document)} hrefLang="en" prefetch={false}>
        {copy[document]} <bdi dir="ltr">(EN)</bdi>
      </Link>
    </li>)}</ul>
  </nav>;
}
