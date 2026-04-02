export interface GrizzlyGetNumberOptions {
  service: string
  country?: string
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

export interface GrizzlyPriceRow {
  country: string
  service: string
  price: number
  count: number
  providers: Array<{
    count: number
    price: number[]
    provider_id: string
  }>
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
