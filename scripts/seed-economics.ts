import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import process from 'node:process'
import postgres from 'postgres'
import {
  creditPackage,
  platformConfig,
  service,
  serviceCountryPrice,
  provider,
  fraudRule,
} from '@/database/schema'

config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client)

const configRows = [
  { key: 'credit_value_xaf', value: '2.6', valueType: 'number' as const, category: 'credits' },
  { key: 'bonus_expiry_days', value: '90', valueType: 'number' as const, category: 'credits' },
  { key: 'promo_expiry_days', value: '30', valueType: 'number' as const, category: 'credits' },
  { key: 'first_purchase_bonus', value: '100', valueType: 'number' as const, category: 'credits' },
  { key: 'four_eyes_threshold', value: '1000', valueType: 'number' as const, category: 'credits' },
  { key: 'min_margin_multiplier', value: '1.6', valueType: 'number' as const, category: 'pricing' },
  { key: 'usd_to_xaf_rate', value: '650', valueType: 'number' as const, category: 'pricing' },
  { key: 'momo_fee_pct', value: '0.015', valueType: 'number' as const, category: 'momo' },
  { key: 'momo_absorb_below_xaf', value: '5000', valueType: 'number' as const, category: 'momo' },
  { key: 'referrer_commission_pct', value: '5', valueType: 'number' as const, category: 'referral' },
  { key: 'max_verifications_per_hour', value: '50', valueType: 'number' as const, category: 'fraud' },
]

const packageRows = [
  { id: 'pkg_starter', slug: 'starter', nameFr: 'Débutant', nameEn: 'Starter', credits: 500, priceXaf: 1500, bonusPct: 0, sortOrder: 1 },
  { id: 'pkg_basic', slug: 'basic', nameFr: 'Basique', nameEn: 'Basic', credits: 1000, priceXaf: 2750, bonusPct: 5, sortOrder: 2 },
  { id: 'pkg_popular', slug: 'popular', nameFr: 'Populaire', nameEn: 'Popular', credits: 2500, priceXaf: 6500, bonusPct: 10, label: 'PLUS_POPULAIRE', sortOrder: 3 },
]

const serviceRows = [
  { id: 'svc_whatsapp', code: 'whatsapp', apiCode: 'wa', nameFr: 'WhatsApp', nameEn: 'WhatsApp', defaultPriceCredits: 120, defaultFloorCredits: 80 },
  { id: 'svc_telegram', code: 'telegram', apiCode: 'tg', nameFr: 'Telegram', nameEn: 'Telegram', defaultPriceCredits: 80, defaultFloorCredits: 50 },
  { id: 'svc_google', code: 'google', apiCode: 'go', nameFr: 'Google', nameEn: 'Google', defaultPriceCredits: 150, defaultFloorCredits: 100 },
]

const serviceCountryRows = [
  { id: 'scp_wa_cm', serviceId: 'svc_whatsapp', countryCode: 'CM', priceCredits: 120, floorCredits: 80, baselineWholesaleUsd: '0.12' },
  { id: 'scp_wa_us', serviceId: 'svc_whatsapp', countryCode: 'US', priceCredits: 350, floorCredits: 200, baselineWholesaleUsd: '0.35' },
  { id: 'scp_tg_cm', serviceId: 'svc_telegram', countryCode: 'CM', priceCredits: 80, floorCredits: 50, baselineWholesaleUsd: '0.08' },
]

const providerRows = [
  { id: 'prov_grizzly', code: 'grizzlysms', name: 'GrizzlySMS', apiBaseUrl: 'https://api.grizzlysms.com', apiKeyEncrypted: 'placeholder:rotate-me', priority: 1 },
  { id: 'prov_smsactivate', code: 'sms_activate', name: 'SMS-Activate', apiBaseUrl: 'https://api.sms-activate.ae', apiKeyEncrypted: 'placeholder:rotate-me', priority: 2 },
]

const fraudRuleRows = [
  { id: 'fr_rapid', name: 'Rapid Consumption', signalType: 'rapid_consumption', threshold: '50', action: 'rate_limit' as const },
  { id: 'fr_refund', name: 'Refund Abuse', signalType: 'refund_abuse', threshold: '40', action: 'soft_ban' as const },
]

const upsertConfig = async () => {
  for (const row of configRows) {
    const existing = await db
      .select({ key: platformConfig.key })
      .from(platformConfig)
      .where(eq(platformConfig.key, row.key))
      .limit(1)
    if (existing.length === 0) {
      await db.insert(platformConfig).values({
        key: row.key,
        value: row.value,
        valueType: row.valueType,
        category: row.category,
      })
    }
  }
}

const upsertSimpleById = async <T extends { id: string }>(
  table: any,
  rows: T[]
) => {
  for (const row of rows) {
    const existing = await db.select({ id: table.id }).from(table).where(eq(table.id, row.id)).limit(1)
    if (existing.length === 0) {
      await db.insert(table).values(row)
    }
  }
}

const main = async () => {
  await upsertConfig()
  await upsertSimpleById(creditPackage, packageRows)
  await upsertSimpleById(service, serviceRows)
  await upsertSimpleById(serviceCountryPrice, serviceCountryRows)
  await upsertSimpleById(provider, providerRows)
  await upsertSimpleById(fraudRule, fraudRuleRows)
  console.log('Economics seed completed')
}

main()
  .catch((error) => {
    console.error('Economics seed failed', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await client.end()
  })
