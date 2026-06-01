import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../../convex/_generated/api'
import { seo } from '#/seo'
import '#/components/landing/animations.css'
import Navbar from '#/components/landing/navbar'
import TickerBanner from '#/components/landing/ticker-banner'
import Hero from '#/components/landing/hero'
import Features from '#/components/landing/features'
import Security from '#/components/landing/security'
import Integrations from '#/components/landing/integrations'
import FaqSection from '#/components/landing/faq'
import FooterSection from '#/components/landing/footer'
import Testimonials from '#/components/landing/testimonials'
import CountryFlags from '#/components/landing/country-flags'
import { AccessBanner } from '#/components/auth'
import { trackers } from '#/lib/trackers'

export const Route = createFileRoute('/(landing)/')({
  head: () => seo.landing,
  component: RouteComponent,
})

function RouteComponent() {
  const [showCart, setShowCart] = useState(false)

  const { data: accessStatus } = useQuery(
    convexQuery(api.users.getAccessStatus, {})
  )

  const isAuthenticated = !!accessStatus?.user && !accessStatus.isExpired

  useEffect(() => {
    trackers.init()
    const onScroll = () => setShowCart(window.scrollY > window.innerHeight)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <AccessBanner />
      <Navbar isAuthenticated={isAuthenticated} />
      <Hero isAuthenticated={isAuthenticated} />
      <a
        href="https://wa.me/237XXXXXXXXX"
        target="_blank"
        rel="noopener"
        className={`fixed bottom-20 right-4 z-50 group/button inline-flex shrink-0 items-center justify-center rounded-lg border bg-clip-padding whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5 w-14 h-14 border-[#25D366] bg-[#25D366] text-white hover:brightness-110 shadow-lg md:bottom-6 md:right-6 anim-float transition-opacity duration-300 ${showCart ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0020 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>
        </svg>
      </a>
      <CountryFlags />
      <Testimonials />
      <Features />
      <Security />
      <Integrations />
      <FaqSection />
      <FooterSection />
      <TickerBanner />
    </>
  )
}
