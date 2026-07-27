import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ramsider-white to-white px-4 py-2 sm:py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-2 lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Left: Content */}
          <div className="space-y-1.5 sm:space-y-3">
            <ScrollReveal delay={0}>
              <h1
                className="font-display text-2xl font-light leading-none tracking-extra-wide sm:text-4xl lg:text-6xl xl:text-7xl"
                dangerouslySetInnerHTML={{ __html: t('productName') }}
              />
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h2 className="font-body text-sm font-normal tracking-wide text-ramsider-gray sm:text-base lg:text-lg">
                {t('tagline')}
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p
                className="font-body text-xs font-normal leading-snug sm:text-sm lg:text-base"
                dangerouslySetInnerHTML={{ __html: t('description') }}
              />
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-body text-[10px] font-semibold tracking-widest text-ramsider-gray">
                    {t('priceFrom')}
                  </span>
                  <span className="font-display text-2xl font-bold sm:text-3xl">
                    {t('price')}
                  </span>
                </div>
                <p className="font-body text-[10px] font-medium tracking-wide text-ramsider-gray">
                  {t('shipping')}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex flex-col gap-2">
                <Button variant="primary" className="w-full py-2 text-xs sm:w-auto sm:py-3 sm:text-sm">
                  {t('cta.preOrder')}
                </Button>
                <Button variant="secondary" className="w-full py-2 text-xs sm:w-auto sm:py-3 sm:text-sm">
                  {t('cta.business')}
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <button className="group flex items-center gap-1.5 font-body text-[10px] font-semibold tracking-wider transition-colors hover:text-ramsider-purple">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ramsider-black transition-colors group-hover:border-ramsider-purple">
                  <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {t('cta.watchVideo')}
              </button>
            </ScrollReveal>
          </div>

          {/* Right: Product Image */}
          <ScrollReveal delay={200} className="relative">
            <div className="relative aspect-[3/4] w-full max-h-[200px] sm:max-h-[400px] lg:max-h-none">
              <div className="absolute inset-0 bg-gradient-radial from-ramsider-purple-glow/20 via-transparent to-transparent blur-3xl" />
              <Image
                src="/images/products/uno-light-hero-pure.png"
                alt="Ramsider UNO Luxury Electronic Hookah"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
