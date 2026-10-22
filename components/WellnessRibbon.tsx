import { t, type Locale } from '@/lib/i18n';
import { wellnessCopy, wellnessSections } from '@/lib/wellness';
import assets from '@/lib/wellness-assets.json';
import { WellnessViewer } from './WellnessViewer';
import { WellnessPhoto } from './WellnessPhoto';

export function WellnessRibbon({ locale }: { locale: Locale }) {
  const copy = wellnessCopy[locale];
  return <WellnessViewer closeLabel={t(locale, 'close')} loadingTitle={copy.heroEyebrow} locale={locale}>
    <article className="wellness-ribbon" lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {wellnessSections.map((key, index) => {
        const hero = index === 0, plain = index === 4, image = assets[index];
        const title = <>{copy[`${key}Title`].split('\n').map((line, i) => <span key={i}>{line}</span>)}</>;
        const photo = image && <WellnessPhoto {...image} hero={hero} alt={copy[`${key}Alt` as keyof typeof copy]} locale={locale} />;
        return <section key={key} className={`${hero ? 'wellness-hero' : ''}${plain ? 'wellness-plain' : ''}`} aria-labelledby={`wellness-${key}-title`}>
          {hero && photo}
          {plain && <span className="wellness-rule" />}
          <header className="wellness-head wellness-reveal">
            <p className="wellness-eyebrow">{!hero && <span className="wellness-number">{`0${index} / `}</span>}{copy[`${key}Eyebrow`]}</p>
            {hero ? <h1 id="wellness-hero-title">{title}</h1> : <h2 id={`wellness-${key}-title`}>{title}</h2>}
          </header>
          {hero && <span className="wellness-rule" />}
          {!hero && photo}
          <div className="wellness-copy">{copy[`${key}Body`].split('\n\n').map((paragraph, i) => <p className="wellness-reveal" key={i}>{paragraph}</p>)}</div>
        </section>;
      })}
      <footer className="wellness-end">
        <span className="wellness-rule" />
        <p className="wellness-note">{copy.note}</p>
        <p className="wellness-eyebrow">{copy.endEyebrow}</p>
        <button type="button" className="wellness-pill" data-wellness-close>{copy.back}</button>
      </footer>
    </article>
  </WellnessViewer>;
}
