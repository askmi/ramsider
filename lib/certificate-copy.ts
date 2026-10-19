import type { Locale } from './i18n';

export type CertificateCopy = { loading: string; failed: string; retry: string; original: string; previous: string; next: string; page: string; zoom: string; rotate: string; text: string; debug: string };
const entries: Record<Locale, readonly string[]> = {
 en: ['Loading Document…', 'The document could not load.', 'Retry', 'Open Original PDF', 'Previous Page', 'Next Page', 'Page', 'Zoom', 'Rotate Page', 'Document Text'],
 ru: ['Загрузка документа…', 'Не удалось загрузить документ.', 'Повторить', 'Открыть оригинал PDF', 'Предыдущая страница', 'Следующая страница', 'Страница', 'Масштаб', 'Повернуть страницу', 'Текст документа'],
 de: ['Dokument wird geladen…', 'Das Dokument konnte nicht geladen werden.', 'Erneut versuchen', 'Original-PDF öffnen', 'Vorherige Seite', 'Nächste Seite', 'Seite', 'Zoom', 'Seite drehen', 'Dokumenttext'],
 fr: ['Chargement du document…', 'Impossible de charger le document.', 'Réessayer', 'Ouvrir le PDF original', 'Page précédente', 'Page suivante', 'Page', 'Zoom', 'Faire pivoter la page', 'Texte du document'],
 es: ['Cargando documento…', 'No se pudo cargar el documento.', 'Reintentar', 'Abrir PDF original', 'Página anterior', 'Página siguiente', 'Página', 'Zoom', 'Girar página', 'Texto del documento'],
 it: ['Caricamento documento…', 'Impossibile caricare il documento.', 'Riprova', 'Apri PDF originale', 'Pagina precedente', 'Pagina successiva', 'Pagina', 'Zoom', 'Ruota pagina', 'Testo del documento'],
 tr: ['Belge yükleniyor…', 'Belge yüklenemedi.', 'Tekrar dene', 'Orijinal PDF’yi aç', 'Önceki sayfa', 'Sonraki sayfa', 'Sayfa', 'Yakınlaştır', 'Sayfayı döndür', 'Belge metni'],
 ar: ['جارٍ تحميل المستند…', 'تعذّر تحميل المستند.', 'إعادة المحاولة', 'فتح ملف PDF الأصلي', 'الصفحة السابقة', 'الصفحة التالية', 'الصفحة', 'التكبير', 'تدوير الصفحة', 'نص المستند'],
 zh: ['正在加载文档…', '文档加载失败。', '重试', '打开原始 PDF', '上一页', '下一页', '页', '缩放', '旋转页面', '文档文本'],
 ja: ['文書を読み込み中…', '文書を読み込めませんでした。', '再試行', '元のPDFを開く', '前のページ', '次のページ', 'ページ', 'ズーム', 'ページを回転', '文書のテキスト'],
 ko: ['문서 로딩 중…', '문서를 불러올 수 없습니다.', '다시 시도', '원본 PDF 열기', '이전 페이지', '다음 페이지', '페이지', '확대', '페이지 회전', '문서 텍스트'],
};
export function certificateCopy(locale: Locale): CertificateCopy {
 const [loading, failed, retry, original, previous, next, page, zoom, rotate, text] = entries[locale];
 const debug: Record<Locale,string> = {en:'DEBUG · Temporary Diagnostics',ru:'DEBUG · Временная диагностика',de:'DEBUG · Temporäre Diagnose',fr:'DEBUG · Diagnostic temporaire',es:'DEBUG · Diagnóstico temporal',it:'DEBUG · Diagnostica temporanea',tr:'DEBUG · Geçici tanılama',ar:'DEBUG · تشخيص مؤقت',zh:'DEBUG · 临时诊断',ja:'DEBUG · 一時的な診断',ko:'DEBUG · 임시 진단'};
 return {loading, failed, retry, original, previous, next, page, zoom, rotate, text, debug:debug[locale]};
}
