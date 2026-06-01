export interface ServiceItem {
  slug: string
  name: string
  category: string
  icon: string | null
  hasPrices: boolean
  countryCount: number
}

export interface ServiceDetail extends ServiceItem {
  description?: string
  externalId?: string
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

export interface LivePrice {
  countryIso: string
  priceCredits: number
  availability: number
  providerCount: number
  subProviders: SubProvider[]
}

export interface SubProvider {
  providerCode: string
  count: number
  minPrice: number
  maxPrice: number
}

export interface ActivationQuote {
  serviceCode: string
  countryCode: string
  priceCredits: number
}
