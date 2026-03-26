import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { getOAuthProviderStatus } from '../components/oauth-provider-checker'
import RegisterForm from './register-form'
import { generateMetadata as getSeoMetadata } from '@/lib/seo'
import { createLogger } from '@/lib/logger'
import { getServerSession } from '@/lib/auth/get-server-session'

export const dynamic = 'force-dynamic'

const log = createLogger({ prefix: 'auth-register-page' })

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return getSeoMetadata({
    title: 'Sign up | ShipFree',
  })
}

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Required for static rendering in next-intl
  setRequestLocale(locale)

  const session = await getServerSession()
  if (session) {
    log.info('authenticated_user_redirected_from_register', { locale, userId: session.user?.id })
    redirect(`/${locale}/my-space`)
  }

  log.debug('Rendering register page', { locale })

  const { githubAvailable, googleAvailable, facebookAvailable, microsoftAvailable, isProduction } =
    await getOAuthProviderStatus()

  log.info('OAuth provider status loaded', {
    locale,
    githubAvailable,
    googleAvailable,
    facebookAvailable,
    microsoftAvailable,
    isProduction,
  })

  return (
    <RegisterForm
      githubAvailable={githubAvailable}
      googleAvailable={googleAvailable}
      facebookAvailable={facebookAvailable}
      microsoftAvailable={microsoftAvailable}
      isProduction={isProduction}
    />
  )
}
