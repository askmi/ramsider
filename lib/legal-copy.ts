import type { Locale } from './i18n';

export const legalDocuments = ['privacy', 'terms', 'delivery'] as const;
export type LegalDocument = typeof legalDocuments[number];
type LegalCopy = Record<LegalDocument, string> & { documents: string; english: string };

/** Document text is approved in English only; localized labels identify that language. */
export const legalCopy: Record<Locale, LegalCopy> = {
  en: { english: 'English', documents: 'Documents', privacy: 'Privacy Policy', terms: 'Terms of Sale', delivery: 'Delivery Policy' },
  ru: { english: 'Английский', documents: 'Документы', privacy: 'Политика конфиденциальности', terms: 'Условия продажи', delivery: 'Условия доставки' },
  de: { english: 'Englisch', documents: 'Dokumente', privacy: 'Datenschutzerklärung', terms: 'Verkaufsbedingungen', delivery: 'Lieferbedingungen' },
  fr: { english: 'Anglais', documents: 'Documents', privacy: 'Politique de confidentialité', terms: 'Conditions de vente', delivery: 'Politique de livraison' },
  es: { english: 'Inglés', documents: 'Documentos', privacy: 'Política de privacidad', terms: 'Condiciones de venta', delivery: 'Política de entrega' },
  it: { english: 'Inglese', documents: 'Documenti', privacy: 'Informativa sulla privacy', terms: 'Condizioni di vendita', delivery: 'Condizioni di consegna' },
  tr: { english: 'İngilizce', documents: 'Belgeler', privacy: 'Gizlilik Politikası', terms: 'Satış Koşulları', delivery: 'Teslimat Politikası' },
  ar: { english: 'الإنجليزية', documents: 'المستندات', privacy: 'سياسة الخصوصية', terms: 'شروط وأحكام البيع', delivery: 'سياسة التوصيل' },
  zh: { english: '英语', documents: '文件', privacy: '隐私政策', terms: '销售条款', delivery: '配送政策' },
  ja: { english: '英語', documents: '各種規約', privacy: 'プライバシーポリシー', terms: '販売条件', delivery: '配送ポリシー' },
  ko: { english: '영어', documents: '문서', privacy: '개인정보 처리방침', terms: '판매 약관', delivery: '배송 정책' },
};

export function legalHref(document: LegalDocument) {
  return `/en/${document}`;
}
