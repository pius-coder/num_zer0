export interface ActivationInfo {
  id: string
  serviceSlug: string
  countryCode: string
  phoneNumber: string | null
  smsCode: string | null
  state: 'requested' | 'assigned' | 'completed' | 'cancelled' | 'expired'
  creditsCharged: number
  createdAt: string
  completedAt: string | null
  cancelledAt: string | null
  timerExpiresAt: string | null
}

export interface RequestActivationInput {
  serviceCode: string
  countryCode: string
  holdTimeMinutes: number
  idempotencyKey: string
}

export interface PaginatedActivations {
  items: ActivationInfo[]
  nextCursor: string | null
  total: number
}
