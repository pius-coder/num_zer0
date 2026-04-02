import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://numzero.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/en', '/fr', '/es', '/login', '/register', '/pricing'],
        disallow: [
          '/api/',
          '/admin/',
          '/my-space/',
          '/wallet/',
          '/account/',
          '/numbers/',
          '/verify',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
