/**
 * Extracts the locale from a pathname.
 * Used in middleware/proxy and root layout for dynamic lang attributes.
 */
export function extractLocale(pathname: string): string {
    const match = pathname.match(/^\/(en|fr|de|code)(?:\/|$)/)
    return match ? match[1] : 'fr'
}
