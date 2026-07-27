import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function ProductsSection() {
  const t = useTranslations('products')

  const products = [
    {
      name: 'UNO<br/>PRO',
      price: '999 $',
      image: '/images/products/uno-pro-pure.png',
    },
    {
      name: 'UNO<br/>GOLD',
      price: '2499 $',
      image: '/images/products/uno-gold-pure.png',
    },
  ]

  return (
    <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-8 text-center">
            <h2
              className="font-display text-3xl font-light leading-tight tracking-extra-wide sm:text-4xl lg:text-5xl"
              dangerouslySetInnerHTML={{ __html: t('sectionTitle') }}
            />
            <p className="mt-6 font-body text-base text-ramsider-gray sm:text-lg">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-12 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
          {products.map((product, index) => (
            <ScrollReveal key={index} delay={index * 150}>
              <Card className="group relative overflow-hidden transition-transform duration-300 hover:-translate-y-2">
                {/* Mobile: Horizontal layout, Desktop: Vertical */}
                <div className="grid grid-cols-[35%_65%] gap-4 md:grid-cols-1 md:gap-0">
                  {/* Image - Right on mobile, Top on desktop */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl md:order-first">
                    <div className="absolute inset-0 bg-gradient-radial from-ramsider-purple/20 via-transparent to-transparent opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100" />
                    <Image
                      src={product.image}
                      alt={product.name.replace('<br/>', ' ')}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 65vw, 33vw"
                    />
                  </div>

                  {/* Content - Left on mobile, Bottom on desktop */}
                  <div className="flex flex-col justify-center space-y-3 text-left md:mt-6 md:space-y-4 md:text-center">
                    <h3
                      className="font-display text-xl font-light leading-tight tracking-wide md:text-2xl lg:text-3xl"
                      dangerouslySetInnerHTML={{ __html: product.name }}
                    />
                    <div className="h-px w-8 bg-ramsider-purple md:hidden" />
                    <p className="font-body text-2xl font-normal md:text-3xl">{product.price}</p>
                    <Button variant="primary" className="w-full text-sm md:text-base">
                      {t('versions.0.cta')}
                    </Button>
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {/* Trust Badges */}
        <ScrollReveal delay={500}>
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-ramsider-border pt-6 sm:gap-8">
            <div className="flex flex-col items-center space-y-2 text-center sm:space-y-3">
              <svg className="h-8 w-8 text-ramsider-purple sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p
                className="font-body text-[10px] font-semibold tracking-wider sm:text-xs sm:tracking-widest"
                dangerouslySetInnerHTML={{ __html: t('trustBadges.secure') }}
              />
            </div>
            <div className="flex flex-col items-center space-y-2 text-center sm:space-y-3">
              <svg className="h-8 w-8 text-ramsider-purple sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p
                className="font-body text-[10px] font-semibold tracking-wider sm:text-xs sm:tracking-widest"
                dangerouslySetInnerHTML={{ __html: t('trustBadges.warranty') }}
              />
            </div>
            <div className="flex flex-col items-center space-y-2 text-center sm:space-y-3">
              <svg className="h-8 w-8 text-ramsider-purple sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p
                className="font-body text-[10px] font-semibold tracking-wider sm:text-xs sm:tracking-widest"
                dangerouslySetInnerHTML={{ __html: t('trustBadges.returns') }}
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
