import { eq, sql, min } from 'drizzle-orm'
import { db } from '../src/database'
import {
  priceRule,
  providerServiceCost,
  provider,
  externalServiceMapping,
} from '../src/database/schema'

const USD_TO_XAF = 650
const CREDIT_VALUE_XAF = 2.6
const MIN_MARGIN_MULTIPLIER = 1.6
const PRICE_MULTIPLIER = 2.5

function calcPriceCredits(wholesaleUsd: number): { priceCredits: number; floorCredits: number } {
  const wholesaleXaf = wholesaleUsd * USD_TO_XAF
  const wholesaleCredits = wholesaleXaf / CREDIT_VALUE_XAF
  return {
    priceCredits: Math.ceil(wholesaleCredits * PRICE_MULTIPLIER),
    floorCredits: Math.ceil(wholesaleCredits * MIN_MARGIN_MULTIPLIER),
  }
}

async function recalculatePrices() {
  console.log('🔄 Recalculating all price_rules from provider costs...\n')

  const mappings = await db.select().from(externalServiceMapping)
  const slugToExternal = new Map<string, string>()
  for (const m of mappings) slugToExternal.set(m.localSlug, m.externalApiCode)

  const cheapestCosts = await db
    .select({
      serviceCode: providerServiceCost.serviceCode,
      countryCode: providerServiceCost.countryCode,
      minCostUsd: min(providerServiceCost.costUsd),
      availability: providerServiceCost.availability,
    })
    .from(providerServiceCost)
    .innerJoin(provider, eq(providerServiceCost.providerId, provider.id))
    .where(eq(provider.isActive, true))
    .groupBy(
      providerServiceCost.serviceCode,
      providerServiceCost.countryCode,
      providerServiceCost.availability
    )

  const extCostMap = new Map<string, { minCostUsd: number; availability: number }>()
  for (const row of cheapestCosts) {
    const key = `${row.serviceCode}::${row.countryCode}`
    const cost = Number(row.minCostUsd)
    const existing = extCostMap.get(key)
    if (!existing || cost < existing.minCostUsd) {
      extCostMap.set(key, { minCostUsd: cost, availability: row.availability })
    }
  }

  console.log(`📦 ${slugToExternal.size} mappings, ${extCostMap.size} provider costs`)

  const allRules = await db
    .select({
      id: priceRule.id,
      serviceSlug: priceRule.serviceSlug,
      countryIso: priceRule.countryIso,
      oldPriceCredits: priceRule.priceCredits,
      oldFloorCredits: priceRule.floorCredits,
      oldBaseline: priceRule.baselineWholesaleUsd,
    })
    .from(priceRule)
    .where(eq(priceRule.isActive, true))

  console.log(`📋 ${allRules.length} active price_rules\n`)

  const updates: {
    id: string
    priceCredits: number
    floorCredits: number
    baselineWholesaleUsd: string
    cachedAvailability: number
  }[] = []

  let skipped = 0
  let noProvider = 0
  let noMapping = 0

  for (const rule of allRules) {
    const extCode = slugToExternal.get(rule.serviceSlug)
    if (!extCode) {
      noMapping++
      continue
    }

    const key = `${extCode}::${rule.countryIso}`
    const costData = extCostMap.get(key)
    if (!costData || costData.minCostUsd <= 0) {
      noProvider++
      continue
    }

    const { priceCredits, floorCredits } = calcPriceCredits(costData.minCostUsd)
    if (
      priceCredits === rule.oldPriceCredits &&
      floorCredits === rule.oldFloorCredits &&
      Number.parseFloat(rule.oldBaseline ?? '0') === costData.minCostUsd
    ) {
      skipped++
      continue
    }

    updates.push({
      id: rule.id,
      priceCredits,
      floorCredits,
      baselineWholesaleUsd: costData.minCostUsd.toFixed(4),
      cachedAvailability: costData.availability,
    })
  }

  console.log(
    `📊 Updating ${updates.length} rules (${skipped} unchanged, ${noProvider} no cost, ${noMapping} no mapping)\n`
  )

  // Use raw SQL for batch update with proper type casting
  if (updates.length > 0) {
    const valuesClause = updates
      .map(
        (u) =>
          `('${u.id.replace(/'/g, "''")}', ${u.priceCredits}, ${u.floorCredits}, ${u.baselineWholesaleUsd}, ${u.cachedAvailability})`
      )
      .join(', ')

    await db.execute(sql`
      WITH new_values(id, pc, fc, bl, ca) AS (VALUES ${sql.raw(valuesClause)})
      UPDATE price_rule
      SET price_credits = nv.pc::integer,
          floor_credits = nv.fc::integer,
          baseline_wholesale_usd = nv.bl::numeric,
          cached_availability = nv.ca::integer,
          updated_at = NOW()
      FROM new_values nv
      WHERE price_rule.id = nv.id
    `)
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Updated: ${updates.length}`)
  console.log(`   ⏭️  Unchanged: ${skipped}`)
  console.log(`   ❌ No provider cost: ${noProvider}`)
  console.log(`   ❌ No external mapping: ${noMapping}`)
  console.log(`   📦 Total checked: ${allRules.length}`)
}

recalculatePrices()
  .then(() => {
    console.log('\n✅ Done.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Failed:', err)
    process.exit(1)
  })
