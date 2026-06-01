import { asc, eq } from 'drizzle-orm'

import { BaseService } from './base.service'
import { platformConfig } from '@/database/schema'

type ValueType = 'string' | 'number' | 'boolean' | 'json'
export type ConfigValue = string | number | boolean | unknown[]

const DEFAULTS: Record<string, { valueType: ValueType; value: ConfigValue }> = {
  credit_value_xaf: { valueType: 'number', value: 2.6 },
  bonus_expiry_days: { valueType: 'number', value: 90 },
  promo_expiry_days: { valueType: 'number', value: 30 },
  first_purchase_bonus: { valueType: 'number', value: 100 },
  four_eyes_threshold: { valueType: 'number', value: 1000 },
  min_margin_multiplier: { valueType: 'number', value: 1.6 },
  usd_to_xaf_rate: { valueType: 'number', value: 650 },
  max_verifications_per_hour: { valueType: 'number', value: 50 },
  max_consecutive_refunds: { valueType: 'number', value: 3 },
  cancel_rate_flag_pct: { valueType: 'number', value: 40 },
  soft_ban_after_failures: { valueType: 'number', value: 10 },
  geo_anomaly_countries_24h: { valueType: 'number', value: 3 },
  expiration_warning_days: { valueType: 'json', value: [7, 1] },
  fapshi_confirmation_email: { valueType: 'string', value: 'admin@numzero.app' },
}

export class EconomicsConfigService extends BaseService {
  private configCache: Map<string, { value: ConfigValue; valueType: ValueType }> | null = null

  constructor() {
    super({ prefix: 'economics-config', db: true })
  }

  async loadAll(forceRefresh = false) {
    if (this.configCache && !forceRefresh) return this.configCache

    const map = new Map<string, { value: ConfigValue; valueType: ValueType }>()
    for (const [key, fallback] of Object.entries(DEFAULTS)) map.set(key, fallback)

    const rows = await this.db.select().from(platformConfig).orderBy(asc(platformConfig.key))
    for (const row of rows) {
      const valueType = row.valueType as ValueType
      map.set(row.key, { value: this.parseValue(row.value, valueType), valueType })
    }

    this.configCache = map
    return map
  }

  invalidateCache() {
    this.configCache = null
  }

  async getNumber(key: string): Promise<number> {
    const entries = await this.loadAll()
    return Number((entries.get(key) ?? DEFAULTS[key])?.value ?? 0)
  }

  async getString(key: string): Promise<string> {
    const entries = await this.loadAll()
    return String((entries.get(key) ?? DEFAULTS[key])?.value ?? '')
  }

  async getBoolean(key: string): Promise<boolean> {
    const entries = await this.loadAll()
    return Boolean((entries.get(key) ?? DEFAULTS[key])?.value ?? false)
  }

  async getJson<T>(key: string): Promise<T | null> {
    const entries = await this.loadAll()
    return ((entries.get(key) ?? DEFAULTS[key])?.value as T) ?? null
  }

  async set(key: string, value: ConfigValue, valueType: ValueType, updatedBy?: string) {
    const valueString = valueType === 'json' ? JSON.stringify(value) : String(value)
    const existing = await this.db.query.platformConfig.findFirst({
      where: eq(platformConfig.key, key),
    })

    if (existing) {
      await this.db
        .update(platformConfig)
        .set({ value: valueString, valueType, updatedBy: updatedBy ?? null, updatedAt: new Date() })
        .where(eq(platformConfig.key, key))
    } else {
      await this.db.insert(platformConfig).values({
        key,
        value: valueString,
        valueType,
        category: 'economics',
        updatedBy: updatedBy ?? null,
      })
    }

    this.invalidateCache()
  }

  private parseValue(raw: string, valueType: ValueType): ConfigValue {
    if (valueType === 'number') {
      const n = Number(raw)
      return Number.isFinite(n) ? n : 0
    }
    if (valueType === 'boolean') return raw === 'true' || raw === '1'
    if (valueType === 'json') {
      try {
        return JSON.parse(raw)
      } catch {
        return []
      }
    }
    return raw
  }
}
