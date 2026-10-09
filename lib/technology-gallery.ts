import type { Locale } from './i18n';

export const technologyGroups = [
  { title: 'NobleCraft', slides: [
    { id: '01', src: '/art/technology/slides/noble-01.png' },
    { id: '02', src: '/art/technology/slides/noble-02.png' },
  ] },
  { title: 'HeatCore', slides: [
    { id: '02', src: '/art/technology/slides/heat-02.png' },
    { id: '03', src: '/art/technology/slides/heat-03.png' },
    { id: '04', src: '/art/technology/slides/heat-04.png' },
    { id: '05', src: '/art/technology/slides/heat-05.png' },
  ] },
] as const;

type GroupCopy = { previous: string };
export const technologyGroupCopy: Record<Locale, GroupCopy> = {
  en: { previous: 'Previous technology' },
  ru: { previous: 'Предыдущая технология' },
  de: { previous: 'Vorherige Technologie' },
  fr: { previous: 'Technologie précédente' },
  es: { previous: 'Tecnología anterior' },
  it: { previous: 'Tecnologia precedente' },
  tr: { previous: 'Önceki teknoloji' },
  ar: { previous: 'التقنية السابقة' },
  zh: { previous: '上一项技术' },
  ja: { previous: '前の技術' },
  ko: { previous: '이전 기술' },
};
