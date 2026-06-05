import { query } from './_generated/server'
import { v } from 'convex/values'

const DEFAULT_MARGIN_TIERS = [
  { maxUsd: 0.5, marginXaf: 1000 },
  { maxUsd: 1.0, marginXaf: 1500 },
  { maxUsd: Infinity, marginXaf: 2000 },
]

export function computeDefaultMargin(costUsd: number): number {
  for (const tier of DEFAULT_MARGIN_TIERS) {
    if (costUsd <= tier.maxUsd) return tier.marginXaf
  }
  return 2000
}

export const getEffectiveMargin = query({
  args: {
    countryIso: v.string(),
    serviceId: v.string(),
    costUsd: v.number(),
  },
  handler: async (ctx, args) => {
    const exactOverride = await ctx.db
      .query('marginOverrides')
      .withIndex('by_country_service', (q) =>
        q.eq('countryIso', args.countryIso).eq('serviceId', args.serviceId),
      )
      .first()

    if (exactOverride) {
      return { marginXaf: exactOverride.marginXaf, source: 'override' as const }
    }

    const wildcardOverride = await ctx.db
      .query('marginOverrides')
      .withIndex('by_country_service', (q) =>
        q.eq('countryIso', args.countryIso).eq('serviceId', '*'),
      )
      .first()

    if (wildcardOverride) {
      return { marginXaf: wildcardOverride.marginXaf, source: 'override' as const }
    }

    return { marginXaf: computeDefaultMargin(args.costUsd), source: 'default' as const }
  },
})
