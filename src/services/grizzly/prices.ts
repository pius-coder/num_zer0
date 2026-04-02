import type { GrizzlyPriceRow } from './types'
import type { GrizzlyClient } from './client'

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

export async function getRawPricesV3(
  client: GrizzlyClient,
  service?: string,
  country?: string
): Promise<PricesRaw> {
  return (client as unknown as { getRawPricesV3: typeof getRawPricesV3 }).getRawPricesV3(
    service,
    country
  )
}

export function searchPricesV3(
  raw: PricesRaw,
  filters: { service?: string; country?: string; minCount?: number } = {},
  pagination?: { page?: number; pageSize?: number }
): { data: GrizzlyPriceRow[]; total: number; page: number; pageSize: number } {
  const rows: GrizzlyPriceRow[] = []
  for (const [countryKey, services] of Object.entries(raw)) {
    for (const [serviceKey, entry] of Object.entries(services)) {
      if (filters.country && countryKey !== filters.country) continue
      if (filters.service && serviceKey !== filters.service) continue
      if (filters.minCount && entry.count < filters.minCount) continue
      const providers = entry.providers
        ? Object.values(entry.providers).map((p) => ({
            count: p.count,
            price: p.price,
            provider_id: p.provider_id,
          }))
        : []
      rows.push({
        country: countryKey,
        service: serviceKey,
        price: entry.price,
        count: entry.count,
        providers,
      })
    }
  }
  rows.sort((a, b) => a.price - b.price)
  const page = pagination?.page ?? 1
  const pageSize = pagination?.pageSize ?? 50
  const offset = (page - 1) * pageSize
  return { data: rows.slice(offset, offset + pageSize), total: rows.length, page, pageSize }
}
