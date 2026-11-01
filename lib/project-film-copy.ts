import type { Locale } from './i18n';

export const projectFilmCopy: Record<Locale, { overview: string; teaser: string }> = {
  en: { overview: 'Overview', teaser: 'Teaser' },
  ru: { overview: 'Обзор', teaser: 'Тизер' },
  de: { overview: 'Überblick', teaser: 'Teaser' },
  fr: { overview: 'Présentation', teaser: 'Teaser' },
  es: { overview: 'Presentación', teaser: 'Avance' },
  it: { overview: 'Presentazione', teaser: 'Anteprima' },
  tr: { overview: 'Genel Bakış', teaser: 'Tanıtım' },
  ar: { overview: 'نظرة عامة', teaser: 'عرض تشويقي' },
  zh: { overview: '概览', teaser: '预告片' },
  ja: { overview: '概要', teaser: 'ティーザー' },
  ko: { overview: '소개', teaser: '티저' },
};
