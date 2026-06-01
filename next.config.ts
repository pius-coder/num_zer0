import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const SPA_PATHS = ['my-space', 'wallet', 'account', 'numbers', 'recharge', 'support']

const nextConfig: NextConfig = {
  output: 'standalone',

  allowedDevOrigins: ['numzero.globalimex.online'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'numzero.globalimex.online',
      },
    ],
  },

  async rewrites() {
    const spaRewrites = SPA_PATHS.map((path) => ({
      source: `/:locale/${path}`,
      destination: `/:locale/${path}`,
    }))

    return spaRewrites
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
