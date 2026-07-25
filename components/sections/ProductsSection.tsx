import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function ProductsSection() {
  const t = useTranslations('products')

  const products = [
    {
      name: 'UNO<br/>LIGHT',
      price: '700 $',
      image: '/images/products/uno-light-pure.png',
    },
    {
      name: 'UNO<br/>PRO',
      price: '1000 $',
      image: '/images/products/uno-pro-pure.png',
    },
    {
      name: 'UNO<br/>GOLD',
      price: '2000 $',
      image: '/images/products/uno-gold-pure.png',
    },
  ]

  return (
    <section className="bg-white px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2
              className="font-display text-3xl font-light leading-tight tracking-extra-wide sm:text-4xl lg:text-5xl"
              dangerouslySetInnerHTML={{ __html: t('sectionTitle') }}
            />
            <p className="mt-6 font-body text-base text-ramsider-gray sm:text-lg">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-3">
          {products.map((product, index) => (
            <ScrollReveal key={index} delay={index * 150}>
              <Card className="group relative overflow-hidden transition-transform duration-300 hover:-translate-y-2">
                {/* Product Image */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-radial from-ramsider-purple/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <Image
                    src={product.image}
                    alt={product.name.replace('<br/>', ' ')}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                {/* Product Info */}
                <div className="mt-6 space-y-4 text-center">
                  <h3
                    className="font-display text-2xl font-light leading-tight tracking-wide sm:text-3xl"
                    dangerouslySetInnerHTML={{ __html: product.name }}
                  />
                  <p className="font-body text-3xl font-normal">{product.price}</p>
                  <Button variant="primary" className="w-full">
                    {t('versions.0.cta')}
                  </Button>
                </div>
              </Card>
            </ScrollReveal>
          ))}
        </div>

        {/* Trust Badges */}
        <ScrollReveal delay={500}>
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-ramsider-border pt-8">
            <div className="flex flex-col items-center space-y-3 text-center">
              <svg className="h-10 w-10 text-ramsider-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p
                className="font-body text-xs font-semibold tracking-widest"
                dangerouslySetInnerHTML={{ __html: t('trustBadges.secure') }}
              />
            </div>
            <div className="flex flex-col items-center space-y-3 text-center">
              <svg className="h-10 w-10 text-ramsider-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p
                className="font-body text-xs font-semibold tracking-widest"
                dangerouslySetInnerHTML={{ __html: t('trustBadges.warranty') }}
              />
            </div>
            <div className="flex flex-col items-center space-y-3 text-center">
              <svg className="h-10 w-10 text-ramsider-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p
                className="font-body text-xs font-semibold tracking-widest"
                dangerouslySetInnerHTML={{ __html: t('trustBadges.returns') }}
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
