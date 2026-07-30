'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function ShippingSection() {
  const t = useTranslations('worldwide')

  return (
    <section className="bg-white px-4 py-2 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <div className="grid min-h-[126px] grid-cols-[42%_58%] items-center overflow-hidden rounded-2xl bg-gray-50">
            <div className="flex items-start gap-2 px-5 py-4 sm:gap-4 sm:px-8 sm:py-6">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-ramsider-purple sm:h-8 sm:w-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="min-w-0">
                <h2 className="mb-2 font-display text-xs font-bold tracking-wide sm:text-xl">
                  {t('title')}
                </h2>
                <p
                  className="font-body text-[9px] leading-relaxed text-ramsider-gray sm:text-sm"
                  dangerouslySetInnerHTML={{ __html: t('description') }}
                />
              </div>
            </div>

            <div className="relative h-full min-h-[126px] sm:min-h-[150px]">
              <Image
                src="/images/world-map.png"
                alt="World map showing shipping routes"
                fill
                className="object-fill"
                sizes="(max-width: 768px) 58vw, 430px"
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
