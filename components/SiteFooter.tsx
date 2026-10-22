import Image from 'next/image';
import { company, companyCopy } from '@/lib/company';
import type { Locale } from '@/lib/i18n';

export function SiteFooter({ locale }: { locale: Locale }) {
  const copy = companyCopy[locale];

  return <footer id="company" className="site-footer">
    <Image className="site-footer__art" data-media src="/art/footer-paper.webp" alt="" aria-hidden="true" width={941} height={2588} loading="lazy" decoding="async" unoptimized />
    <div className="site-footer__inner">
      <section aria-labelledby="company-heading">
        <h2 id="company-heading">{copy.company}</h2>
        <p className="site-footer__name"><bdi dir="ltr">{company.name}</bdi></p>
        <p className="site-footer__licence"><bdi dir="ltr">{company.licence}</bdi></p>
      </section>
      <section id="company-contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading">{copy.contact}</h2>
        <address>
          <p><bdi dir="ltr">{company.address}</bdi></p>
          <div className="site-footer__emails">
            <a className="site-footer__link" href={company.emailHref}><bdi dir="ltr">{company.email}</bdi></a>
            <a className="site-footer__link" href={company.partnersEmailHref}><bdi dir="ltr">{company.partnersEmail}</bdi></a>
          </div>
        </address>
        <nav className="site-footer__channels" aria-label={copy.channels}>
          <ul>
            {(['instagram', 'youtube'] as const).map(channel => <li key={channel}>
              <a className="site-footer__link site-footer__social" href={company[channel]} target="_blank" rel="noopener noreferrer" aria-label={channel === 'instagram' ? 'Instagram' : 'YouTube'}>
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                  {channel === 'instagram' ? <>
                    <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="17.4" cy="6.7" r="1.1" fill="currentColor" />
                  </> : <path fill="currentColor" fillRule="evenodd" d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2 12a31 31 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.8ZM10 8.7l5.7 3.3-5.7 3.3V8.7Z" />}
                </svg>
              </a>
            </li>)}
          </ul>
        </nav>
      </section>
    </div>
  </footer>;
}
