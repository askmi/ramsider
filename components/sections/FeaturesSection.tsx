import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function FeaturesSection() {
  const t = useTranslations('features')

  const features = [
    { image: '/images/products/feature-display.png', alt: 'Smart Display' },
    { image: '/images/products/feature-water.png', alt: 'Water Cooling' },
    {
      image: '/images/products/feature-materials.png',
      alt: 'Premium Materials',
    },
    { image: '/images/products/feature-design.png', alt: 'Precision Design' },
  ]

  return (
    <section className="bg-ramsider-white px-4 py-3 sm:py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-10 text-center sm:mb-12">
            <h2
              className="mx-auto max-w-[520px] font-display text-[28px] font-light leading-[1.4] tracking-extra-wide sm:text-4xl lg:max-w-none lg:text-5xl"
              dangerouslySetInnerHTML={{ __html: t('sectionTitle') }}
            />
            <p className="mx-auto mt-6 max-w-[255px] font-body text-sm leading-[1.65] text-ramsider-gray sm:mt-8 sm:max-w-3xl sm:text-base">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-8 lg:space-y-12">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="grid grid-cols-[54%_1fr] items-center gap-8 lg:grid-cols-2 lg:gap-16">
                {/* Mobile: Compact image on the left, Desktop: Alternate sides */}
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className="relative aspect-[3/2] overflow-hidden rounded-xl lg:aspect-[4/3] lg:rounded-3xl">
                    <Image
                      src={feature.image}
                      alt={feature.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 54vw, 50vw"
                    />
                  </div>
                </div>
                {/* Mobile: Text on the right, Desktop: Standard layout */}
                <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                  <div className="mb-1 font-display text-xs font-bold text-ramsider-purple lg:mb-6 lg:inline-block lg:rounded-full lg:bg-ramsider-purple lg:px-6 lg:py-2 lg:text-2xl lg:text-white">
                    {t(`items.${index}.number`)}
                  </div>
                  <h3 className="mb-1 font-display text-sm font-bold sm:text-base lg:mb-4 lg:text-3xl xl:text-4xl">
                    {t(`items.${index}.title`)}
                  </h3>
                  <p className="font-body text-[10px] leading-relaxed text-ramsider-gray sm:text-xs lg:text-lg">
                    {t(`items.${index}.description`)}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
