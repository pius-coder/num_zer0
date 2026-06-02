export interface ServiceItem {
  slug: string
  name: string
  category: string
  icon: string | null
  hasPrices: boolean
  countryCount: number
}

export interface SubProviderDetail {
  providerCode: string
  count: number
  priceCredits: number
}

export type PriceSource = 'override' | 'computed'

export interface CountryItem {
  countryIso: string
  name: string
  icon: string | null
  priceCredits: number
  availability: number
  source: PriceSource
  providerCount: number
  subProviders: SubProviderDetail[]
}
