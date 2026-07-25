'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LanguageSelector } from '@/components/ui/LanguageSelector'
import { type Locale, locales, localeFlags } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

interface HeaderProps {
  currentLocale: Locale
}

export function Header({ currentLocale }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-ramsider-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href={`/${currentLocale}`} className="font-display text-2xl font-light tracking-extra-wide">
            RAMSIDER
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 md:flex">
            <LanguageSelector currentLocale={currentLocale} />
            <button
              className="flex flex-col gap-1.5"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className="h-0.5 w-6 bg-ramsider-black transition-all" />
              <span className="h-0.5 w-6 bg-ramsider-black transition-all" />
              <span className="h-0.5 w-6 bg-ramsider-black transition-all" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 md:hidden">
            <LanguageSelector currentLocale={currentLocale} />
            <button
              className="flex flex-col gap-1.5"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span className="h-0.5 w-6 bg-ramsider-black transition-all" />
              <span className="h-0.5 w-6 bg-ramsider-black transition-all" />
              <span className="h-0.5 w-6 bg-ramsider-black transition-all" />
            </button>
          </div>
        </div>

        {/* Language Bar - Mobile: Flags only, Desktop: Flags + Labels */}
        <div className="border-t border-ramsider-border py-3">
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {locales.map((locale) => (
              <Link
                key={locale}
                href={`/${locale}`}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-ramsider-purple/10 sm:px-3',
                  locale === currentLocale && 'bg-ramsider-purple/5'
                )}
              >
                <span className="text-lg sm:text-xl">{localeFlags[locale]}</span>
                <span className="hidden uppercase lg:inline">{locale}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
