import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function BusinessSection() {
  const t = useTranslations('business')

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-white">
            <div className="grid gap-8 lg:grid-cols-[40%_60%] lg:gap-0">
              {/* Left: Content */}
              <div className="flex items-center px-8 py-12 sm:px-12 lg:px-16 lg:py-16">
                <div className="space-y-6">
                  <Badge>{t('badge')}</Badge>

                  <h2 className="font-body text-2xl font-normal leading-tight sm:text-3xl lg:text-4xl">
                    {t('title')}
                  </h2>

                  <div className="flex flex-col gap-4 pt-2">
                    <Button variant="primary">
                      {t('cta.explore')}
                    </Button>
                    <Button variant="secondary">
                      {t('cta.request')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right: Image with gradient fade on left edge */}
              <div className="relative aspect-[4/3] lg:aspect-auto">
                <div className="absolute inset-0">
                  <Image
                    src="/images/products/business-lifestyle-pure.png"
                    alt="Ramsider UNO in restaurant setting"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    style={{
                      maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 100%)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 100%)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
