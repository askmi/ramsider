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
    <section className="bg-ramsider-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-20 text-center">
            <h2
              className="font-display text-3xl font-light leading-tight tracking-extra-wide sm:text-4xl lg:text-5xl"
              dangerouslySetInnerHTML={{ __html: t('sectionTitle') }}
            />
            <p className="mx-auto mt-8 max-w-3xl font-body text-sm text-ramsider-gray sm:text-base">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                    <Image
                      src={feature.image}
                      alt={feature.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="mb-6 inline-block rounded-full bg-ramsider-purple px-6 py-2 font-display text-2xl font-bold text-white">
                    {t(`items.${index}.number`)}
                  </div>
                  <h3 className="mb-4 font-display text-3xl font-bold sm:text-4xl">
                    {t(`items.${index}.title`)}
                  </h3>
                  <p className="font-body text-lg text-ramsider-gray">
                    {t(`items.${index}.description`)}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div className="mt-24 rounded-3xl bg-ramsider-black p-12 text-center text-white">
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
