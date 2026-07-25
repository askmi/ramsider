import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function HeroSection() {
  const t = useTranslations('hero')

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-ramsider-white to-white px-4 pb-12 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="space-y-8">
            <ScrollReveal delay={0}>
              <h1
                className="font-display text-7xl font-light leading-none tracking-extra-wide sm:text-8xl lg:text-9xl"
                dangerouslySetInnerHTML={{ __html: t('productName') }}
              />
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h2 className="font-body text-lg font-normal tracking-wide text-ramsider-gray sm:text-xl">
                {t('tagline')}
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p
                className="font-body text-base font-normal leading-relaxed sm:text-lg"
                dangerouslySetInnerHTML={{ __html: t('description') }}
              />
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-body text-sm font-semibold tracking-widest text-ramsider-gray">
                    {t('priceFrom')}
                  </span>
                  <span className="font-display text-5xl font-bold">
                    {t('price')}
                  </span>
                </div>
                <p className="font-body text-sm font-medium tracking-wide text-ramsider-gray">
                  {t('shipping')}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button variant="primary">
                  {t('cta.preOrder')}
                </Button>
                <Button variant="secondary">
                  {t('cta.business')}
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <button className="group flex items-center gap-2 font-body text-sm font-semibold tracking-wider transition-colors hover:text-ramsider-purple">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ramsider-black transition-colors group-hover:border-ramsider-purple">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                {t('cta.watchVideo')}
              </button>
            </ScrollReveal>
          </div>

          {/* Right: Product Image */}
          <ScrollReveal delay={200} className="relative">
            <div className="relative aspect-[3/4] w-full">
              <div className="absolute inset-0 bg-gradient-radial from-ramsider-purple-glow/20 via-transparent to-transparent blur-3xl" />
              <Image
                src="/images/products/uno-light-hero-pure.png"
                alt="Ramsider UNO Luxury Electronic Hookah"
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
