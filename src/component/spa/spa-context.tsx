'use client'

import { createContext, useContext } from 'react'

const LocaleContext = createContext<string>('fr')

/**
 * Provides a locale string to descendant components via LocaleContext.
 *
 * @param locale - The locale identifier to supply to descendants (for example, "en" or "fr").
 * @param children - React nodes to render within the provider.
 * @returns A React element that renders `children` inside a LocaleContext.Provider with the given `locale`.
 */
export function LocaleProvider({ locale, children }: { locale: string; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/**
 * Accesses the current locale from the LocaleContext.
 *
 * @returns The current locale value (e.g., "en", "fr"); falls back to "fr" when no provider is present.
 */
export function useLocale() {
  return useContext(LocaleContext)
}
