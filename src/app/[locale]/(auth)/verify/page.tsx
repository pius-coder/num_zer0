import { setRequestLocale } from 'next-intl/server'
import { isProd } from '@/lib/constants'
import { VerifyContent } from './verify-content'
import { generateMetadata as getSeoMetadata } from '@/lib/seo'
import { createLogger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const log = createLogger({ prefix: 'auth-verify-page' })

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return getSeoMetadata({
    title: 'Verification | ShipFree',
  })
}

export default async function VerifyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Required for static rendering in next-intl
  setRequestLocale(locale)

  log.debug('Rendering verification page', { locale, isProduction: isProd })

  return <VerifyContent isProduction={isProd} />
}
