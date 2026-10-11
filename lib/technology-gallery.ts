import type { Locale } from './i18n';

// The original eight groups retain their source order.
const technologiesBeforeAirShield = [
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
  { title: 'CapsuleCode', slides: [
    { id: '01', src: '/art/technology/slides/capsule-01.png' },
    { id: '02', src: '/art/technology/slides/capsule-02.png' },
    { id: '03', src: '/art/technology/slides/capsule-03.png' },
  ] },
  { title: 'CyberMind', number: 4, slides: [
    { id: '01', src: '/art/technology/slides/cyber-01.png' },
    { id: '02', src: '/art/technology/slides/cyber-02.png' },
  ] },
  { title: 'TouchLink', number: 5, slides: [
    { id: '01', src: '/art/technology/slides/touch-01.png' },
    { id: '02', src: '/art/technology/slides/touch-02.png' },
    { id: '03', src: '/art/technology/slides/touch-03.png' },
  ] },
  { title: 'MoodEngine', number: 6, slides: [
    { id: '01', src: '/art/technology/slides/mood-01.png' },
    { id: '02', src: '/art/technology/slides/mood-02.png' },
  ] },
  { title: 'AquaSense', number: 7, slides: [
    { id: '01', src: '/art/technology/slides/aqua-01.png' },
    { id: '02', src: '/art/technology/slides/aqua-02.png' },
  ] },
] as const;

const airShield = { title: 'AirShield', number: 8, slides: [
    { id: '01', src: '/art/technology/slides/air-01.png' },
    { id: '02', src: '/art/technology/slides/air-02.png' },
  ] } as const;

export const technologyGroups = [...technologiesBeforeAirShield, airShield,
  {title:'QuickCell',number:9,slides:[
    {id:'01',src:'/art/technology/slides/quick-01.png'},
    {id:'02',src:'/art/technology/slides/quick-02.png'},
  ]},
  {title:'PolyArmor',number:10,slides:[{id:'01',src:'/art/technology/slides/poly-01.png'}]},
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
