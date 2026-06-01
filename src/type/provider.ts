export interface ProviderCandidate {
  providerId: string
  providerCode: string
  serviceCode: string
  countryCode: string
  costUsd: number
  availability: number
  successRate30d: number
  score: number
}

export interface ProviderSyncResult {
  servicesSynced: number
  countriesSynced: number
  pricesUpdated?: number
}

export type ProviderStatus = 'active' | 'inactive' | 'error' | 'syncing'

export interface ProviderInfo {
  id: string
  name: string
  slug: string
  status: ProviderStatus
  currentBalanceUsd: number | null
  balanceLastCheckedAt: Date | null
}
