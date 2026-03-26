import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { getOAuthProviderStatus } from '../components/oauth-provider-checker'
import LoginForm from './login-form'
import { generateMetadata as getSeoMetadata } from '@/lib/seo'
import { createLogger } from '@/lib/logger'
import { getServerSession } from '@/lib/auth/get-server-session'

export const dynamic = 'force-dynamic'

const log = createLogger({ prefix: 'auth-login-page' })

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return getSeoMetadata({
    title: 'Login | ShipFree',
  })
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Required for static rendering in next-intl
  setRequestLocale(locale)

  const session = await getServerSession()
  if (session) {
    log.info('authenticated_user_redirected_from_login', { locale, userId: session.user?.id })
    redirect(`/${locale}/my-space`)
  }

  log.debug('Rendering login page', { locale })

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
    <LoginForm
      githubAvailable={githubAvailable}
      googleAvailable={googleAvailable}
      facebookAvailable={facebookAvailable}
      microsoftAvailable={microsoftAvailable}
      isProduction={isProduction}
    />
  )
}
