import { getRequestConfig } from 'next-intl/server'
import { locales } from './config'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Ensure valid locale
  if (!locale || !locales.includes(locale as any)) {
    locale = 'en'
  }

  return {
    locale,
    messages: (await import(`@/public/locales/${locale}.json`)).default,
  }
})
