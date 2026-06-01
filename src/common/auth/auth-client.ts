import { createAuthClient } from 'better-auth/react'
import { emailOTPClient, phoneNumberClient, usernameClient } from 'better-auth/client/plugins'

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return ''
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export const client = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [emailOTPClient(), phoneNumberClient(), usernameClient()],
  fetchOptions: {
    onError(error) {
      console.error('Auth error:', error)
    },
  },
})

export const { signIn, signUp, signOut, useSession } = client
