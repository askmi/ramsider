'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function TestimonialSection() {
  const t = useTranslations('social')

  return (
    <section className="bg-white px-4 pb-2 pt-0 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <div className="grid min-h-[188px] grid-cols-[55%_45%] overflow-hidden rounded-2xl bg-gray-50">
            <div className="flex min-w-0 flex-col justify-center px-5 py-4 sm:px-8 sm:py-6">
              <h2 className="mb-3 font-display text-sm font-bold tracking-wide sm:text-xl">
                {t('title')}
              </h2>

              <blockquote className="mb-3">
                <p className="font-body text-[10px] italic leading-relaxed text-ramsider-gray sm:text-sm">
                  {t('testimonial')}
                </p>
              </blockquote>

              <div className="mb-2 flex gap-0.5" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, index) => (
                  <svg
                    key={index}
                    className="h-3 w-3 text-ramsider-purple sm:h-4 sm:w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              <p className="font-body text-[9px] text-ramsider-gray sm:text-xs">
                {t('source')}
              </p>
            </div>

            <div className="relative min-h-[188px]">
              <Image
                src="/images/products/uno-light-testimonial.png"
                alt="Ramsider UNO"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 45vw, 340px"
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
