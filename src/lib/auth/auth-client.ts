import { emailOTPClient, organizationClient, phoneNumberClient, usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { getBaseUrl } from '../utils'

/**
 * Auth Client
 *
 * Core authentication client with phone-first auth, email OTP, and organization support.
 * Phone numbers are the primary identifier. Email is optional.
 */
export const client = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    emailOTPClient(),
    organizationClient(),
    phoneNumberClient(),
    usernameClient(),
  ],
  fetchOptions: {
    onError(error) {
      console.error('Auth error:', error)
    },
    onSuccess(data) {
      console.log('Auth action successful:', data)
    },
  },
})

export const { signIn, signUp, signOut, useSession } = client

