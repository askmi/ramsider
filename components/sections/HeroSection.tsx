import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ramsider-white to-white px-4 py-3 sm:px-8 sm:py-6 lg:px-12 lg:py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-[2fr_3fr] items-center gap-2 sm:grid-cols-2 sm:gap-8 lg:gap-12">
          {/* Left: Content */}
          <div className="order-first space-y-1.5 pr-2 sm:space-y-3 sm:pr-4 lg:space-y-4 lg:pr-8">
            <ScrollReveal delay={0}>
              <h1
                className="font-display text-3xl font-light leading-none tracking-extra-wide sm:text-6xl sm:leading-[0.85] lg:text-7xl xl:text-8xl"
                dangerouslySetInnerHTML={{ __html: t('productName') }}
              />
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h2 className="font-body text-[10px] font-normal tracking-wide text-ramsider-gray sm:text-sm lg:text-base">
                {t('tagline')}
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p
                className="max-w-sm font-body text-[9px] font-normal leading-snug sm:text-xs lg:text-sm"
                dangerouslySetInnerHTML={{ __html: t('description') }}
              />
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="space-y-0.5 pt-0.5 sm:pt-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-body text-[7px] font-semibold tracking-widest text-ramsider-gray uppercase sm:text-[10px]">
                    {t('priceFrom')}
                  </span>
                  <span className="font-display text-xl font-normal sm:text-3xl lg:text-4xl">
                    {t('price')}
                  </span>
                </div>
                <p className="font-body text-[7px] font-medium tracking-wide text-ramsider-gray sm:text-[10px]">
                  {t('shipping')}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex max-w-[240px] flex-col gap-1 pt-1 sm:max-w-xs sm:gap-2 sm:pt-3">
                <Button variant="primary" className="w-full py-1.5 text-[8px] font-semibold sm:py-3 sm:text-xs lg:text-sm">
                  {t('cta.preOrder')}
                </Button>
                <Button variant="secondary" className="w-full py-1.5 text-[8px] font-semibold sm:py-3 sm:text-xs lg:text-sm">
                  {t('cta.business')}
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <button className="group flex items-center gap-1 whitespace-nowrap pt-0.5 font-body text-[8px] font-semibold tracking-wider transition-colors hover:text-ramsider-purple sm:gap-1.5 sm:pt-2 sm:text-[11px]">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-ramsider-black transition-colors group-hover:border-ramsider-purple sm:h-8 sm:w-8">
                  <svg className="h-2 w-2 sm:h-3 sm:w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {t('cta.watchVideo')}
              </button>
            </ScrollReveal>
          </div>

          {/* Right: Product Image */}
          <ScrollReveal delay={200} className="relative order-last">
            <div className="relative h-[420px] w-full -translate-y-3 translate-x-[3px] sm:h-[480px] sm:translate-x-8 lg:h-[600px] lg:translate-x-12 xl:h-[700px]">
              <div className="absolute inset-0 bg-gradient-radial from-ramsider-purple-glow/20 via-transparent to-transparent blur-3xl" />
              <Image
                src="/images/products/uno-light-hero-pure.png"
                alt="Ramsider UNO Luxury Electronic Hookah"
                fill
                priority
                className="object-contain object-right"
                sizes="(max-width: 639px) 40vw, 50vw"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
