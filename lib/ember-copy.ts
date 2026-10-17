import type { Locale } from './i18n';

export const emberCopy: Record<Locale, { pause: string; play: string }> = {
  en: { pause: 'Pause Ember Animation', play: 'Play Ember Animation' },
  ru: { pause: 'Приостановить анимацию уголька', play: 'Включить анимацию уголька' },
  de: { pause: 'Glutanimation pausieren', play: 'Glutanimation abspielen' },
  fr: { pause: 'Mettre l’animation de la braise en pause', play: 'Lancer l’animation de la braise' },
  es: { pause: 'Pausar la animación de la brasa', play: 'Reproducir la animación de la brasa' },
  it: { pause: 'Metti in pausa l’animazione della brace', play: 'Avvia l’animazione della brace' },
  tr: { pause: 'Kor animasyonunu duraklat', play: 'Kor animasyonunu oynat' },
  ar: { pause: 'إيقاف حركة الجمرة مؤقتًا', play: 'تشغيل حركة الجمرة' },
  zh: { pause: '暂停炭火动画', play: '播放炭火动画' },
  ja: { pause: '炭火のアニメーションを一時停止', play: '炭火のアニメーションを再生' },
  ko: { pause: '숯불 애니메이션 일시 정지', play: '숯불 애니메이션 재생' },
};
