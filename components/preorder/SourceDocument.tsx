import { createElement, type CSSProperties, type ReactNode } from 'react';
import { documentData, sourceText, type DocumentName, type SourceNode } from '@/lib/preorder/content';
import type { Locale } from '@/lib/i18n';

const attributes: Record<string, string> = { novalidate: 'noValidate', class: 'className', for: 'htmlFor', tabindex: 'tabIndex', colspan: 'colSpan', rowspan: 'rowSpan', maxlength: 'maxLength', autocomplete: 'autoComplete', inputmode: 'inputMode', spellcheck: 'spellCheck', autocapitalize: 'autoCapitalize', 'http-equiv': 'httpEquiv' };
const certificateRoutes: Record<string, string> = {
  '/certificates/ECAS-25-12-176846.pdf': '/certificates/uae-conformity.pdf',
  '/certificates/RoHS-25-12-176551.pdf': '/certificates/rohs.pdf',
  '/certificates/TDRA-CVC-339000001.pdf': '/certificates/uae-telecom.pdf',
};
function inlineStyle(value: string): CSSProperties {
  return Object.fromEntries(value.split(';').filter(Boolean).map(declaration => {
    const at = declaration.indexOf(':');
    return [declaration.slice(0, at).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), declaration.slice(at + 1).trim()];
  }));
}

/** Only trusted checked-in template tags/attributes are imported; source scripts are excluded. */
export function SourceDocument({ name, locale, language }: { name: DocumentName; locale: Locale; language: 'en' | 'ru' }) {
  function render(node: SourceNode, key: number): ReactNode {
    if (typeof node === 'string') return sourceText(node, language).replace('RS-2026-00001', 'PREVIEW');
    const props: Record<string, unknown> = { key };
    for (const [attr, value] of Object.entries(node.attrs)) {
      if (attr.startsWith('on')) continue;
      if (attr === 'style') { props.style = inlineStyle(value ?? ''); continue; }
      if (attr === 'checked') { props.defaultChecked = true; continue; }
      if (['disabled', 'required', 'hidden', 'multiple', 'novalidate'].includes(attr)) { props[attributes[attr] ?? attr] = true; continue; }
      if (attr === 'selected') { props.defaultSelected = true; continue; }
      let resolved = value ?? '';
      if (attr === 'href') {
        resolved = certificateRoutes[resolved] ?? resolved.replace(/^\/en(?=\/|$)/, `/${locale}`);
        if (language === 'ru' && name === 'reserve' && resolved === `/${locale}/privacy`) resolved = `/${locale}/privacy-ru`;
      }
      if (['aria-label', 'data-label', 'title'].includes(attr)) resolved = sourceText(resolved, language);
      props[attributes[attr] ?? attr] = resolved;
    }
    // Source copy is a preview, never an issued identifier or a sent invoice.
    let children = node.children.map(render);
    if (language === 'ru' && node.attrs['data-i18n'] === 'footer.privacy') {
      props.href = `/${locale}/privacy`; props.lang = 'en'; children = ['Privacy (EN)'];
    }
    if (node.attrs.id === 'copy-number') children = [sourceText('Copy preview label', language)];
    if (node.attrs.id === 'next-payment-copy') children = [sourceText('Preview only. No invoice has been sent.', language)];
    if (node.attrs.id === 'certificates') children.push(<p key="certificate-note" className="up-legal-small">{sourceText('Links open the original documents. Model coverage and the differing TDRA number in the supplied package still require confirmation.', language)}</p>);
    return createElement(node.tag, props, ...children);
  }
  return <>{documentData[name].children.map(render)}</>;
}
