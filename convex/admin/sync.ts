import { query, action } from '../_generated/server'
import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { isoToNumeric, numericToIso } from '../sms_countries'

const API_BASE = 'https://sms-online.pro/stubs/handler_api.php'

async function smsProGet(params: Record<string, string>): Promise<string> {
  const apiKey = process.env.SMSONLINEPRO_API_KEY
  if (!apiKey) throw new Error('SMSONLINEPRO_API_KEY not configured')
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', apiKey)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  return res.text()
}

async function smsProGetJson(params: Record<string, string>): Promise<any> {
  const text = await smsProGet(params)
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const getAllActivations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Non authentifié')
    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) => q.eq('betterAuthUserId', identity.subject))
      .first()
    if (!user?.isAdmin) throw new Error('Non autorisé — Administrateur uniquement')
    return await ctx.db.query('activations').order('desc').take(100)
  },
})

export const getNumberQuantity = action({
  args: {
    country: v.string(),
  },
  handler: async (_, args) => {
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) return []

    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return []

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getNumbersStatus')
      url.searchParams.set('country', String(numericCountry))
      const res = await fetch(url.toString())
      const text = await res.text()
      const data = JSON.parse(text)
      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        const entries = Object.entries(data) as [string, number][]
        return entries.slice(0, 4096)
      }
      if (Array.isArray(data)) return data.slice(0, 4096)
      return []
    } catch {
      return []
    }
  },
})

export const getTopCountries = action({
  args: {
    service: v.string(),
  },
  handler: async (_, args) => {
    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return []

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getTopCountriesByService')
      url.searchParams.set('service', args.service)
      const res = await fetch(url.toString())
      const text = await res.text()
      const data = JSON.parse(text)

      if (typeof data !== 'object' || data === null || Array.isArray(data)) return []

      return (Object.values(data) as Record<string, unknown>[]).map((item) => ({
        country: Number(item.country),
        countryText: String(item.countryText ?? item.country),
        count: Number(item.count ?? item.country),
        retailPrice: Number(item.retail_price ?? item.retailPrice ?? item.price ?? 0),
        iso: numericToIso(Number(item.country)) ?? undefined,
      }))
    } catch {
      return []
    }
  },
})

export const syncPrices = action({
  args: {
    country: v.string(),
    service: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Non authentifié')
    const user = await ctx.runQuery(internal.users.internalGetUserByBetterAuthId, {
      betterAuthUserId: identity.subject,
    })
    if (!user?.isAdmin) throw new Error('Non autorisé — Administrateur uniquement')

    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) throw new Error(`Invalid country: ${args.country}`)

    const params: Record<string, string> = {
      action: 'getPrices',
      country: String(numericCountry),
    }
    if (args.service) params.service = args.service

    const prices = await smsProGetJson(params)
    return prices
  },
})

export const getOperators = action({
  args: {
    country: v.string(),
  },
  handler: async (_, args) => {
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) return []

    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return []

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getOperators')
      url.searchParams.set('country', String(numericCountry))
      const res = await fetch(url.toString())
      const text = await res.text()
      const data = JSON.parse(text)
      if (data?.status === 'success' && data?.countryOperators?.[String(numericCountry)]) {
        return data.countryOperators[String(numericCountry)] as string[]
      }
      return []
    } catch {
      return []
    }
  },
})

export const RENT_DURATIONS_HOURS = [
  { hours: 2, label: '2 heures' },
  { hours: 4, label: '4 heures' },
  { hours: 12, label: '12 heures' },
  { hours: 24, label: '1 jour' },
  { hours: 48, label: '2 jours' },
  { hours: 72, label: '3 jours' },
  { hours: 96, label: '4 jours' },
  { hours: 120, label: '5 jours' },
  { hours: 144, label: '6 jours' },
  { hours: 168, label: '7 jours' },
  { hours: 192, label: '8 jours' },
  { hours: 216, label: '9 jours' },
  { hours: 240, label: '10 jours' },
  { hours: 264, label: '11 jours' },
  { hours: 288, label: '12 jours' },
  { hours: 312, label: '13 jours' },
  { hours: 336, label: '14 jours' },
  { hours: 360, label: '15 jours' },
  { hours: 384, label: '16 jours' },
  { hours: 408, label: '17 jours' },
  { hours: 432, label: '18 jours' },
  { hours: 456, label: '19 jours' },
  { hours: 480, label: '20 jours' },
  { hours: 504, label: '21 jours' },
  { hours: 528, label: '22 jours' },
  { hours: 552, label: '23 jours' },
  { hours: 576, label: '24 jours' },
  { hours: 600, label: '25 jours' },
  { hours: 624, label: '26 jours' },
  { hours: 648, label: '27 jours' },
] as const

export const getRentPriceList = action({
  args: {
    country: v.string(),
    service: v.string(),
  },
  handler: async (_, args) => {
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) return []

    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return []

    try {
      const results = await Promise.all(
        RENT_DURATIONS_HOURS.map(async (dur) => {
          try {
            const url = new URL(API_BASE)
            url.searchParams.set('api_key', apiKey)
            url.searchParams.set('action', 'getRentServicesAndCountries')
            url.searchParams.set('country', String(numericCountry))
            url.searchParams.set('rent_time', String(dur.hours))
            const res = await fetch(url.toString())
            const text = await res.text()
            const data = JSON.parse(text)
            const svc = data?.services?.[args.service]
            return {
              hours: dur.hours,
              label: dur.label,
              cost: svc?.cost ?? null,
              qty: svc?.quant?.current ?? 0,
            }
          } catch {
            return { hours: dur.hours, label: dur.label, cost: null, qty: 0 }
          }
        }),
      )
      return results.filter((r) => r.cost !== null)
    } catch {
      return []
    }
  },
})

export const getPrices = action({
  args: {
    country: v.string(),
    service: v.optional(v.string()),
  },
  handler: async (_, args) => {
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) return {}

    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return {}

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getPrices')
      url.searchParams.set('country', String(numericCountry))
      if (args.service) url.searchParams.set('service', args.service)
      const res = await fetch(url.toString())
      const text = await res.text()
      return JSON.parse(text) as Record<string, Record<string, { cost: number; count: number }>>
    } catch {
      return {}
    }
  },
})

export const getFreePrices = action({
  args: {
    country: v.string(),
    service: v.string(),
  },
  handler: async (_, args) => {
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) return { defaultPrice: 0, freePriceMap: {} }

    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return { defaultPrice: 0, freePriceMap: {} }

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getTopCountriesByService')
      url.searchParams.set('service', args.service)
      url.searchParams.set('freePrice', '1')
      const res = await fetch(url.toString())
      const text = await res.text()
      const data = JSON.parse(text)

      for (const key of Object.keys(data)) {
        const entry = data[key]
        if (Number(entry.country) === numericCountry) {
          return {
            defaultPrice: Number(entry.defaultPrice ?? entry.price ?? 0),
            freePriceMap: entry.freePriceMap ?? {},
          }
        }
      }

      return { defaultPrice: 0, freePriceMap: {} }
    } catch {
      return { defaultPrice: 0, freePriceMap: {} }
    }
  },
})
