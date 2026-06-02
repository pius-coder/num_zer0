export interface Package {
  id: string
  slug: string
  name: string
  priceXaf: number
  description?: string
  isActive: boolean
}

export interface CreatePurchaseInput {
  packageId: string
  paymentMethod: 'mtn_momo' | 'orange_money' | 'card' | 'bank_transfer' | 'crypto'
  idempotencyKey: string
}

export interface CreatePurchaseResponse {
  purchase: {
    id: string
    packageId: string
    priceXaf: number
    paymentMethod: string
    status: string
    checkoutUrl: string | null
    idempotencyKey: string
    createdAt: string
  }
  payment: {
    link: string
    transId: string
  } | null
}
