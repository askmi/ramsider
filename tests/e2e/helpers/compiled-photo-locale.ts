import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const installed = new WeakMap<Page, Set<string>>();

// Production presentation redirects to English. These local-only fixtures
// exercise the translated HTML that the production build still compiles.
export async function compiledPhotoLocale(page: Page, locale: string) {
  if (locale === 'en') return;
  const host = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:3000').hostname;
  if (!['127.0.0.1', 'localhost'].includes(host)) {
    throw new Error('Compiled photo locale fixtures are only valid on a local production build.');
  }
  if (!/^(ru|de|fr|es|it|tr|ar|zh|ja|ko)$/.test(locale)) throw new Error('Unknown photo locale.');
  const locales = installed.get(page) ?? new Set<string>();
  if (locales.has(locale)) return;
  const html = await readFile(`.next/server/app/${locale}.html`, 'utf8');
  await page.route(url => url.pathname === `/${locale}` && !url.search, route =>
    route.fulfill({ status: 200, contentType: 'text/html', body: html }));
  locales.add(locale);
  installed.set(page, locales);
}
