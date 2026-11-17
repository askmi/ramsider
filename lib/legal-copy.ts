import type { Locale } from './i18n';

export const legalDocuments = ['privacy', 'terms', 'delivery'] as const;
export type LegalDocument = typeof legalDocuments[number];
type LegalCopy = Record<LegalDocument, string> & { documents: string };

/** Document text is approved in English only; localized labels identify that language. */
export const legalCopy: Record<Locale, LegalCopy> = {
  en: { documents: 'Documents', privacy: 'Privacy Policy', terms: 'Terms and Conditions of Sale', delivery: 'Delivery Policy' },
  ru: { documents: 'Документы', privacy: 'Политика конфиденциальности', terms: 'Условия продажи', delivery: 'Условия доставки' },
  de: { documents: 'Dokumente', privacy: 'Datenschutzerklärung', terms: 'Verkaufsbedingungen', delivery: 'Lieferbedingungen' },
  fr: { documents: 'Documents', privacy: 'Politique de confidentialité', terms: 'Conditions de vente', delivery: 'Politique de livraison' },
  es: { documents: 'Documentos', privacy: 'Política de privacidad', terms: 'Condiciones de venta', delivery: 'Política de entrega' },
  it: { documents: 'Documenti', privacy: 'Informativa sulla privacy', terms: 'Condizioni di vendita', delivery: 'Condizioni di consegna' },
  tr: { documents: 'Belgeler', privacy: 'Gizlilik Politikası', terms: 'Satış Koşulları', delivery: 'Teslimat Politikası' },
  ar: { documents: 'المستندات', privacy: 'سياسة الخصوصية', terms: 'شروط وأحكام البيع', delivery: 'سياسة التوصيل' },
  zh: { documents: '文件', privacy: '隐私政策', terms: '销售条款', delivery: '配送政策' },
  ja: { documents: '各種規約', privacy: 'プライバシーポリシー', terms: '販売条件', delivery: '配送ポリシー' },
  ko: { documents: '문서', privacy: '개인정보 처리방침', terms: '판매 약관', delivery: '배송 정책' },
};

export function legalHref(document: LegalDocument) {
  return `/en/${document}`;
}
