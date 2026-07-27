import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function BusinessSection() {
  const t = useTranslations('business')

  return (
    <section className="bg-white py-1.5 sm:py-4">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        <ScrollReveal>
          <div className="overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-white">
            <div className="grid grid-cols-[40%_60%] gap-0 items-center">
              {/* Left: Content */}
              <div className="flex items-center px-3 py-3 sm:px-6 sm:py-6 lg:px-12 lg:py-12">
                <div className="space-y-1.5 sm:space-y-3">
                  <Badge className="text-[8px] px-1.5 py-0.5 sm:text-xs sm:px-2 sm:py-1">{t('badge')}</Badge>

                  <h2 className="font-body text-[11px] font-normal leading-tight sm:text-base lg:text-xl">
                    {t('title')}
                  </h2>

                  <div className="flex flex-col gap-1 pt-0.5 sm:gap-2">
                    <Button variant="primary" className="px-2 py-1 text-[7px] tracking-normal sm:px-4 sm:py-2 sm:text-xs sm:tracking-wider">
                      {t('cta.explore')}
                    </Button>
                    <Button variant="secondary" className="px-2 py-1 text-[7px] tracking-normal sm:px-4 sm:py-2 sm:text-xs sm:tracking-wider">
                      {t('cta.request')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right: Image with gradient fade on left edge */}
              <div className="relative h-[120px] sm:h-[200px] lg:h-[280px]">
                <div className="absolute inset-0">
                  <Image
                    src="/images/products/business-lifestyle-pure.png"
                    alt="Ramsider UNO in restaurant setting"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 60vw, 50vw"
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
