'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
  delay: number
}

function StatCard({ icon, value, label, delay }: StatCardProps) {
  return (
    <ScrollReveal delay={delay}>
      <div className="flex flex-col items-center space-y-3 text-center sm:space-y-4">
        <div className="text-ramsider-gray">{icon}</div>
        <div className="space-y-1 sm:space-y-2">
          <p className="font-body text-sm font-semibold sm:text-base lg:text-lg">{value}</p>
          <p
            className="font-body text-[10px] font-semibold tracking-wider text-ramsider-gray uppercase sm:text-xs sm:tracking-widest"
            dangerouslySetInnerHTML={{ __html: label }}
          />
        </div>
      </div>
    </ScrollReveal>
  )
}

export function StatsSection() {
  const t = useTranslations('stats')

  const stats = [
    {
      icon: (
        <svg className="h-10 w-10 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      value: t('sessionsTested.value'),
      label: t('sessionsTested.label'),
    },
    {
      icon: (
        <svg className="h-10 w-10 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      value: t('development.value'),
      label: t('development.label'),
    },
    {
      icon: (
        <svg className="h-10 w-10 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18M3 12h18" />
          <ellipse cx="12" cy="12" rx="4" ry="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 7c1.5 1 3 1.5 6 1.5s4.5-.5 6-1.5M6 17c1.5-1 3-1.5 6-1.5s4.5.5 6 1.5" />
        </svg>
      ),
      value: t('shipping.value'),
      label: t('shipping.label'),
    },
    {
      icon: (
        <svg className="h-10 w-10 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 4 18 3-9h4" />
        </svg>
      ),
      value: t('smart.value'),
      label: t('smart.label'),
    },
  ]

  return (
    <section className="bg-ramsider-white px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-stretch divide-x divide-ramsider-border">
          {stats.map((stat, index) => (
            <div key={index} className="flex-1 px-3 sm:px-6 lg:px-8">
              <StatCard {...stat} delay={index * 100} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
