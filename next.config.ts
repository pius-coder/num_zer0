import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  // This reduces the Docker image size by including only necessary files
  // output: 'standalone',
}

export default withNextIntl(nextConfig)
