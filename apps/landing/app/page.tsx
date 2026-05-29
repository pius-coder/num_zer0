"use client"

import Navbar from "@/components/navbar"
import Hero from "@/components/hero"
import Features from "@/components/features"
import Security from "@/components/security"
import Integrations from "@/components/integrations"
import FooterSection from "@/components/footer"

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Security />
      <Integrations />
      <FooterSection />
    </>
  )
}
