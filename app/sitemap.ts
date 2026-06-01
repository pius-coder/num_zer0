import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://numzero.app'
  const locales = ['en', 'fr', 'es']

  // Public pages that should be indexed
  const publicPages = ['', '/pricing', '/login', '/register', '/terms', '/privacy', '/licenses']

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add entries for each locale and page combination
  for (const locale of locales) {
    for (const page of publicPages) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : page === '/pricing' ? 0.8 : 0.5,
        alternates: {
          languages: Object.fromEntries(locales.map((l) => [l, `${baseUrl}/${l}${page}`])),
        },
      })
    }
  }

  // Add root redirect entry
  sitemapEntries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  })

  return sitemapEntries
}
