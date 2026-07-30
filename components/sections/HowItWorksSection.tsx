import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function HowItWorksSection() {
  const t = useTranslations('howItWorks')

  const icons = [
    <svg
      key="capsule"
      className="h-6 w-10 md:h-16 md:w-16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 12 8 7h8l5 5-5 5H8l-5-5Z"
      />
      <path strokeLinecap="round" strokeWidth={1.5} d="M12 7v10" />
    </svg>,
    <svg
      key="play"
      className="h-8 w-8 md:h-16 md:w-16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="m10.5 8.75 5 3.25-5 3.25v-6.5Z"
      />
    </svg>,
    <svg
      key="clock"
      className="h-8 w-8 md:h-16 md:w-16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 7.5V12l3.5 2.5"
      />
    </svg>,
    <svg
      key="smoke"
      className="h-9 w-8 md:h-16 md:w-16"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 28"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7.2 18.5a4.7 4.7 0 0 1-.8-9.33 6 6 0 0 1 11.34 1.08 4.25 4.25 0 0 1-.94 8.25H7.2Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 18.5v2.4c0 1.7 2.4 1.3 2.4 3 0 1.05-.9 1.6-1.85 1.6"
      />
    </svg>,
  ]

  return (
    <section className="bg-white px-4 pb-4 pt-8 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <h2 className="mb-10 text-center font-display text-xl font-light tracking-extra-wide sm:text-2xl lg:text-5xl">
            {t('sectionTitle')}
          </h2>
        </ScrollReveal>

        <div className="mx-auto max-w-[322px] space-y-7 md:grid md:max-w-none md:grid-cols-2 md:gap-12 md:space-y-0 lg:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="relative">
                {/* Mobile: Timeline connector */}
                {index < 3 && (
                  <div className="absolute left-[22px] top-11 h-[calc(100%+1.75rem)] w-px bg-ramsider-purple/30 md:hidden" />
                )}

                {/* Layout switches: compact horizontal rows on mobile, vertical on desktop */}
                <div className="flex items-start gap-6 text-left md:block md:text-center">
                  {/* Icon */}
                  <div className="relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center bg-white text-ramsider-purple md:mb-6 md:inline-flex md:h-24 md:w-24 md:rounded-full md:border-2 md:border-ramsider-purple">
                    {icons[index]}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5 md:w-auto md:pt-0">
                    <div className="mb-1 flex items-baseline gap-2 md:mb-0 md:block">
                      <div className="font-display text-xs font-bold text-ramsider-purple md:mb-3 md:text-6xl">
                        {t(`steps.${index}.number`)}
                      </div>
                      <h3 className="font-display text-xs font-bold md:mb-3 md:text-xl">
                        {t(`steps.${index}.title`)}
                      </h3>
                    </div>
                    <p className="max-w-[310px] font-body text-[10px] leading-relaxed text-ramsider-gray md:max-w-none md:text-base">
                      {t(`steps.${index}.description`)}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div className="relative mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl bg-ramsider-black px-6 pb-4 pt-5 text-white sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(200,38,211,0.32),transparent_42%)]" />
            <div className="relative z-10 grid min-h-[116px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <div>
                <h3
                  className="font-display text-xl font-bold leading-[1.05] sm:text-3xl"
                  dangerouslySetInnerHTML={{ __html: t('cta.title') }}
                />
                <p className="mt-3 max-w-[220px] font-body text-[10px] leading-relaxed text-ramsider-gray sm:text-sm">
                  {t('cta.subtitle')}
                </p>
              </div>
              <Button
                variant="primary"
                className="bg-white px-4 py-2 text-[9px] text-ramsider-black hover:shadow-[0_0_40px_rgba(200,38,211,0.6)] sm:px-5 sm:text-xs"
              >
                {t('cta.button')} <span aria-hidden="true">→</span>
              </Button>
            </div>
            <div className="relative z-10 grid min-h-[44px] grid-cols-3 items-center border-t border-white/15 text-center text-[7px] sm:gap-5 sm:text-xs">
              <div className="flex items-center justify-center gap-1.5 border-r border-white/15 px-1">
                <svg
                  className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t('trustBadges.secure')}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 border-r border-white/15 px-1">
                <svg
                  className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t('trustBadges.warranty')}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 px-1">
                <svg
                  className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{t('trustBadges.returns')}</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
