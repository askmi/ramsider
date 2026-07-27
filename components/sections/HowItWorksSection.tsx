import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function HowItWorksSection() {
  const t = useTranslations('howItWorks')

  const icons = [
    <svg key="capsule" className="h-8 w-8 md:h-16 md:w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>,
    <svg key="play" className="h-8 w-8 md:h-16 md:w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    <svg key="clock" className="h-8 w-8 md:h-16 md:w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    <svg key="smile" className="h-8 w-8 md:h-16 md:w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
  ]

  return (
    <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="mb-8 text-center font-display text-3xl font-light tracking-extra-wide sm:text-4xl lg:text-5xl">
            {t('sectionTitle')}
          </h2>
        </ScrollReveal>

        <div className="space-y-12 md:grid md:grid-cols-2 md:gap-12 md:space-y-0 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="relative">
                {/* Mobile: Timeline connector */}
                {index < 3 && (
                  <div className="absolute left-[30px] top-[80px] h-[calc(100%+3rem)] w-px bg-ramsider-purple/30 md:hidden" />
                )}

                {/* Layout switches: horizontal on mobile, vertical on desktop */}
                <div className="flex gap-6 text-left md:block md:text-center">
                  {/* Icon */}
                  <div className="relative z-10 flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-full border-2 border-ramsider-purple bg-white text-ramsider-purple md:mb-6 md:inline-flex md:h-24 md:w-24">
                    {icons[index]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-12 md:pb-0">
                    <div className="mb-2 font-display text-5xl font-bold text-ramsider-purple md:mb-3 md:text-6xl">
                      {t(`steps.${index}.number`)}
                    </div>
                    <h3 className="mb-2 font-display text-lg font-bold md:mb-3 md:text-xl">
                      {t(`steps.${index}.title`)}
                    </h3>
                    <p className="font-body text-sm text-ramsider-gray md:text-base">
                      {t(`steps.${index}.description`)}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div className="relative mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-ramsider-black via-ramsider-black to-ramsider-purple/20 p-8 sm:p-12 text-center text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,38,211,0.15),transparent_50%)]" />
            <div className="relative z-10">
              <h3
                className="mb-4 font-display text-3xl font-bold sm:text-4xl"
                dangerouslySetInnerHTML={{ __html: t('cta.title') }}
              />
              <p className="mb-8 font-body text-lg text-ramsider-gray">
                {t('cta.subtitle')}
              </p>
              <Button variant="primary" className="bg-white text-ramsider-black hover:shadow-[0_0_40px_rgba(200,38,211,0.6)]">
                {t('cta.button')}
              </Button>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 text-xs sm:flex-row sm:gap-6 sm:text-sm">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>{t('trustBadges.secure')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{t('trustBadges.warranty')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>{t('trustBadges.returns')}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
