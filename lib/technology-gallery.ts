import type { Locale } from './i18n';

export const technologyGroups = [
  { title: 'HeatCore', slides: [
    { id: '02', src: '/art/technology/02.png' },
    { id: '03', src: '/art/technology/03.png' },
    { id: '04', src: '/art/technology/04.png' },
    { id: '05', src: '/art/technology/05.png' },
  ] },
  { title: 'CyberMind', slides: [
    { id: '01', src: '/art/technology/cybermind/01.png' },
    { id: '02', src: '/art/technology/cybermind/02.png' },
  ] },
] as const;

type GroupCopy = { names: readonly [string, string]; previous: string };
export const technologyGroupCopy: Record<Locale, GroupCopy> = {
  en: { names: ['CyberMind core', 'Connected system'], previous: 'Previous technology' },
  ru: { names: ['Ядро CyberMind', 'Подключённая система'], previous: 'Предыдущая технология' },
  de: { names: ['CyberMind-Kern', 'Vernetztes System'], previous: 'Vorherige Technologie' },
  fr: { names: ['Cœur CyberMind', 'Système connecté'], previous: 'Technologie précédente' },
  es: { names: ['Núcleo CyberMind', 'Sistema conectado'], previous: 'Tecnología anterior' },
  it: { names: ['Nucleo CyberMind', 'Sistema connesso'], previous: 'Tecnologia precedente' },
  tr: { names: ['CyberMind çekirdeği', 'Bağlantılı sistem'], previous: 'Önceki teknoloji' },
  ar: { names: ['نواة CyberMind', 'النظام المتصل'], previous: 'التقنية السابقة' },
  zh: { names: ['CyberMind 核心', '互联系统'], previous: '上一项技术' },
  ja: { names: ['CyberMindコア', '接続されたシステム'], previous: '前の技術' },
  ko: { names: ['CyberMind 코어', '연결된 시스템'], previous: '이전 기술' },
};
