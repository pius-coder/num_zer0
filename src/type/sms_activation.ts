/**
 * getOperators API returns:
 * { status: "success", countryOperators: { [countryCode]: string[] } }
 * This query extracts just the operator name array.
 */
export type GetOperatorsResult = string[]

/**
 * getPrices API returns:
 * { [countryCode]: { [service]: { cost: number, count: number } } }
 * Country code is the key, e.g. "1": { "wa": { cost: 2.42, count: 17 }, ... }
 */
export type GetPricesResult = Record<string, Record<string, { cost: number; count: number }>>

/** Mirrors the Convex activations table schema for client-side use */
export interface SmsActivation {
  _id: string
  _creationTime: number
  userId: string
  service: string
  country: string
  providerId?: number
  phoneNumber?: string
  status: SmsActivationStatus
  maxPrice: number
  operator?: string
  smsCode?: string
  canGetAnotherSms: boolean
  rentEndTime?: number
  providerCost?: number
  priceCharged: number
  errorMessage?: string
  createdAt: number
  updatedAt: number
}

export type SmsActivationStatus =
  | 'awaiting_number'
  | 'awaiting_sms'
  | 'sms_received'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'no_numbers'
  | 'max_price_too_low'

export interface InitiateActivationInput {
  service: string
  country: string
  maxPrice?: number
  operator?: string
}

export interface GetNumberQuantityResult {
  /** Service code → available count, e.g. { wa: 523, tg: 352 } */
  [serviceCode: string]: number
}

export interface TopCountryResult {
  country: number       // numeric sms-online.pro country code
  countryText: string   // country name
  count: number         // available numbers
  retailPrice: number   // retail price in USD
}

export interface SmsProviderError {
  code: 'NO_BALANCE' | 'NO_NUMBERS' | 'BAD_KEY' | 'WRONG_MAX_PRICE' | 'EARLY_CANCEL_DENIED' | 'NETWORK_ERROR'
  message: string
  minPrice?: number
}
