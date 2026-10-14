import type { CSSProperties } from 'react';
import { t, type Locale } from '@/lib/i18n';
import { charcoalCopy, charcoalSections } from '@/lib/charcoal';
import joins from '@/lib/charcoal-joins.json';
import { CharcoalViewer } from './CharcoalViewer';
import { CharcoalArtwork } from './CharcoalArtwork';

export function CharcoalRibbon({ locale }: { locale: Locale }) {
  const copy = charcoalCopy[locale];
  return <CharcoalViewer closeLabel={t(locale, 'close')}>
    <article className="charcoal-ribbon" data-locale={locale}>
      {charcoalSections.map((section, index) => <section key={section.key} className={`charcoal-section charcoal-section--${index + 1}`}
        aria-labelledby={index === 0 ? 'charcoal-title' : `charcoal-${section.key}`}
        style={{ '--art-height': section.height, '--copy-top': section.copyTop, backgroundImage: `url('${joins[index]}')` } as CSSProperties}>
        <CharcoalArtwork index={index + 1} locale={locale} />
        <div className="charcoal-copy">
          <h2 id={index === 0 ? 'charcoal-title' : `charcoal-${section.key}`}>{copy[section.key].title}</h2>
          <p>{copy[section.key].body}</p>
          {index === 3 && <footer className="charcoal-footer" dir="ltr">RAMSIDER / UNO</footer>}
        </div>
      </section>)}
    </article>
  </CharcoalViewer>;
}
