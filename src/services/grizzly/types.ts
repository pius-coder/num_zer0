// ─── Activation ───────────────────────────────────────────────────────────────

export interface GrizzlyGetNumberOptions {
  service: string
  country?: string | 'any'
  maxPrice?: number
  providerIds?: number[]
  exceptProviderIds?: number[]
}

export type GrizzlyActivationStatus =
  | 'ACCESS_READY'
  | 'ACCESS_RETRY_GET'
  | 'ACCESS_ACTIVATION'
  | 'ACCESS_CANCEL'

export interface GrizzlyActivation {
  activationId: number
  phoneNumber: string
  activationCost: number
  currency: number
  countryCode: string
  canGetAnotherSms: boolean
  activationTime: string
}

export type GrizzlySetStatusCode = -1 | 1 | 3 | 6 | 8

export interface GrizzlySetStatusResponse {
  status: GrizzlyActivationStatus
  raw: string
}

export interface GrizzlyActivationStatusV2 {
  verificationType: number
  sms: {
    dateTime: string
    code: string
    text: string
  } | null
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export interface GrizzlyServiceItem {
  code: string
  name: string
}

export interface GrizzlyCountryItem {
  id: number
  rus: string
  eng: string
  chn: string
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

export interface GrizzlyPriceRow {
  country: string
  service: string
  price: number
  count: number
  providers: Array<{ count: number; price: number[]; provider_id: string }>
}

export interface ProviderInfo {
  count: number
  price: number[]
  provider_id: number
}

export interface PriceV3Entry {
  price: number
  count: number
  providers: Record<string, ProviderInfo> | null
}

export type PricesV3Raw = Record<string, Record<string, PriceV3Entry>>

// ─── Flattened / Normalised rows ──────────────────────────────────────────────

export interface FlatPriceV3Row {
  country: string
  service: string
  price: number
  count: number
  providers: ProviderInfo[]
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationOptions {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// ─── Filter Options ───────────────────────────────────────────────────────────

export interface PriceFilterOptions {
  country?: string | string[]
  service?: string | string[]
  minCost?: number
  maxCost?: number
  minCount?: number
}

export interface PriceV3FilterOptions extends PriceFilterOptions {
  providerId?: number
  minProviderCount?: number
}

export interface ServiceFilterOptions {
  query?: string
  codes?: string[]
}

export interface CountryFilterOptions {
  query?: string
  ids?: number[]
}
