export interface WalletBalance {
  base: number
  bonus: number
  promotional: number
  available: number
}

export interface CreditPackage {
  id: string
  slug: string
  name: string
  credits: number
  priceXaf: number
  bonusPct: number
}

export interface CreditTransactionInfo {
  id: string
  type: string
  creditType: string
  amount: number
  balanceAfter: number
  description: string
  createdAt: string
}

export interface CreatePurchaseInput {
  packageId: string
  paymentMethod: 'mtn_momo' | 'orange_money' | 'card' | 'bank_transfer' | 'crypto'
  idempotencyKey: string
}

export interface PurchaseResult {
  link: string
  transId: string
}

export interface CreatePurchaseResponse {
  purchase: {
    id: string
    userId: string
    packageId: string
    creditsBase: number
    creditsBonus: number
    totalCredits: number
    priceXaf: number
    paymentMethod: string
    status: string
    paymentRef: string | null
    paymentGatewayId: string | null
    checkoutUrl: string | null
    idempotencyKey: string
    createdAt: string
  }
  payment: PurchaseResult
}
