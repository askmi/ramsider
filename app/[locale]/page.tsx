import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Story } from '@/components/Story';
import { locales, t, type Locale } from '@/lib/i18n';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  const language = locale as Locale;
  return {
    title: 'RAMSIDER UNO — Fograiser',
    description: `${t(language, 'hero').replaceAll('\n', ' ')} ${t(language, 'expression')}`,
  };
}

export const dynamicParams = false;

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) notFound();
  return <Story locale={locale as Locale} />;
}
