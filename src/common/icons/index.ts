import { Ok, Err, type Result } from '@/lib/result'

export type ServiceIconResult = {
  iconName: string
  slug: string
  url: string
  svg: string | null
}

const ICONIFY_SEARCH_URL = 'https://api.iconify.design/search'
const ICONIFY_CDN_URL = 'https://api.iconify.design/simple-icons'

const iconCache = new Map<string, ServiceIconResult>()
const TTL_MS = 24 * 60 * 60 * 1000
const cacheTimestamps = new Map<string, number>()

function getCached(key: string): ServiceIconResult | null {
  const entry = iconCache.get(key)
  const ts = cacheTimestamps.get(key)
  if (!entry || !ts) return null
  if (Date.now() - ts > TTL_MS) {
    iconCache.delete(key)
    cacheTimestamps.delete(key)
    return null
  }
  return entry
}

function setCache(key: string, entry: ServiceIconResult): void {
  iconCache.set(key, entry)
  cacheTimestamps.set(key, Date.now())
}

const KNOWN_MAPPINGS: Record<string, string> = {
  whatsapp: 'whatsapp',
  telegram: 'telegram',
  facebook: 'facebook',
  twitter: 'x',
  x: 'x',
  instagram: 'instagram',
  tiktok: 'tiktok',
  google: 'google',
  microsoft: 'microsoft',
  youtube: 'youtube',
  reddit: 'reddit',
  linkedin: 'linkedin',
  discord: 'discord',
  signal: 'signal',
}

function normalizeServiceName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return KNOWN_MAPPINGS[slug] ?? slug
}

export function getServiceIconUrl(iconName: string): string {
  const slug = iconName.replace('simple-icons:', '')
  return `${ICONIFY_CDN_URL}/${slug}.svg`
}

export async function searchServiceIcon(
  serviceName: string
): Promise<Result<ServiceIconResult | null>> {
  const slug = normalizeServiceName(serviceName)
  const cached = getCached(slug)
  if (cached) return Ok(cached)

  try {
    const searchUrl = new URL(ICONIFY_SEARCH_URL)
    searchUrl.searchParams.set('query', slug)
    searchUrl.searchParams.set('prefixes', 'simple-icons')
    searchUrl.searchParams.set('limit', '5')

    const response = await fetch(searchUrl.toString())
    if (!response.ok) return Ok(null)

    const data = await response.json()
    if (!data.icons?.length) return Ok(null)

    const iconName = data.icons[0]
    const iconSlug = iconName.replace('simple-icons:', '')
    const result: ServiceIconResult = {
      iconName,
      slug: iconSlug,
      url: getServiceIconUrl(iconName),
      svg: null,
    }

    setCache(slug, result)
    return Ok(result)
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)))
  }
}

export function clearIconCache(): void {
  iconCache.clear()
  cacheTimestamps.clear()
}
