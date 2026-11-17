import { legalCopy, legalDocuments, legalHref } from '@/lib/legal-copy';
import type { Locale } from '@/lib/i18n';
import Link from 'next/link';

export function LegalNavigation({ locale }: { locale: Locale }) {
  const copy = legalCopy[locale];
  return <nav className="site-footer__documents" aria-label={copy.documents}>
    <ul>{legalDocuments.map(document => <li key={document}>
      <Link className="site-footer__link" href={legalHref(document)} hrefLang="en" prefetch={false}>
        {copy[document]}
      </Link>
    </li>)}</ul>
    <span className="site-footer__document-language">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="6" /><ellipse cx="8" cy="8" rx="2.5" ry="6" /><path d="M2 8h12" />
      </svg>
      {copy.english}
    </span>
  </nav>;
}
