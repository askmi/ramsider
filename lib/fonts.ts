import { Work_Sans, Inter } from 'next/font/google'

export const displayFont = Work_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

export const bodyFont = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})
