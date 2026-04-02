import { setRequestLocale } from 'next-intl/server'

import {
  GridLayout,
  SectionDivider,
  Navbar,
  HeroSection,
  FeatureGrid,
  PricingGrid,
  HowItWorks,
  StatsRow,
  FAQ,
  CTASection,
  Footer,
} from '@/component/landing'

import { isServerAuthenticated } from '@/common/auth/get-server-session'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const isAuthenticated = await isServerAuthenticated()

  return (
    <div className='min-h-screen bg-background text-foreground [--grid-line-color:var(--border)]'>
      <GridLayout>
        <Navbar isAuthenticated={isAuthenticated} />
        <HeroSection isAuthenticated={isAuthenticated} />
        <SectionDivider variant='dark' />
        <FeatureGrid />
        <SectionDivider variant='dark' />
        <PricingGrid isAuthenticated={isAuthenticated} />
        <SectionDivider variant='dark' />
        <HowItWorks />
        <SectionDivider variant='dark' />
        <StatsRow />
        <SectionDivider variant='dark' />
        <FAQ />
        <CTASection isAuthenticated={isAuthenticated} />
        <Footer />
      </GridLayout>
    </div>
  )
}
