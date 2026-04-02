import { BaseService } from '../base.service'
import { TTLCache } from './cache'
import type {
  GrizzlyActivation,
  GrizzlyActivationStatusV2,
  GrizzlyCountryItem,
  GrizzlyGetNumberOptions,
  GrizzlyPriceRow,
  GrizzlyServiceItem,
  GrizzlySetStatusCode,
  GrizzlySetStatusResponse,
} from './types'
import { searchPricesV3 } from './prices'
import * as activation from './activation'
import * as catalog from './catalog'

type PricesRaw = Record<
  string,
  Record<
    string,
    {
      price: number
      count: number
      providers: Record<string, { count: number; price: number[]; provider_id: string }> | null
    }
  >
>

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

  async getBalance(): Promise<number> {
    return activation.getBalance(this, this._apiKey)
  }

  async getServicesList(): Promise<GrizzlyServiceItem[]> {
    return catalog.getServicesList(this, this._apiKey, this.cache)
  }

  async getCountries(): Promise<GrizzlyCountryItem[]> {
    return catalog.getCountries(this, this._apiKey, this.cache)
  }

  async getRawPricesV3(service?: string, country?: string): Promise<PricesRaw> {
    const key = `grizzly_prices:${service ?? '*'}:${country ?? '*'}`
    const cached = this.cache.get<PricesRaw>(key)
    if (cached) return cached
    return this.withRetry(async () => {
      const raw = await this.httpGet<PricesRaw>('', {
        params: {
          api_key: this._apiKey,
          action: 'getPricesV3',
          ...(service && { service }),
          ...(country && { country }),
        },
      })
      this.cache.set(key, raw)
      return raw
    }, 'getRawPricesV3')
  }

  async searchPricesV3(
    filters: { service?: string; country?: string; minCount?: number } = {},
    pagination?: { page?: number; pageSize?: number }
  ): Promise<{ data: GrizzlyPriceRow[]; total: number; page: number; pageSize: number }> {
    const raw = await this.getRawPricesV3(filters.service, filters.country)
    return searchPricesV3(raw, filters, pagination)
  }

  clearCache(): void {
    this.cache.clear()
    this.log.info('cache_cleared', {})
  }
}
