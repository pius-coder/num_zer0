import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/component/ui/query-provider'
import { Geist, Geist_Mono, Bricolage_Grotesque, Roboto, Oleo_Script } from 'next/font/google'
import {
  GeistPixelSquare,
  GeistPixelGrid,
  GeistPixelCircle,
  GeistPixelTriangle,
  GeistPixelLine,
} from 'geist/font/pixel'

import '@/app/_styles/globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
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
const oleoScript = Oleo_Script({
  variable: '--font-oleo-script',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelCircle.variable} ${GeistPixelTriangle.variable} ${GeistPixelLine.variable} ${bricolageGrotesque.variable} ${inter.variable} ${oleoScript.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem={false}
          value={{ light: 'light', dark: 'dark' }}
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: {
    template: '%s | NumZero',
    default: 'NumZero - Virtual Numbers for SMS Verification',
  },
  description:
    'Buy virtual numbers for SMS OTP verification with local payments (MTN MoMo, Orange Money), transparent credit pricing, and anti-fraud controls.',
  icons: {
    icon: '/image.png',
    shortcut: '/image.png',
    apple: '/image.png',
  },
}
