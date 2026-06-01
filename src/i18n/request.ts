import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import type { Formats } from 'next-intl'

import { routing } from './routing'

export const formats = {
  dateTime: {
    short: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  },
  number: {
    precise: {
      maximumFractionDigits: 5,
    },
  },
  list: {
    enumeration: {
      style: 'long',
      type: 'conjunction',
    },
  },
} satisfies Formats

export default getRequestConfig(async ({ requestLocale }) => {
  let requested = await requestLocale

  // Safeguard: Fallback to default if 'code' is requested outside development
  if (requested === 'code' && process.env.NODE_ENV !== 'development') {
    requested = routing.defaultLocale
  }

  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    formats,
  }
})
