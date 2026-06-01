import { defineRouting } from 'next-intl/routing'

const baseLocales = ['en', 'es', 'fr'] as const
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Supported locales.
 * `code` is a special locale for development to identify missing translations.
 */
export const locales = isDevelopment ? [...baseLocales, 'code' as const] : baseLocales

export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  locales,

  /**
   * Default locale if none is detected
   */
  defaultLocale: 'fr',

  /**
   * Detects the browser's locale automatically
   */
  localeDetection: true,

  /**
   * Forces the locale in the URL path: e.g. /en/contact
   */
  localePrefix: 'always',

  /**
   * Generates <link rel="alternate" hreflang="..."> for SEO
   */
  alternateLinks: true,
})
