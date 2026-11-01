import type { Locale } from './i18n';

export const projectFilmCopy: Record<Locale, { overview: string; teaser: string; shortFilm: string }> = {
  en: { overview: 'Overview', teaser: 'Teaser', shortFilm: 'Short Film' },
  ru: { overview: 'Обзор', teaser: 'Тизер', shortFilm: 'Короткий фильм' },
  de: { overview: 'Überblick', teaser: 'Teaser', shortFilm: 'Kurzfilm' },
  fr: { overview: 'Présentation', teaser: 'Teaser', shortFilm: 'Court métrage' },
  es: { overview: 'Presentación', teaser: 'Avance', shortFilm: 'Cortometraje' },
  it: { overview: 'Presentazione', teaser: 'Anteprima', shortFilm: 'Cortometraggio' },
  tr: { overview: 'Genel Bakış', teaser: 'Tanıtım', shortFilm: 'Kısa Film' },
  ar: { overview: 'نظرة عامة', teaser: 'عرض تشويقي', shortFilm: 'فيلم قصير' },
  zh: { overview: '概览', teaser: '预告片', shortFilm: '短片' },
  ja: { overview: '概要', teaser: 'ティーザー', shortFilm: 'ショートフィルム' },
  ko: { overview: '소개', teaser: '티저', shortFilm: '단편 영상' },
};
