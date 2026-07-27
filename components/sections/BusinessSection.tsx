import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function BusinessSection() {
  const t = useTranslations('business')

  return (
    <section className="bg-white py-2 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white">
            <div className="grid gap-3 lg:grid-cols-[40%_60%] lg:gap-0">
              {/* Left: Content */}
              <div className="flex items-center px-4 py-4 sm:px-8 sm:py-8 lg:px-12 lg:py-12">
                <div className="space-y-2 sm:space-y-4">
                  <Badge className="text-[10px] px-2 py-0.5">{t('badge')}</Badge>

                  <h2 className="font-body text-sm font-normal leading-tight sm:text-xl lg:text-2xl">
                    {t('title')}
                  </h2>

                  <div className="flex flex-col gap-2 pt-1">
                    <Button variant="primary" className="py-1.5 text-xs">
                      {t('cta.explore')}
                    </Button>
                    <Button variant="secondary" className="py-1.5 text-xs">
                      {t('cta.request')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right: Image with gradient fade on left edge */}
              <div className="relative aspect-[4/3] max-h-[150px] sm:max-h-[250px] lg:aspect-auto lg:max-h-none">
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
