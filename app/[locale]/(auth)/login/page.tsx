import { setRequestLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { isServerAuthenticated } from '@/common/auth'
import { LoginForm } from '@/component/auth'
import { getOAuthProviderStatus } from '@/actions/oauth-provider.action'

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const isAuthenticated = await isServerAuthenticated()
  if (isAuthenticated) redirect(`/${locale}/my-space`)

  const { githubAvailable, googleAvailable, facebookAvailable, microsoftAvailable } =
    await getOAuthProviderStatus()

  return (
    <LoginForm
      githubAvailable={githubAvailable}
      googleAvailable={googleAvailable}
      facebookAvailable={facebookAvailable}
      microsoftAvailable={microsoftAvailable}
    />
  )
}
