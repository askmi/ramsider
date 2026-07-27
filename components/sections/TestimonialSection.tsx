'use client'

import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import Image from 'next/image'

export function TestimonialSection() {
  const t = useTranslations('social')

  return (
    <section className="bg-gray-50 px-4 py-3 sm:py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left: Testimonial Content */}
            <div>
              <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {t('title')}
              </h2>

              <blockquote className="mb-8">
                <p className="font-body text-lg text-ramsider-gray leading-relaxed sm:text-xl italic">
                  {t('testimonial')}
                </p>
              </blockquote>

              {/* 5 Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-6 h-6 text-ramsider-purple"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>

              <p className="font-body text-sm text-ramsider-gray sm:text-base">
                {t('source')}
              </p>
            </div>

            {/* Right: Product Image */}
            <div className="relative">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/products/uno-light-hero-pure.png"
                  alt="Ramsider UNO"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={false}
                />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
