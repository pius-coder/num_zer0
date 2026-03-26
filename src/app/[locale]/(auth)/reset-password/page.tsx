import { setRequestLocale } from 'next-intl/server'
import { Suspense } from 'react'
import { ResetPasswordContent } from './reset-password-content'
import { createLogger } from '@/lib/logger'

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Required for static rendering in next-intl
  setRequestLocale(locale)

  const log = createLogger({ prefix: 'auth-reset-password-page' })
  log.debug('Rendering reset password page', { locale })

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
