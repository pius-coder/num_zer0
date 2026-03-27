import { asc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { platformConfig } from '@/database/schema'
import { createLogger } from '@/lib/logger'

const log = createLogger({ prefix: 'economics-config' })

type ValueType = 'string' | 'number' | 'boolean' | 'json'

export type EconomicsConfigValue = string | number | boolean | unknown[]

const DEFAULT_CONFIG: Record<string, { valueType: ValueType; value: EconomicsConfigValue }> = {
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
  fapshi_confirmation_email: { valueType: 'string', value: 'myuser@email.com' },
}

let configCache: Map<string, { value: EconomicsConfigValue; valueType: ValueType }> | null = null

const parseValue = (raw: string, valueType: ValueType): EconomicsConfigValue => {
  if (valueType === 'number') {
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (valueType === 'boolean') {
    return raw === 'true' || raw === '1'
  }
  if (valueType === 'json') {
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }
  return raw
}

const serializeValue = (value: EconomicsConfigValue, valueType: ValueType): string => {
  if (valueType === 'json') {
    return JSON.stringify(value)
  }
  return String(value)
}

export const loadEconomicsConfig = async (forceRefresh = false) => {
  if (configCache && !forceRefresh) {
    return configCache
  }

  const map = new Map<string, { value: EconomicsConfigValue; valueType: ValueType }>()
  for (const [key, fallback] of Object.entries(DEFAULT_CONFIG)) {
    map.set(key, fallback)
  }

  const rows = await db
    .select()
    .from(platformConfig)
    .orderBy(asc(platformConfig.key))

  for (const row of rows) {
    const valueType = row.valueType as ValueType
    map.set(row.key, { value: parseValue(row.value, valueType), valueType })
  }

  configCache = map
  return map
}

export const invalidateEconomicsConfigCache = () => {
  configCache = null
}

export const getEconomicsConfigNumber = async (key: string): Promise<number> => {
  const entries = await loadEconomicsConfig()
  const entry = entries.get(key)
  if (!entry) {
    log.warn('missing_number_config_key', { key })
    return 0
  }
  return Number(entry.value)
}

export const getEconomicsConfigBoolean = async (key: string): Promise<boolean> => {
  const entries = await loadEconomicsConfig()
  const entry = entries.get(key)
  if (!entry) {
    return false
  }
  return Boolean(entry.value)
}

export const getEconomicsConfigString = async (key: string): Promise<string> => {
  const entries = await loadEconomicsConfig()
  const entry = entries.get(key)
  if (!entry) {
    log.warn('missing_string_config_key', { key })
    return ''
  }
  return String(entry.value)
}

export const getEconomicsConfigJson = async <T>(key: string): Promise<T | null> => {
  const entries = await loadEconomicsConfig()
  const entry = entries.get(key)
  if (!entry) {
    return null
  }
  return entry.value as T
}

export const setEconomicsConfigValue = async (
  key: string,
  value: EconomicsConfigValue,
  valueType: ValueType,
  updatedBy?: string
) => {
  const valueString = serializeValue(value, valueType)
  const existing = await db.query.platformConfig.findFirst({
    where: eq(platformConfig.key, key),
  })

  if (existing) {
    await db
      .update(platformConfig)
      .set({
        value: valueString,
        valueType,
        updatedBy: updatedBy ?? null,
        updatedAt: new Date(),
      })
      .where(eq(platformConfig.key, key))
  } else {
    await db.insert(platformConfig).values({
      key,
      value: valueString,
      valueType,
      category: 'economics',
      updatedBy: updatedBy ?? null,
    })
  }

  invalidateEconomicsConfigCache()
}
