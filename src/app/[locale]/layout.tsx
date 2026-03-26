import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { setRequestLocale, getMessages } from 'next-intl/server'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

import { routing, locales } from '@/i18n/routing'
import { QueryProvider } from '@/app/_providers/query-provider'
import { ToastProvider } from '@/components/ui/toast'

/**
 * Ensures that the locale segment is statically generated at build time.
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate that the request matches a supported locale
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Required for static rendering in next-intl
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <NuqsAdapter>
        <QueryProvider>
          <ToastProvider>{children}</ToastProvider>
          {/* Grain overlay for aesthetic consistency */}
          <div className="h-screen w-full fixed top-0 left-0 -z-10 bg-[url('/grain.jpg')] opacity-5 pointer-events-none" />
        </QueryProvider>
      </NuqsAdapter>
    </NextIntlClientProvider>
  )
}
