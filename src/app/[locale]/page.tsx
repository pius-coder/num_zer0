import CTA from '@/app/(site)/cta'
import FAQ from '@/app/(site)/faq'
import Features from '@/app/(site)/features'
import Footer from '@/app/(site)/footer'
import Hero from '@/app/(site)/hero'
import Navbar from '@/app/(site)/navbar'
import Pricing from '@/app/(site)/pricing'
import Stats from '@/app/(site)/stats'
import Testimonials from '@/app/(site)/testimonials'
import { GridLayout, SectionDivider } from '@/app/(site)/grid-layout'

export default function HomePage() {
  return (
    <div className='min-h-screen bg-[#080808] text-[#fafafa] [--grid-line-color:rgba(255,255,255,0.06)]'>
      <GridLayout>
        <Navbar />
        <Hero />
        <SectionDivider variant='dark' />
        <Features />
        <SectionDivider variant='dark' />
        <Stats />
        <SectionDivider variant='dark' />
        <Testimonials />
        <SectionDivider variant='dark' />
        <Pricing />
        <SectionDivider variant='dark' />
        <FAQ />
        <CTA />
        <Footer />
      </GridLayout>
    </div>
  )
}
