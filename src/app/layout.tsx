import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Geist, Geist_Mono, Bricolage_Grotesque, Roboto } from 'next/font/google'
import {
  GeistPixelSquare,
  GeistPixelGrid,
  GeistPixelCircle,
  GeistPixelTriangle,
  GeistPixelLine,
} from 'geist/font/pixel'

import { generateMetadata as getSeoMetadata } from '@/lib/seo'
import { extractLocale } from '@/lib/i18n/extract-locale'
import '@/app/_styles/globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const bricolageGrotesque = Bricolage_Grotesque({
  variable: '--font-bricolage-grotesque',
  subsets: ['latin'],
})

const inter = Roboto({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerList = await headers()
  const pathname = headerList.get('x-next-pathname') || '/'
  const locale = extractLocale(pathname)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelCircle.variable} ${GeistPixelTriangle.variable} ${GeistPixelLine.variable} ${bricolageGrotesque.variable} ${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  ...getSeoMetadata({
    title: 'NumZero - Virtual Numbers for SMS OTP Verification',
    description:
      'NumZero is a Cameroon-first platform to buy virtual numbers for SMS OTP verification with local payments, transparent credit pricing, and anti-fraud controls.',
    isRootLayout: true,
  }),
  icons: {
    icon: '/image.png',
    shortcut: '/image.png',
    apple: '/image.png',
  },
}
