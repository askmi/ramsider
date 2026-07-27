import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function FeaturesSection() {
  const t = useTranslations('features')

  const features = [
    { image: '/images/products/feature-display.png', alt: 'Smart Display' },
    { image: '/images/products/feature-water.png', alt: 'Water Cooling' },
    { image: '/images/products/feature-materials.png', alt: 'Premium Materials' },
    { image: '/images/products/feature-design.png', alt: 'Precision Design' },
  ]

  return (
    <section className="bg-ramsider-white px-4 py-3 sm:py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2
              className="font-display text-3xl font-light leading-tight tracking-extra-wide sm:text-4xl lg:text-5xl"
              dangerouslySetInnerHTML={{ __html: t('sectionTitle') }}
            />
            <p className="mx-auto mt-8 max-w-3xl font-body text-sm text-ramsider-gray sm:text-base">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-8 lg:space-y-12">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-16 lg:items-center">
                {/* Mobile: Image always first, Desktop: Alternate sides */}
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:rounded-3xl">
                    <Image
                      src={feature.image}
                      alt={feature.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
                {/* Mobile: Text with number badge on the right, Desktop: Standard layout */}
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="flex items-start gap-4 lg:block">
                    <div className="flex-1 lg:mb-6">
                      <h3 className="mb-2 font-display text-xl font-bold sm:text-2xl lg:mb-4 lg:text-3xl xl:text-4xl">
                        {t(`items.${index}.title`)}
                      </h3>
                      <p className="font-body text-sm text-ramsider-gray sm:text-base lg:text-lg">
                        {t(`items.${index}.description`)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 rounded-full bg-ramsider-purple px-4 py-1 font-display text-lg font-bold text-white lg:inline-block lg:px-6 lg:py-2 lg:text-2xl">
                      {t(`items.${index}.number`)}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div className="mt-12 rounded-3xl bg-ramsider-black p-8 sm:p-12 text-center text-white">
            <h3
              className="mb-4 font-display text-3xl font-bold sm:text-4xl lg:text-5xl"
              dangerouslySetInnerHTML={{ __html: t('cta.title') }}
            />
            <p className="mb-8 font-body text-lg text-ramsider-gray">
              {t('cta.subtitle')}
            </p>
            <Button variant="primary" className="bg-white text-ramsider-black hover:bg-ramsider-purple hover:text-white">
              {t('cta.button')}
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
