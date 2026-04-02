'use server'

import { env } from '@/config/env'

export async function getOAuthProviderStatus() {
  const githubAvailable = !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
  const googleAvailable = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
  const facebookAvailable = !!(env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET)
  const isProduction = env.NEXT_PUBLIC_ENV === 'production'

  return {
    githubAvailable,
    googleAvailable,
    facebookAvailable,
    microsoftAvailable: false,
    isProduction,
  }
}
