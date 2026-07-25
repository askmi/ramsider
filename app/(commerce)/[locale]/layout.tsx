import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, rtlLocales, type Locale } from '@/lib/i18n/config'
import { displayFont, bodyFont } from '@/lib/fonts'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Ramsider UNO | Luxury Electronic Hookah',
  description: 'Redesigned shisha experience. Premium electronic hookah with smart display, water cooling, and precision design.',
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages({ locale })
  const isRTL = rtlLocales.includes(locale as Locale)

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
