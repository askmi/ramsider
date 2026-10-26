import type { Locale } from './i18n';

export type FilmControlsCopy = {
  play: string; pause: string; mute: string; unmute: string; seek: string;
  fullscreen: string; exitFullscreen: string; pip: string; exitPip: string;
  back: string; unavailable: string; actionError: string; volume: string;
};
type CopyRow = [string, string, string, string, string, string, string, string, string, string, string, string, string];
const rows: Record<Locale, CopyRow> = {
  en: ['Play', 'Pause', 'Mute', 'Unmute', 'Seek', 'Full Screen', 'Exit Full Screen', 'Picture in Picture', 'Exit Picture in Picture', 'Back', 'Unavailable on this device', 'This action is unavailable. Continue watching here.', 'Volume'],
  ru: ['Воспроизвести', 'Пауза', 'Выключить звук', 'Включить звук', 'Перемотка', 'На весь экран', 'Выйти из полного экрана', 'Картинка в картинке', 'Выйти из картинки в картинке', 'Назад', 'Недоступно на этом устройстве', 'Действие недоступно. Продолжайте просмотр здесь.', 'Громкость'],
  de: ['Abspielen', 'Pause', 'Stummschalten', 'Ton einschalten', 'Spulen', 'Vollbild', 'Vollbild beenden', 'Bild im Bild', 'Bild im Bild beenden', 'Zurück', 'Auf diesem Gerät nicht verfügbar', 'Diese Aktion ist nicht verfügbar. Sehen Sie hier weiter.', 'Lautstärke'],
  fr: ['Lire', 'Pause', 'Couper le son', 'Activer le son', 'Avancer ou reculer', 'Plein écran', 'Quitter le plein écran', 'Image dans l’image', 'Quitter l’image dans l’image', 'Retour', 'Indisponible sur cet appareil', 'Cette action est indisponible. Continuez la lecture ici.', 'Volume'],
  es: ['Reproducir', 'Pausa', 'Silenciar', 'Activar sonido', 'Avanzar o retroceder', 'Pantalla completa', 'Salir de pantalla completa', 'Imagen en imagen', 'Salir de imagen en imagen', 'Atrás', 'No disponible en este dispositivo', 'Esta acción no está disponible. Sigue viendo aquí.', 'Volumen'],
  it: ['Riproduci', 'Pausa', 'Disattiva audio', 'Attiva audio', 'Scorri', 'Schermo intero', 'Esci da schermo intero', 'Picture in Picture', 'Esci da Picture in Picture', 'Indietro', 'Non disponibile su questo dispositivo', 'Questa azione non è disponibile. Continua a guardare qui.', 'Volume'],
  tr: ['Oynat', 'Duraklat', 'Sesi kapat', 'Sesi aç', 'İleri veya geri sar', 'Tam ekran', 'Tam ekrandan çık', 'Resim içinde resim', 'Resim içinde resimden çık', 'Geri', 'Bu cihazda kullanılamıyor', 'Bu işlem kullanılamıyor. Buradan izlemeye devam edin.', 'Ses düzeyi'],
  ar: ['تشغيل', 'إيقاف مؤقت', 'كتم الصوت', 'تشغيل الصوت', 'تقديم أو إرجاع', 'ملء الشاشة', 'الخروج من ملء الشاشة', 'صورة داخل صورة', 'الخروج من صورة داخل صورة', 'رجوع', 'غير متاح على هذا الجهاز', 'هذا الإجراء غير متاح. تابع المشاهدة هنا.', 'مستوى الصوت'],
  zh: ['播放', '暂停', '静音', '取消静音', '跳转进度', '全屏', '退出全屏', '画中画', '退出画中画', '返回', '此设备不支持', '此操作不可用。请在此继续观看。', '音量'],
  ja: ['再生', '一時停止', 'ミュート', 'ミュート解除', '再生位置', '全画面表示', '全画面表示を終了', 'ピクチャーインピクチャー', 'ピクチャーインピクチャーを終了', '戻る', 'この端末では利用できません', 'この操作は利用できません。この画面で視聴を続けてください。', '音量'],
  ko: ['재생', '일시 정지', '음소거', '음소거 해제', '재생 위치', '전체 화면', '전체 화면 종료', '화면 속 화면', '화면 속 화면 종료', '뒤로', '이 기기에서는 사용할 수 없습니다', '이 작업을 사용할 수 없습니다. 여기에서 계속 시청하세요.', '음량'],
};
export function filmControlsCopy(locale: Locale): FilmControlsCopy {
  const [play, pause, mute, unmute, seek, fullscreen, exitFullscreen, pip, exitPip, back, unavailable, actionError, volume] = rows[locale];
  return { play, pause, mute, unmute, seek, fullscreen, exitFullscreen, pip, exitPip, back, unavailable, actionError, volume };
}
