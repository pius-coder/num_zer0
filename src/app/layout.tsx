import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Geist, Geist_Mono, Bricolage_Grotesque, Inter } from 'next/font/google'

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

const inter = Inter({
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
        className={`${geistSans.variable} ${geistMono.variable} ${bricolageGrotesque.variable} ${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  ...getSeoMetadata({
    title: 'ShipFree - Turn Ideas Into Products, Fast',
    description:
      'Ship your startup in days, not weeks. A production-ready Next.js boilerplate with auth, payments, and everything you need to launch fast. Free forever, open source.',
    isRootLayout: true,
  }),
  icons: {
    icon: '/image.png',
    shortcut: '/image.png',
    apple: '/image.png',
  },
}
