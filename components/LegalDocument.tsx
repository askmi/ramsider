import { Fragment } from 'react';
import Link from 'next/link';
import texts from '@/lib/legal-documents.json';
import type { LegalDocument as DocumentName } from '@/lib/legal-copy';
import { SiteFooter } from './SiteFooter';
import styles from './LegalDocument.module.css';

function PrivacyTable({ lines }: { lines: string[] }) {
  const [purpose, data, ground, ...cells] = lines;
  if (cells.length % 3 !== 0) throw new Error('Incomplete Privacy purpose table');
  return <table className={styles.table}>
    <thead><tr>{[purpose, data, ground].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
    <tbody>{Array.from({ length: cells.length / 3 }, (_, row) => <tr key={row}>
      <th scope="row">{cells[row * 3]}</th><td>{cells[row * 3 + 1]}</td><td>{cells[row * 3 + 2]}</td>
    </tr>)}</tbody>
  </table>;
}

export function LegalDocument({ document }: { document: DocumentName }) {
  // Decode the supplied serialization only. React escapes all remaining text.
  const [title, ...lines] = texts[document].replaceAll('&quot;', '"').trim().split(/\r?\n/);
  const tableStart = document === 'privacy' ? lines.indexOf('Purpose') : -1;
  const tableEnd = tableStart < 0 ? -1 : lines.findIndex(line => line.startsWith('We will not process your Personal Data'));
  if (tableStart >= 0 && tableEnd <= tableStart) throw new Error('Missing Privacy table boundary');
  return <div className={styles.page}>
    <header className={styles.header}><Link href="/en" prefetch={false}>RAMSIDER UNO — Home</Link></header>
    <main className={styles.main} id="document">
      <article lang="en" dir="ltr" aria-labelledby="document-title">
        <h1 id="document-title">{title}</h1>
        {lines.map((line, index) => {
          if (tableStart >= 0 && index >= tableStart && index < tableEnd) {
            return index === tableStart ? <PrivacyTable key={index} lines={lines.slice(tableStart, tableEnd)} /> : null;
          }
          if (!line.trim()) return null;
          const section = /^(\d+)\. /.exec(line);
          const clause = /^(\d+(?:\.\d+)+)\./.exec(line);
          return <Fragment key={index}>{section
            ? <h2 id={section[1]}>{line}</h2>
            : <p id={clause?.[1]}>{line}</p>}</Fragment>;
        })}
      </article>
    </main>
    <SiteFooter locale="en" variant="plain" />
  </div>;
}
