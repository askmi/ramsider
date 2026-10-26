/** Internal source file links become locale URLs; external/mail links remain native. */
const sourceNames: Record<string, string> = { 'product-card': 'product-info', index: 'compare', 'privacy-ru': 'privacy' };
export function documentHref(href: string, locale: string, current: string, language: 'en' | 'ar'): string {
  if (!href || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return href;
  if (href.startsWith('#')) return current === 'terms-of-sale' ? contractHash(href, language) : href;
  const url = new URL(href, 'https://source.invalid/');
  const parts = url.pathname.split('/').filter(Boolean);
  let stem = (parts.at(-1) ?? 'index').replace(/\.html$/, '');
  if (stem === 'index' && parts.length > 1) stem = parts.at(-2)!;
  const name = sourceNames[stem] ?? stem;
  const hash = name === 'terms-of-sale' ? contractHash(url.hash, language) : url.hash;
  return `/${locale}/${name}${url.search}${hash}`;
}
export function contractHash(hash: string, language: 'en' | 'ar'): string {
  if (!hash) return '';
  let value: string;
  try { value = decodeURIComponent(hash.slice(1)).replace(/^ar-/, ''); } catch { return hash; }
  return `#${language === 'ar' ? 'ar-' : ''}${value}`;
}
