import type { BaseService } from '../base.service'
import type { GrizzlyCountryItem, GrizzlyServiceItem } from './types'
import type { TTLCache } from './cache'

const GRIZZLY_ERRORS = [
  'BAD_KEY',
  'NO_NUMBERS',
  'NO_ACTIVATION',
  'BAD_SERVICE',
  'BAD_STATUS',
  'BAD_ACTION',
  'ERROR_SQL',
  'SERVICE_UNAVAILABLE_REGION',
] as const

function checkError(base: BaseService, raw: unknown): void {
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw)
  for (const code of GRIZZLY_ERRORS) {
    if (text.includes(code)) {
      throw base.error('grizzly_api_error', `GrizzlySMS error: ${code}`, {
        code,
        response: text.slice(0, 500),
      })
    }
  }
}

function buildParams(
  apiKey: string,
  action: string,
  extra?: Record<string, string | number | undefined>
): Record<string, string> {
  const params: Record<string, string> = { api_key: apiKey, action }
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== '') params[k] = String(v)
    }
  }
  return params
}

export async function getServicesList(
  base: BaseService,
  apiKey: string,
  cache: TTLCache
): Promise<GrizzlyServiceItem[]> {
  const key = 'grizzly_services'
  const cached = cache.get<GrizzlyServiceItem[]>(key)
  if (cached) return cached
  return base.withRetry(async () => {
    const raw = await base.httpGet<{ services: GrizzlyServiceItem[] }>('', {
      params: buildParams(apiKey, 'getServicesList'),
    })
    checkError(base, raw)
    const services = raw.services ?? []
    cache.set(key, services)
    return services
  }, 'getServicesList')
}

export async function getCountries(
  base: BaseService,
  apiKey: string,
  cache: TTLCache
): Promise<GrizzlyCountryItem[]> {
  const key = 'grizzly_countries'
  const cached = cache.get<GrizzlyCountryItem[]>(key)
  if (cached) return cached
  return base.withRetry(async () => {
    const raw = await base.httpGet<GrizzlyCountryItem[] | Record<string, GrizzlyCountryItem>>('', {
      params: buildParams(apiKey, 'getCountries'),
    })
    checkError(base, raw)
    const countries = Array.isArray(raw) ? raw : Object.values(raw)
    cache.set(key, countries)
    return countries
  }, 'getCountries')
}
