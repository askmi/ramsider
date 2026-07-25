import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './lib/i18n/config'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export const config = {
  matcher: ['/', '/(de|fr|es|it|tr|ar|zh|ja|ko|en|ru)/:path*'],
}
