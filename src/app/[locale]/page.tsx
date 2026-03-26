import { setRequestLocale } from 'next-intl/server'
import CTA from '@/components/landing/cta'
import FAQ from '@/components/landing/faq'
import Features from '@/components/landing/features'
import Footer from '@/components/landing/footer'
import Hero from '@/components/landing/hero'
import Navbar from '@/components/landing/navbar'
import Pricing from '@/components/landing/pricing'
import Stats from '@/components/landing/stats'
import Testimonials from '@/components/landing/testimonials'
import { GridLayout, SectionDivider } from '@/components/landing/grid-layout'
import { isServerAuthenticated } from '@/lib/auth/get-server-session'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Required for static rendering in next-intl
  setRequestLocale(locale)
  const isAuthenticated = await isServerAuthenticated()

  return (
    <div className="min-h-screen bg-[#080808] text-[#fafafa] [--grid-line-color:rgba(255,255,255,0.06)]">
      <GridLayout>
        <Navbar isAuthenticated={isAuthenticated} />
        <Hero isAuthenticated={isAuthenticated} />
        <SectionDivider variant="dark" />
        <Features />
        <SectionDivider variant="dark" />
        <Stats />
        <SectionDivider variant="dark" />
        <Testimonials />
        <SectionDivider variant="dark" />
        <Pricing isAuthenticated={isAuthenticated} />
        <SectionDivider variant="dark" />
        <FAQ />
        <CTA isAuthenticated={isAuthenticated} />
        <Footer />
      </GridLayout>
    </div>
  )
}
