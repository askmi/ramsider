import 'server-only';
import documents from './documents.json';
import russian from './ru-source.json';
import type { Locale } from '@/lib/i18n';

export const documentNames = ['reserve', 'pro', 'gold', 'compare', 'terms', 'returns', 'privacy', 'privacy-ru', 'product-info'] as const;
export type DocumentName = typeof documentNames[number];
export type SourceNode = string | { tag: string; attrs: Record<string, string | null>; children: SourceNode[] };
export const documentData = documents as unknown as Record<DocumentName, { bodyClass: string; children: SourceNode[] }>;
const ru = russian as Record<string, string>;

/** The source itself is the English key schema; translated values never contain markup. */
export function sourceText(value: string, language: string): string {
  const key = value.trim();
  const translated = language === 'ru' ? ru[key] ?? dynamicRu[key] : undefined;
  if (translated) return value.replace(key, translated);
  if (language === 'ru' && /^≈ AED/.test(key)) return value.replace('reference, prices are in USD', 'справочно, цены в USD');
  return value;
}
export function contentLanguage(locale: Locale, name: DocumentName): 'en' | 'ru' {
  if (name === 'privacy-ru') return 'ru';
  // Legal source documents remain exact originals; the Russian Privacy has its own route.
  if (['terms', 'returns', 'privacy'].includes(name)) return 'en';
  return locale === 'ru' ? 'ru' : 'en';
}

export const dynamicCopyKeys = [
  'UNO Pro Line', 'UNO Gold Line', 'Pro Line finish', 'Gold Line finish', 'Tinted reservoir', 'Transparent reservoir',
  'Black braided hose · carbon-fiber mouthpiece', 'White braided hose · titanium mouthpiece',
  'Enter your full name.', 'Enter a valid e-mail address.', 'Select the country of delivery.', 'Please confirm you are 18 or older.',
  'Please accept the pre-order terms and privacy policy.', 'Please check the highlighted fields before reserving.',
  'We will contact you about delivery options', 'Delivery options', 'Invoice', 'Preview only. No invoice has been sent.',
  'Copy preview label', 'Copied', 'Label selected', 'Preview label copied.', 'Select and copy: PREVIEW',
  'Selected model updated. Your set and all prices have been updated.', 'reference, prices are in USD',
] as const;
const dynamicRu: Record<string, string> = {
  'Links open the original documents. Model coverage and the differing TDRA number in the supplied package still require confirmation.': 'Ссылки ведут на оригиналы документов. Охват моделей и расхождение номера TDRA в исходном пакете требуют подтверждения.',
  'Enter your full name.': 'Введите имя и фамилию.', 'Enter a valid e-mail address.': 'Введите корректный адрес почты.',
  'Select the country of delivery.': 'Выберите страну доставки.', 'Please confirm you are 18 or older.': 'Подтвердите, что вам исполнилось 18 лет.',
  'Please accept the pre-order terms and privacy policy.': 'Примите условия предзаказа и политику конфиденциальности.',
  'Please check the highlighted fields before reserving.': 'Проверьте выделенные поля.',
  'Delivery options': 'Варианты доставки', 'Preview only. No invoice has been sent.': 'Только предпросмотр. Счёт не отправлен.',
  'Copy preview label': 'Скопировать обозначение', 'Copied': 'Скопировано', 'Label selected': 'Обозначение выделено',
  'Preview label copied.': 'Обозначение предпросмотра скопировано.', 'Select and copy: PREVIEW': 'Выделите и скопируйте: PREVIEW',
  'Selected model updated. Your set and all prices have been updated.': 'Модель выбрана. Комплект и все цены обновлены.',
  'reference, prices are in USD': 'справочно, цены в USD',
};
export function reservationCopy(language: 'en' | 'ru') {
  return Object.fromEntries(dynamicCopyKeys.map(key => [key, language === 'ru' ? dynamicRu[key] ?? sourceText(key, language) : key]));
}
