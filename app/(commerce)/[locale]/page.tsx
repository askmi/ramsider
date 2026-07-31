import type { Locale } from '@/lib/i18n/config'
import { Header } from '@/components/sections/Header'
import { HeroSection } from '@/components/sections/HeroSection'
import { BusinessSection } from '@/components/sections/BusinessSection'
import { StatsSection } from '@/components/sections/StatsSection'
import { ProductsSection } from '@/components/sections/ProductsSection'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { HowItWorksSection } from '@/components/sections/HowItWorksSection'
import { TestimonialSection } from '@/components/sections/TestimonialSection'
import { ShippingSection } from '@/components/sections/ShippingSection'
import { Footer } from '@/components/sections/Footer'

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <>
      <Header currentLocale={locale as Locale} />
      <main className="pt-[153px]">
        <HeroSection />
        <BusinessSection />
        <ProductsSection />
        <FeaturesSection />
        <StatsSection />
        <HowItWorksSection />
        <TestimonialSection />
        <ShippingSection />
        <Footer />
      </main>
    </>
  )
}
