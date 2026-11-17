import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalDocument } from '@/components/LegalDocument';
import { legalCopy, legalDocuments, legalHref, type LegalDocument as DocumentName } from '@/lib/legal-copy';

type Params = { locale: string; document: string };

function validate({ locale, document }: Params): DocumentName {
  if (locale !== 'en' || !legalDocuments.includes(document as DocumentName)) notFound();
  return document as DocumentName;
}

export const dynamicParams = false;
export function generateStaticParams() {
  return legalDocuments.map(document => ({ locale: 'en', document }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const document = validate(await params);
  return {
    title: `${legalCopy.en[document]} — RAMSIDER`,
    alternates: { canonical: `https://ramsider.com${legalHref(document)}` },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  return <LegalDocument document={validate(await params)} />;
}
