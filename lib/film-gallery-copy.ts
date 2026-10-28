import type { Locale } from './i18n';

export type GalleryCopy = { title: string; all: string; previous: string; next: string; replay: string; nextUp: string; finished: string; select: string; play: string };
export const galleryCopy: Record<Locale, GalleryCopy> = {
  en: { title: 'UNO Films', all: 'All Films', previous: 'Previous Film', next: 'Next Film', replay: 'Replay', nextUp: 'Next Up', finished: 'Finished', select: 'Select Film', play: 'Play' },
  ru: { title: 'Фильмы UNO', all: 'Все фильмы', previous: 'Предыдущий фильм', next: 'Следующий фильм', replay: 'Повторить', nextUp: 'Далее', finished: 'Завершён', select: 'Выбрать фильм', play: 'Воспроизвести' },
  de: { title: 'UNO Filme', all: 'Alle Filme', previous: 'Vorheriger Film', next: 'Nächster Film', replay: 'Erneut abspielen', nextUp: 'Als Nächstes', finished: 'Beendet', select: 'Film auswählen', play: 'Abspielen' },
  fr: { title: 'Films UNO', all: 'Tous les films', previous: 'Film précédent', next: 'Film suivant', replay: 'Revoir', nextUp: 'À suivre', finished: 'Terminé', select: 'Choisir un film', play: 'Lire' },
  es: { title: 'Películas UNO', all: 'Todas las películas', previous: 'Película anterior', next: 'Siguiente película', replay: 'Repetir', nextUp: 'A continuación', finished: 'Finalizada', select: 'Elegir película', play: 'Reproducir' },
  it: { title: 'Film UNO', all: 'Tutti i film', previous: 'Film precedente', next: 'Film successivo', replay: 'Ripeti', nextUp: 'Prossimo', finished: 'Terminato', select: 'Seleziona film', play: 'Riproduci' },
  tr: { title: 'UNO Filmleri', all: 'Tüm filmler', previous: 'Önceki film', next: 'Sonraki film', replay: 'Tekrar oynat', nextUp: 'Sıradaki', finished: 'Bitti', select: 'Film seç', play: 'Oynat' },
  ar: { title: 'أفلام UNO', all: 'كل الأفلام', previous: 'الفيلم السابق', next: 'الفيلم التالي', replay: 'إعادة التشغيل', nextUp: 'التالي', finished: 'انتهى', select: 'اختر فيلمًا', play: 'تشغيل' },
  zh: { title: 'UNO 影片', all: '所有影片', previous: '上一部影片', next: '下一部影片', replay: '重播', nextUp: '接下来', finished: '已结束', select: '选择影片', play: '播放' },
  ja: { title: 'UNO の動画', all: 'すべての動画', previous: '前の動画', next: '次の動画', replay: 'もう一度見る', nextUp: '次の動画', finished: '終了', select: '動画を選択', play: '再生' },
  ko: { title: 'UNO 영상', all: '모든 영상', previous: '이전 영상', next: '다음 영상', replay: '다시 재생', nextUp: '다음 영상', finished: '종료', select: '영상 선택', play: '재생' },
};
