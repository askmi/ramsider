import Image from 'next/image';
import type { ReactNode } from 'react';
import { DialogController } from './DialogController';
import { BackToTop } from './BackToTop';
import { LocaleSwitcher } from './LocaleSwitcher';
import Link from 'next/link';
import { storyNodes, type StoryNode } from '@/lib/story';
import { locales, t, type Key, type Locale } from '@/lib/i18n';
import { MenuShell } from './MenuShell';
import { ActionArrow } from './ActionArrow';
import buttonMap from '@/lib/button-map.json';
import localizedButtonWidths from '@/lib/button-localized-widths.json';
import artPreviews from '@/lib/art-previews.json';

// Keep the complete FAQ/account artwork in one tile: no image edge through a card.
const artTiles = Array.from({ length: 12 }, (_, i) => ({
  file: i === 9 ? '09-10' : String(i).padStart(2, '0'),
  height: i === 9 ? 5600 : Math.min(2800, 32127 - i * 2800),
})).filter((_, i) => i !== 10);

const featureArt = [
  { name: 'control', x: 340, y: 5150, width: 100, height: 154 },
  { name: 'draw', x: 340, y: 5352, width: 100, height: 161 },
  { name: 'intensity', x: 340, y: 5565, width: 100, height: 158 },
  { name: 'consistent', x: 350, y: 5772, width: 80, height: 70 },
] as const;

function sourceStyle(x: number, y: number, w: number, size?: number): React.CSSProperties {
  return {
    left: `${(x / 941) * 100}%`,
    top: `calc(${(y / 941) * 100}cqw - var(--source-offset, 0px))`,
    width: `${(w / 941) * 100}%`,
    ...(size ? { fontSize: `${(size / 941) * 100}cqw` } : {}),
  };
}

function textLines(value: string) {
  return value.split('\n').map((line, index) => <span key={index}>{line}{index < value.split('\n').length - 1 && <br />}</span>);
}

function OverlayNode({ node, locale }: { node: StoryNode; locale: Locale }) {
  const text = t(locale, node.key);
  const props = {
    id: node.id,
    className: `overlay ${node.style ?? 'body'} key-${node.key} ${node.align ? `align-${node.align}` : ''}${/[\u0600-\u06ff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(text) ? ' script-fallback' : ''}`,
    style: sourceStyle(node.x, node.y, node.w, node.size),
  };

  if (node.style === 'button') {
    if (!node.id || !(node.id in buttonMap)) throw new Error(`Unmapped button: ${node.key}`);
    const appearance = buttonMap[node.id as keyof typeof buttonMap];
    const isPill = 'asset' in appearance;
    const arrow = isPill && !['Reserve_Now', 'Learn_More'].includes(appearance.asset);
    const localizedGeometry = isPill && locale !== 'en'
      ? (localizedButtonWidths as Record<string, Record<string, { x: number; w: number }>>)[locale]?.[node.id]
      : undefined;
    if (isPill && locale !== 'en' && !localizedGeometry) throw new Error(`Uncalibrated localized button: ${locale}/${node.id}`);
    const buttonProps = {
      ...props,
      className: `${props.className} story-button button-${appearance.kind}${isPill ? ` theme-${appearance.theme}${arrow ? ' has-arrow' : ''}` : ''}`,
      style: isPill ? {
        ...sourceStyle(localizedGeometry?.x ?? appearance.x, appearance.y, localizedGeometry?.w ?? appearance.w, appearance.size),
        '--surface-height': `${appearance.h / 941 * 100}cqw`,
      } as React.CSSProperties : props.style,
    };
    const content = <>
      {isPill && <span className="button-surface" aria-hidden="true" style={{ backgroundImage: `url('/buttons/${locale === 'en' ? '' : `${locale}/`}${node.id}.svg')` }} />}
      <span className="button-label">{appearance.kind === 'orbit' ? text.split(/(UNO)/).map((part, index) => part === 'UNO' ? <span className="uno-emphasis" key={index}>{part}</span> : part) : text}</span>
      {appearance.kind === 'outline' && <ActionArrow />}
    </>;
    if (node.target) return <Link {...buttonProps} href={node.target}>{content}</Link>;
    return <button {...buttonProps} type="button" aria-haspopup="dialog" popoverTarget={`unavailable-${node.unavailable ?? 'commerce'}`}>{content}</button>;
  }
  if (node.key === 'hero') return <h1 {...props}>{textLines(text)}</h1>;
  if (['proLine', 'goldLine', 'mini'].includes(node.key)) {
    const [name, line] = text.split('│');
    return <p {...props} className={`${props.className} line-signature`}><span className="signature-name">{name.trim()}</span><i className="signature-divider" aria-hidden="true" /><span className="signature-line">{line?.trim()}</span></p>;
  }
  if (node.key === 'finalBrand') return <p {...props}><span>RAMSIDER</span> <em>UNO</em></p>;
  if (node.style === 'title') return <h2 {...props}>{textLines(text)}</h2>;
  return <p {...props}>{textLines(text)}</p>;
}

const docs: { key: Key; detail: string; x: number; y: number }[] = [
  { key: 'electrical', detail: 'IEC 60335-1 · CVC CNCVC3375\nPRO · GOLD', x: 100, y: 23285 },
  { key: 'emc', detail: 'CB Scheme · BELLIS BY-00473\nPRO · GOLD', x: 485, y: 23285 },
  { key: 'uae', detail: 'ECAS · MoIAT 25-12-176846\nPRO · GOLD', x: 100, y: 23530 },
  { key: 'rohs', detail: 'UAE RoHS · MoIAT 25-12-176551\nPRO · GOLD', x: 485, y: 23530 },
  { key: 'telecom', detail: 'TDRA · UAE ER55730/26\nUNO PRO', x: 100, y: 23775 },
];

function DocumentCards({ locale }: { locale: Locale }) {
  return <>
    {docs.map((doc) => <div className={`doc-card doc-card--${doc.key} source-panel`} key={doc.key} style={sourceStyle(doc.x, doc.y, 356)}>
      <Image className="doc-thumb" src={`/art/doc-${doc.key}.webp`} width={95} height={140} alt="" unoptimized />
      <strong>{textLines(t(locale, doc.key))}</strong>
      <small>{textLines(doc.detail)}</small>
      <button id={`document-${doc.key}`} type="button" aria-haspopup="dialog" popoverTarget={`doc-detail-${doc.key}`} aria-label={`${t(locale, 'docView')}: ${t(locale, doc.key).replaceAll('\n', ' ')}`}><span className="doc-action-label">{t(locale, 'docView')}</span><ActionArrow /></button>
    </div>)}
    <div className="doc-card doc-card--all source-panel" style={sourceStyle(485, 23775, 356)}>
      <span className="doc-icon" aria-hidden="true">▱</span>
      <strong>{t(locale, 'allDocs')}</strong>
      <small>{t(locale, 'allDocsBody')}</small>
      <button id="documents-all" type="button" aria-haspopup="dialog" popoverTarget="unavailable-docs" aria-label={`${t(locale, 'allDocsView')}: ${t(locale, 'allDocs')}`}><span className="doc-action-label">{t(locale, 'allDocsView')}</span><ActionArrow /></button>
    </div>
  </>;
}

// Card surfaces and minus marks are already present in the clean artwork.
const questions: { key: Key; id: string; y: number; height: number }[] = [
  { key: 'faq1', id: 'preorder', y: 27147, height: 172 },
  { key: 'faq2', id: 'set', y: 27326, height: 171 },
  { key: 'faq3', id: 'shipping', y: 27505, height: 171 },
  { key: 'faq4', id: 'tracking', y: 27683, height: 171 },
  { key: 'faq5', id: 'support', y: 27861, height: 170 },
  { key: 'faq6', id: 'venue', y: 28037, height: 170 },
];

function Faq({ locale }: { locale: Locale }) {
  return <div className="faq-stack">
    {questions.map((question, index) => <div className="faq-item" key={question.key} style={{
      '--faq-row-height': `${question.height / 941 * 100}cqw`,
      '--faq-middle-height': `${question.height - 72}`,
      '--faq-source-height': `${(questions[index + 1]?.y ?? question.y + question.height) - question.y + 8}`,
      '--faq-gap': `${((questions[index + 1]?.y ?? question.y + question.height) - question.y - question.height) / 941 * 100}cqw`,
    } as React.CSSProperties}>
      <div className="faq-row-art" aria-hidden="true">
        {['top', 'middle', 'bottom'].map(part => <div className={`faq-art-${part}`} key={part}>
          <Image src={`/art/faq-row-${index + 1}.webp`} width={941} height={(questions[index + 1]?.y ?? question.y + question.height) - question.y + 8} alt="" unoptimized loading="lazy" />
          {part === 'middle' && <Image className="faq-minus-cover" src={`/art/faq-row-${index + 1}.webp`} width={941} height={(questions[index + 1]?.y ?? question.y + question.height) - question.y + 8} alt="" unoptimized loading="lazy" />}
        </div>)}
      </div>
      <details>
      <summary id={`faq-${question.id}`}><span className="faq-question">{t(locale, question.key)}</span><span className="faq-symbol" aria-hidden="true" /></summary>
      <p>{t(locale, 'faqPending')}</p>
      </details>
    </div>)}
  </div>;
}

function Menus({ locale }: { locale: Locale }) {
  return <header className="masthead">
    <Link id="home-link" className="wordmark" href={`/${locale}`} aria-label={`RAMSIDER ${t(locale, 'home')}`}>RAMSIDER</Link>
    <MenuShell label={t(locale, 'menu')}>
      <nav aria-label={t(locale, 'menu')}>
        {(['moment', 'technology', 'choice', 'expressions', 'pro', 'gold', 'set', 'order', 'documents', 'hospitality', 'faq', 'final'] as const).map((id) => <a id={`navigation-${id}`} key={id} href={`#${id}`}>{t(locale, ({ moment: 'moment', technology: 'complexity', choice: 'choice', expressions: 'expressions', pro: 'pro', gold: 'gold', set: 'set', order: 'order', documents: 'documented', hospitality: 'hospitality', faq: 'faqTitle', final: 'final' } as const)[id])}</a>)}
        <div className="locale-links" aria-label={t(locale, 'language')}>
          {locales.map((option) => <Link id={`locale-${option}`} key={option} href={`/${option}`} hrefLang={option} aria-current={locale === option ? 'page' : undefined}>{option.toUpperCase()}</Link>)}
        </div>
      </nav>
    </MenuShell>
  </header>;
}

const blocked = [
  ['commerce', 'unavailableCommerce'],
  ['film', 'unavailableFilm'],
  ['docs', 'unavailableDocs'],
  ['business', 'unavailableBusiness'],
  ['account', 'unavailableAccount'],
] as const;

function Panel({ id, title, locale, children }: { id: string; title: string; locale: Locale; children: ReactNode }) {
  return <dialog id={id} className="availability" aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{title.replaceAll('\n', ' ')}</h2>
    {children}
    <button id={`close-${id}`} type="button" popoverTarget={id} popoverTargetAction="hide">{t(locale, 'close')}</button>
  </dialog>;
}

const modelDetails = {
  pro: [['pro1', 'pro1b'], ['pro2', 'pro2b'], ['pro3', 'pro3b'], ['pro4', 'pro4b'], ['pro5', 'pro5b']],
  gold: [['gold1', 'gold1b'], ['gold2', 'gold2b'], ['gold3', 'gold3b'], ['gold4', 'gold4b'], ['gold5', 'gold5b']],
} as const;

function Popovers({ locale }: { locale: Locale }) {
  const projects = ['project1', 'project2', 'project3', 'project4'] as const;
  const projectBodies = ['project1Body', 'project2Body', 'project3Body', 'project4Body'] as const;
  return <>{blocked.map(([id, key]) => <Panel key={id} id={`unavailable-${id}`} title={t(locale, 'unavailableTitle')} locale={locale}>
    <p>{t(locale, key)}</p>
  </Panel>)}
    <Panel id="unavailable-technology" title={t(locale, 'technologies')} locale={locale}>
      <p>{t(locale, 'complexityBody')}</p>
      <ul className="technology-links">{(['triple', 'core', 'touch', 'water', 'light', 'armor', 'flow'] as const).map(key => <li key={key}><a href={`#${key === 'triple' ? 'tech-features' : `tech-${key}`}`}>{t(locale, key).replaceAll('\n', ' ')}</a></li>)}</ul>
    </Panel>
    <Panel id="unavailable-compare" title={t(locale, 'compare')} locale={locale}>
      <table className="model-comparison"><thead><tr>{(['proLine', 'goldLine'] as const).map(key => <th key={key} scope="col">{t(locale, key).replace('│', ' ')}</th>)}</tr></thead>
        <tbody>{modelDetails.pro.map((_, i) => <tr key={i}>{(['pro', 'gold'] as const).map(model => {
          const [name, description] = modelDetails[model][i];
          return <td key={model}><strong>{t(locale, name)}</strong><p>{t(locale, description)}</p></td>;
        })}</tr>)}</tbody>
      </table>
    </Panel>
    {(['pro', 'gold'] as const).map(model => <Panel key={model} id={`unavailable-${model}`} title={t(locale, model)} locale={locale}>
      <ul>{modelDetails[model].map(([name, description]) => <li key={name}><strong>{t(locale, name)}</strong> — {t(locale, description)}</li>)}</ul>
    </Panel>)}
    <Panel id="unavailable-set" title={t(locale, 'set')} locale={locale}>
      <p>{textLines(t(locale, 'setBody'))}</p><p>{t(locale, 'unavailableSet')}</p>
    </Panel>
    {docs.map(doc => <Panel key={doc.key} id={`doc-detail-${doc.key}`} title={t(locale, doc.key)} locale={locale}>
      <p>{textLines(doc.detail)}</p><p>{t(locale, 'unavailableDocs')}</p>
    </Panel>)}
    {projects.map((key, i) => <Panel key={key} id={`project-detail-${i + 1}`} title={t(locale, key)} locale={locale}>
      <p>{textLines(t(locale, projectBodies[i]))}</p>
      {i === 1 && <p>{textLines(t(locale, 'project2More'))}</p>}
      <p>{t(locale, 'unavailableProject')}</p>
    </Panel>)}
  </>;
}

export function Story({ locale }: { locale: Locale }) {
  return <DialogController>
    <main className="canvas" data-locale={locale}>
      <div className="story-prefix-space" aria-hidden="true" />
      <div className="art" aria-hidden="true">
        {artTiles.filter(({ file }) => file !== '11').map(({ file, height }, i) => <Image
          key={i}
          src={`/art/${file}.webp`}
          width={941}
          height={height}
          alt=""
          unoptimized
          preload={i === 0}
          loading="eager"
          fetchPriority={i === 0 ? 'high' : 'low'}
          placeholder="blur"
          blurDataURL={artPreviews[file as keyof typeof artPreviews]}
        />)}
      </div>
      <Menus locale={locale} />
      {featureArt.map(icon => <Image
        key={icon.name}
        className="feature-source-art"
        src={`/art/feature-${icon.name}.png`}
        width={icon.width}
        height={icon.height}
        style={sourceStyle(icon.x, icon.y, icon.width)}
        alt=""
        aria-hidden="true"
        unoptimized
        loading="eager"
        fetchPriority="low"
      />)}
      {storyNodes.filter(node => node.y < 28207).map((node, index) => <OverlayNode node={node} locale={locale} key={`${node.key}-${index}`} />)}
      <button id="film-play" type="button" className="film-play" style={sourceStyle(390, 11439, 160)} popoverTarget="unavailable-film" aria-label={t(locale, 'film')}><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M12 7L34 20L12 33Z" fill="currentColor" /></svg></button>
      <div className="order-panels" aria-hidden="true">{[20140, 20370, 20650].map((y, i) => <div key={y} className="source-panel" data-step={`0${i + 1}`} style={sourceStyle(95, y, 750)} />)}</div>
      <DocumentCards locale={locale} />
      <Faq locale={locale} />
      <section className="story-tail" aria-label={t(locale, 'account')}>
        <div className="tail-art" aria-hidden="true"><div className="tail-art-track">
          <Image src="/art/09-10.webp" width={941} height={5600} alt="" unoptimized loading="eager" fetchPriority="low" placeholder="blur" blurDataURL={artPreviews['09-10']} />
          <Image src="/art/11.webp" width={941} height={1327} alt="" unoptimized loading="eager" fetchPriority="low" placeholder="blur" blurDataURL={artPreviews['11']} />
        </div></div>
        {storyNodes.filter(node => node.y >= 28207).map((node, index) => <OverlayNode node={node} locale={locale} key={`${node.key}-${index}`} />)}
      <button id="account-personal" type="button" className="account-hit" style={sourceStyle(45, 28230, 850)} popoverTarget="unavailable-account" aria-label={t(locale, 'account')} />
      <button id="account-venue" type="button" className="account-hit" style={sourceStyle(45, 28350, 850)} popoverTarget="unavailable-account" aria-label={`${t(locale, 'businessAccount')}: ${t(locale, 'venueAccount')}`} />
      <Image className="group-diamond" src="/art/rams-group-diamond.png" width={120} height={150} alt="" unoptimized style={sourceStyle(410, 28885, 120)} />
      {[
        { hit: 29370, number: 29373, link: 29586 },
        { hit: 29690, number: 29705, link: 29908 },
        { hit: 30010, number: 30025, link: 30248 },
        { hit: 30330, number: 30358, link: 30572 },
      ].map(({ hit, number, link }, i) => <div key={hit}>
        <p className="project-number" style={sourceStyle(75, number, 340, 16)}>{t(locale, 'projectLabel')} {String(i + 1).padStart(2, '0')}</p>
        {i === 0 && <span className="project-active" style={sourceStyle(75, 29545, 105, 14)}>{t(locale, 'active')}</span>}
        <button id={`project-${['ramsider', 'ramsmobile', 'ramswear', 'ramsfood'][i]}`} type="button" className="project-hit" style={sourceStyle(40, hit, 850)} popoverTarget={`project-detail-${i + 1}`} aria-label={t(locale, (['project1', 'project2', 'project3', 'project4'] as const)[i])}>
          <span className="project-link-row" style={{ top: `${((link - hit) / 941) * 100}cqw` }} aria-hidden="true">
            <span>{t(locale, 'projectLink')}</span><Image className="project-arrow" src="/buttons/Arrow_Right.svg" width={56} height={56} alt="" unoptimized />
          </span>
        </button>
      </div>)}
      </section>
    </main>
    <LocaleSwitcher locale={locale} label={t(locale, 'language')} />
    <BackToTop label={t(locale, 'backToTop')} />
    <Popovers locale={locale} />
  </DialogController>;
}
