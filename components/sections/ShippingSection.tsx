'use client'

import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import Image from 'next/image'

export function ShippingSection() {
  const t = useTranslations('worldwide')

  return (
    <section className="bg-white px-4 py-3 sm:py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Content */}
            <div>
              <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {t('title')}
              </h2>

              <div className="flex items-start gap-4">
                <svg
                  className="w-8 h-8 text-ramsider-purple flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p
                  className="font-body text-lg text-ramsider-gray sm:text-xl"
                  dangerouslySetInnerHTML={{ __html: t('description') }}
                />
              </div>
            </div>

            {/* Right: World Map */}
            <div className="relative">
              <Image
                src="/images/world-map.png"
                alt="World map showing shipping routes"
                width={800}
                height={400}
                className="w-full h-auto"
                priority={false}
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
