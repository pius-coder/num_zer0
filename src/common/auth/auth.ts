import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { username, phoneNumber, emailOTP } from 'better-auth/plugins'
import { db } from '@/database'
import * as schema from '@/database/schema'
import { env } from '@/config/env'
import { createHash } from 'crypto'
import { createLogger } from '@/common/logger'

const log = createLogger({ prefix: 'auth-otp' })

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return ''
  return (
    env.BETTER_AUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

function getTrustedOrigins(): string[] {
  const base = env.BETTER_AUTH_URL ?? 'http://localhost:3000'
  const origins = [base]
  if (process.env.VERCEL_URL) {
    const deploymentUrl = `https://${process.env.VERCEL_URL}`
    if (deploymentUrl !== base) origins.push(deploymentUrl)
  }
  return origins
}

function getCookieDomain(): string | undefined {
  const url = env.BETTER_AUTH_URL ?? 'http://localhost:3000'
  try {
    const hostname = new URL(url).hostname
    if (hostname === 'localhost') return undefined
    // Return dot-prefixed domain for subdomain support
    return `.${hostname}`
  } catch {
    return undefined
  }
}

export const auth = betterAuth({
  baseURL: getBaseUrl(),
  trustedOrigins: getTrustedOrigins(),
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  secret: env.BETTER_AUTH_SECRET,

  advanced: {
    cookiePrefix: 'app',
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 24h
    freshAge: 60 * 60, // 1h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24,
    },
  },

  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET
      ? {
          facebook: {
            clientId: env.FACEBOOK_CLIENT_ID,
            clientSecret: env.FACEBOOK_CLIENT_SECRET,
          },
        }
      : {}),
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  plugins: [
    nextCookies(),
    username(),
    phoneNumber({
      async sendOTP({ phoneNumber, code }) {
        // SECURITY: Never log OTP in plaintext. Log only a hash prefix for debugging.
        if (env.EMAIL_PROVIDER === 'log') {
          const otpHash = createHash('sha256').update(code).digest('hex').slice(0, 8)
          log.info('sms_otp_generated', {
            phoneNumber,
            otpHashPrefix: `${otpHash}...`,
            otpLength: code.length,
          })
        }
        // TODO: Integrate real SMS provider (Twilio, Vonage, etc.) for production
      },
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        // SECURITY: Never log OTP in plaintext. Log only a hash prefix for debugging.
        if (env.EMAIL_PROVIDER === 'log') {
          const otpHash = createHash('sha256').update(otp).digest('hex').slice(0, 8)
          log.info('otp_generated', {
            email,
            otpHashPrefix: `${otpHash}...`,
            otpLength: otp.length,
          })
        }
        // TODO: Integrate real email provider (Resend, Postmark, etc.) for production
      },
      otpLength: 6,
      expiresIn: 60 * 15,
    }),
  ],

  pages: {
    signIn: '/login',
    signUp: '/register',
    error: '/error',
    verify: '/verify',
  },
})
