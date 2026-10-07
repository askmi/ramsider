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

type GroupCopy = { names: readonly [string, string]; previous: string; up: string };
export const technologyGroupCopy: Record<Locale, GroupCopy> = {
  en: { names: ['CyberMind core', 'Connected system'], previous: 'Previous technology', up: 'Swipe up for the previous technology' },
  ru: { names: ['Ядро CyberMind', 'Подключённая система'], previous: 'Предыдущая технология', up: 'Свайп вверх — предыдущая технология' },
  de: { names: ['CyberMind-Kern', 'Vernetztes System'], previous: 'Vorherige Technologie', up: 'Für die vorherige Technologie nach oben wischen' },
  fr: { names: ['Cœur CyberMind', 'Système connecté'], previous: 'Technologie précédente', up: 'Balayez vers le haut pour la technologie précédente' },
  es: { names: ['Núcleo CyberMind', 'Sistema conectado'], previous: 'Tecnología anterior', up: 'Desliza arriba para la tecnología anterior' },
  it: { names: ['Nucleo CyberMind', 'Sistema connesso'], previous: 'Tecnologia precedente', up: 'Scorri su per la tecnologia precedente' },
  tr: { names: ['CyberMind çekirdeği', 'Bağlantılı sistem'], previous: 'Önceki teknoloji', up: 'Önceki teknoloji için yukarı kaydırın' },
  ar: { names: ['نواة CyberMind', 'النظام المتصل'], previous: 'التقنية السابقة', up: 'اسحب للأعلى للانتقال إلى التقنية السابقة' },
  zh: { names: ['CyberMind 核心', '互联系统'], previous: '上一项技术', up: '向上滑动查看上一项技术' },
  ja: { names: ['CyberMindコア', '接続されたシステム'], previous: '前の技術', up: '上にスワイプして前の技術を見る' },
  ko: { names: ['CyberMind 코어', '연결된 시스템'], previous: '이전 기술', up: '위로 스와이프하여 이전 기술 보기' },
};
