import type { Locale } from './i18n';

// The original eight groups retain their source order.
const technologiesBeforeAirShield = [
  { title: 'NobleCraft', slides: [
    { id: '01', src: '/art/technology/slides/noble-01.webp' },
    { id: '02', src: '/art/technology/slides/noble-02.webp' },
  ] },
  { title: 'HeatCore', slides: [
    { id: '02', src: '/art/technology/slides/heat-02.webp' },
    { id: '03', src: '/art/technology/slides/heat-03.webp' },
    { id: '04', src: '/art/technology/slides/heat-04.webp' },
    { id: '05', src: '/art/technology/slides/heat-05.webp' },
  ] },
  { title: 'CapsuleCode', slides: [
    { id: '01', src: '/art/technology/slides/capsule-01.webp' },
    { id: '02', src: '/art/technology/slides/capsule-02.webp' },
    { id: '03', src: '/art/technology/slides/capsule-03.webp' },
  ] },
  { title: 'CyberMind', number: 4, slides: [
    { id: '01', src: '/art/technology/slides/cyber-01.webp' },
    { id: '02', src: '/art/technology/slides/cyber-02.webp' },
  ] },
  { title: 'TouchLink', number: 5, slides: [
    { id: '01', src: '/art/technology/slides/touch-01.webp' },
    { id: '02', src: '/art/technology/slides/touch-02.webp' },
    { id: '03', src: '/art/technology/slides/touch-03.webp' },
  ] },
  { title: 'MoodEngine', number: 6, slides: [
    { id: '01', src: '/art/technology/slides/mood-01.webp' },
    { id: '02', src: '/art/technology/slides/mood-02.webp' },
  ] },
  { title: 'AquaSense', number: 7, slides: [
    { id: '01', src: '/art/technology/slides/aqua-01.webp' },
    { id: '02', src: '/art/technology/slides/aqua-02.webp' },
  ] },
] as const;

const airShield = { title: 'AirShield', number: 8, slides: [
    { id: '01', src: '/art/technology/slides/air-01.webp' },
    { id: '02', src: '/art/technology/slides/air-02.webp' },
  ] } as const;

export const technologyGroups = [...technologiesBeforeAirShield, airShield,
  {title:'QuickCell',number:9,slides:[
    {id:'01',src:'/art/technology/slides/quick-01.webp'},
    {id:'02',src:'/art/technology/slides/quick-02.webp'},
  ]},
  {title:'PolyArmor',number:10,slides:[{id:'01',src:'/art/technology/slides/poly-01.webp'}]},
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
