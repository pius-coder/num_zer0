import { BaseService } from '../base.service'
import { TTLCache } from './cache'
import type {
  GrizzlyActivation,
  GrizzlyActivationStatusV1,
  GrizzlyActivationStatusV2,
  GrizzlyCountryItem,
  GrizzlyGetNumberOptions,
  GrizzlyServiceItem,
  GrizzlySetStatusCode,
  GrizzlySetStatusResponse,
  PricesV3Raw,
  PriceV3Entry,
  FlatPriceV3Row,
  PriceV3FilterOptions,
} from './types'
import { filterPricesV3, flattenPricesV3, paginate } from './utils'
import * as activation from './activation'

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

export class GrizzlyClient extends BaseService {
  private cache: TTLCache
  private _apiKey: string

  constructor(apiKey: string, cacheTtlMs = 60_000) {
    super({
      prefix: 'grizzly',
      http: { baseUrl: 'https://api.grizzlysms.com/stubs/handler_api.php', timeoutMs: 10_000 },
      retry: { maxAttempts: 3 },
    })
    this.assert(!!apiKey, 'grizzly_api_key_missing', 'GRIZZLY_API_KEY is not configured')
    this._apiKey = apiKey
    this.cache = new TTLCache(cacheTtlMs)
  }

  private checkError(raw: unknown): void {
    const text = typeof raw === 'string' ? raw : JSON.stringify(raw)
    for (const code of GRIZZLY_ERRORS) {
      if (text.includes(code)) {
        throw this.error('grizzly_api_error', `GrizzlySMS error: ${code}`, {
          code,
          response: text.slice(0, 500),
        })
      }
    }
  }

  private buildParams(
    action: string,
    extra?: Record<string, string | number | undefined>
  ): Record<string, string> {
    const params: Record<string, string> = { api_key: this._apiKey, action }
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v !== undefined && v !== '') params[k] = String(v)
      }
    }
    return params
  }

  async getNumberV2(options: GrizzlyGetNumberOptions): Promise<GrizzlyActivation> {
    return activation.getNumberV2(this, this._apiKey, options)
  }

  async setStatus(
    activationId: number,
    status: GrizzlySetStatusCode
  ): Promise<GrizzlySetStatusResponse> {
    return activation.setStatus(this, this._apiKey, activationId, status)
  }

  async getStatusV2(activationId: number): Promise<GrizzlyActivationStatusV2> {
    return activation.getStatusV2(this, this._apiKey, activationId)
  }

  async getStatusV1(activationId: number): Promise<GrizzlyActivationStatusV1> {
    return activation.getStatusV1(this, this._apiKey, activationId)
  }

  async getBalance(): Promise<number> {
    return activation.getBalance(this, this._apiKey)
  }

  async getServicesList(): Promise<GrizzlyServiceItem[]> {
    const key = 'grizzly_services'
    const cached = this.cache.get<GrizzlyServiceItem[]>(key)
    if (cached) return cached
    return this.withRetry(async () => {
      // Use httpGetText to be safer with Grizzly text errors
      const rawText = await this.httpGetText('', {
        params: this.buildParams('getServicesList'),
      })
      this.checkError(rawText)
      const ObjectRes = JSON.parse(rawText) as { services: GrizzlyServiceItem[] }
      const services = ObjectRes.services ?? []
      this.cache.set(key, services)
      return services
    }, 'getServicesList')
  }

  async getCountries(): Promise<GrizzlyCountryItem[]> {
    const key = 'grizzly_countries'
    const cached = this.cache.get<GrizzlyCountryItem[]>(key)
    if (cached) return cached
    return this.withRetry(async () => {
      // Use httpGetText to be safer
      const rawText = await this.httpGetText('', {
        params: this.buildParams('getCountries'),
      })
      this.checkError(rawText)
      // Grizzly can return Array or Object
      let parsed: any
      try {
        parsed = JSON.parse(rawText)
      } catch {
        parsed = rawText
      }
      const countries = Array.isArray(parsed) ? parsed : Object.values(parsed)
      this.cache.set(key, countries)
      return countries
    }, 'getCountries')
  }

  private async getRawPricesV3(service?: string, country?: string): Promise<PricesV3Raw> {
    const key = `grizzly_prices:${service ?? '*'}:${country ?? '*'}`
    const cached = this.cache.get<PricesV3Raw>(key)
    if (cached) return cached
    return this.withRetry(async () => {
      // Use httpGetText to safely catch Grizzly text errors (like BAD_ACTION/BAD_KEY)
      const rawText = await this.httpGetText('', {
        params: this.buildParams('getPricesV3', { service, country }),
      })
      this.checkError(rawText)
      try {
        const parsed = JSON.parse(rawText) as PricesV3Raw
        this.cache.set(key, parsed)
        return parsed
      } catch (e) {
        this.log.error('grizzly_json_parse_failed', { text: rawText.slice(0, 100) })
        throw this.error(
          'grizzly_parse_error',
          `Unexpected response format: ${rawText.slice(0, 50)}`
        )
      }
    }, 'getRawPricesV3')
  }

  async searchPricesV3(
    filters: PriceV3FilterOptions = {},
    paginationOpts?: { page?: number; pageSize?: number }
  ) {
    const raw = await this.getRawPricesV3(
      Array.isArray(filters.service) ? undefined : filters.service,
      Array.isArray(filters.country) ? undefined : filters.country
    )
    const rows = flattenPricesV3(raw)
    const filtered = filterPricesV3(rows, filters)
    filtered.sort((a, b) => a.price - b.price)
    return paginate(filtered, paginationOpts)
  }

  async getPricesV3All(): Promise<FlatPriceV3Row[]> {
    const raw = await this.getRawPricesV3()
    const rows = flattenPricesV3(raw)
    rows.sort((a, b) => a.price - b.price)
    return rows
  }

  async getPricesV3(country: string, service: string): Promise<PriceV3Entry | null> {
    const raw = await this.getRawPricesV3(service, country)
    if (raw[country] && raw[country][service]) {
      return raw[country][service]
    }
    return null
  }

  clearCache(): void {
    this.cache.clear()
    this.log.info('cache_cleared', {})
  }
}
