import 'server-only';
import documents from './documents.json';
import english from './en.json';
import arabic from './ar.json';
import options from './options.json';
import type { Locale } from '@/lib/i18n';
import type {AccessoryOption} from './types';
export const documentNames = ['reserve','pro','gold','compare','product-info','capsules','terms','returns','privacy','delivery-policy','terms-of-sale','contact','age-gate'] as const;
export type DocumentName = typeof documentNames[number];
export type SourceLanguage = 'en' | 'ar';
export type SourceNode = string | { tag: string; attrs: Record<string, string | null>; children: SourceNode[] };
export type SourcePage = { bodyClass: string; page: string; title: string; titleKey: string; children: SourceNode[] };
export const documentData = documents as unknown as Record<DocumentName, SourcePage>;
export const dictionaries: Record<SourceLanguage, Record<string,string>> = { en: english, ar: arabic };
export const contentLanguage = (locale: Locale): SourceLanguage => locale === 'ar' ? 'ar' : 'en';
export function sourceCopy(key: string, language: SourceLanguage): string { return dictionaries[language][key] ?? dictionaries.en[key] ?? key; }
/** Send only values that actually differ on this page, not every long legal/country translation. */
export function pageTranslations(name: DocumentName) {
  const keys = new Set<string>([documentData[name].titleKey]);
  function visit(node: SourceNode) {
    if (typeof node === 'string') return;
    for (const [key,value] of Object.entries(node.attrs)) if (key.startsWith('data-i18n') && value) keys.add(value);
    node.children.forEach(visit);
  }
  documentData[name].children.forEach(visit);
  if (name === 'reserve') for (const key of Object.keys(dictionaries.en)) if (/^(?:reserve\.|audit\.|options\.)/.test(key)) keys.add(key);
  return Object.fromEntries((['en','ar'] as const).map(language => [language,Object.fromEntries([...keys].filter(key => (name === 'reserve' && /^(?:reserve\.|audit\.|options\.)/.test(key)) || dictionaries.en[key] !== dictionaries.ar[key]).map(key => [key,sourceCopy(key,language)]))])) as Record<SourceLanguage,Record<string,string>>;
}
export const accessoryOptions = options as AccessoryOption[];
