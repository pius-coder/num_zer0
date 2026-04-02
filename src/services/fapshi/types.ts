export type Environment = 'sandbox' | 'live'

export type TransactionStatus = 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED'

export type PaymentMedium = 'mobile money' | 'orange money'

export type PayoutMedium = 'mobile money' | 'orange money' | 'fapshi'

export interface GenerateLinkRequest {
  amount: number
  email?: string
  redirectUrl?: string
  userId?: string
  externalId?: string
  message?: string
}

export interface GenerateLinkResponse {
  link: string
  transId: string
  dateInitiated: string
}

export interface DirectPayRequest {
  amount: number
  phone: string
  medium?: PaymentMedium
  name?: string
  email?: string
  userId?: string
  externalId?: string
  message?: string
}

export interface DirectPayResponse {
  transId: string
  dateInitiated: string
}

export interface Transaction {
  transId: string
  status: TransactionStatus
  medium?: PaymentMedium
  serviceName?: string
  amount: number
  revenue?: number
  payerName?: string
  email?: string
  redirectUrl?: string
  externalId?: string
  userId?: string
  webhook?: string
  financialTransId?: string
  dateInitiated: string
  dateConfirmed?: string
}

export interface SearchParams {
  status?: TransactionStatus
  medium?: PaymentMedium
  start?: string
  end?: string
  amt?: number
  limit?: number
  sort?: string
}

export interface PayoutRequest {
  amount: number
  phone?: string
  medium?: PayoutMedium
  name?: string
  email?: string
  userId?: string
  externalId?: string
  message?: string
}

export interface PayoutResponse {
  transId: string
  dateInitiated: string
}

export interface BalanceResponse {
  service: string
  balance: number
  currency: string
}
