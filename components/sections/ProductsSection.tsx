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
      image: '/images/products/uno-gold-card.png',
    },
  ]

  return (
    <section className="bg-white px-4 pb-3 pt-8 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-8 text-center">
            <h2
              className="whitespace-nowrap font-display text-xl font-light leading-tight tracking-wide sm:text-4xl sm:tracking-extra-wide lg:text-5xl"
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
              <Card className="group relative overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-2 md:p-8">
                {/* Mobile: Horizontal layout, Desktop: Vertical */}
                <div className="grid min-h-[220px] grid-cols-[42%_58%] md:min-h-0 md:grid-cols-1">
                  {/* Image - Right on mobile, Top on desktop */}
                  <div className="relative order-last h-full min-h-[220px] overflow-hidden md:order-first md:aspect-[3/4] md:min-h-0 md:rounded-2xl">
                    <div className="absolute inset-0 bg-gradient-radial from-ramsider-purple/20 via-transparent to-transparent opacity-100 transition-opacity duration-500 md:opacity-0 md:group-hover:opacity-100" />
                    <Image
                      src={product.image}
                      alt={product.name.replace('<br/>', ' ')}
                      fill
                      className="object-cover md:object-contain"
                      sizes="(max-width: 767px) 58vw, 33vw"
                    />
                  </div>

                  {/* Content - Left on mobile, Bottom on desktop */}
                  <div className="order-first flex min-w-0 flex-col justify-center space-y-3 p-4 text-left md:order-last md:mt-6 md:space-y-4 md:p-0 md:text-center">
                    <h3
                      className="font-display text-xl font-light leading-tight tracking-wide md:text-2xl lg:text-3xl"
                      dangerouslySetInnerHTML={{ __html: product.name }}
                    />
                    <div className="h-px w-8 bg-ramsider-purple md:hidden" />
                    <p className="font-body text-2xl font-normal md:text-3xl">{product.price}</p>
                    <Button
                      variant="ghost"
                      className="w-fit gap-2 rounded-none px-0 py-0 text-[10px] font-medium tracking-wider text-ramsider-black hover:text-ramsider-black sm:text-xs"
                    >
                      <span className="border-b border-ramsider-black pb-0.5">
                        {t('versions.0.cta')}
                      </span>
                      <span aria-hidden="true">→</span>
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
              <svg className="h-6 w-6 text-ramsider-gray sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3 5 6v5c0 4.8 2.9 8.4 7 10 4.1-1.6 7-5.2 7-10V6l-7-3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m9 12 2 2 4-4" />
              </svg>
              <p
                className="font-body text-[10px] font-semibold tracking-wider sm:text-xs sm:tracking-widest"
                dangerouslySetInnerHTML={{ __html: t('trustBadges.secure') }}
              />
            </div>
            <div className="flex flex-col items-center space-y-2 text-center sm:space-y-3">
              <svg className="h-6 w-6 text-ramsider-gray sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.5 3.5 10.2 2h3.6l.7 1.5 1.6.7 1.6-.6 2.6 2.6-.6 1.6.7 1.7 1.6.7v3.6l-1.6.7-.7 1.7.6 1.6-2.6 2.6-1.6-.6-1.6.7-.7 1.5h-3.6l-.7-1.5-1.6-.7-1.6.6-2.6-2.6.6-1.6-.7-1.7-1.6-.7v-3.6l1.6-.7.7-1.7-.6-1.6 2.6-2.6 1.6.6 1.6-.7Z" />
                <circle cx="12" cy="12" r="2.5" strokeWidth={1.5} />
              </svg>
              <p
                className="font-body text-[10px] font-semibold tracking-wider sm:text-xs sm:tracking-widest"
                dangerouslySetInnerHTML={{ __html: t('trustBadges.warranty') }}
              />
            </div>
            <div className="flex flex-col items-center space-y-2 text-center sm:space-y-3">
              <svg className="h-6 w-6 text-ramsider-gray sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
