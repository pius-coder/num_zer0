// ============================================================
// MODULE ECONOMIQUE - SYSTEME DE CREDITS
// Base sur le rapport economique v1.0
// ============================================================
import {
  getEconomicsConfigJson,
  getEconomicsConfigNumber,
  loadEconomicsConfig,
} from './config-service'

// --- 1. CONSTANTES ECONOMIQUES ---

export const CREDIT_BASE_RATIO = 100 as const

export const CREDIT_PACKAGES = [
  { id: 'starter', credits: 500, price_xaf: 1500, bonus_pct: 0, label: null },
  { id: 'basic', credits: 1000, price_xaf: 2750, bonus_pct: 5, label: null },
  { id: 'popular', credits: 2500, price_xaf: 6500, bonus_pct: 10, label: 'PLUS_POPULAIRE' },
  { id: 'value', credits: 5000, price_xaf: 12000, bonus_pct: 15, label: 'MEILLEUR_RAPPORT' },
  { id: 'pro', credits: 10000, price_xaf: 22000, bonus_pct: 20, label: null },
  { id: 'business', credits: 25000, price_xaf: 50000, bonus_pct: 30, label: null },
  { id: 'enterprise', credits: 50000, price_xaf: 90000, bonus_pct: 35, label: 'POUR_EQUIPES' },
] as const

export const CREDIT_TYPES = {
  BASE: 'base',
  BONUS: 'bonus',
  PROMO: 'promotional',
} as const

export const EXPIRATION_POLICIES = {
  base: null,
  bonus: 90 * 24 * 3600,
  promo: 30 * 24 * 3600,
} as const

export const EXPIRATION_WARNINGS = [7, 1] as const

export const BREAKAGE_TARGET = { min: 0.08, max: 0.12 } as const

export const SERVICE_PRICING = {
  whatsapp: { CM: 120, US: 350, IN: 80, DEFAULT: 120 },
  telegram: { CM: 80, US: 250, IN: 60, DEFAULT: 80 },
  google: { CM: 150, US: 400, IN: 100, DEFAULT: 150 },
  facebook: { CM: 100, US: 300, IN: 70, DEFAULT: 100 },
  tiktok: { CM: 70, US: 200, IN: 50, DEFAULT: 70 },
} as const

export const MARGIN_TARGETS = {
  high_demand: { min: 0.8, max: 1.5 },
  medium_demand: { min: 0.6, max: 1.2 },
  low_demand: { min: 1.0, max: 2.0 },
  premium: { min: 1.5, max: 2.5 },
} as const

export const DYNAMIC_PRICING_RULES = {
  min_margin_multiplier: 1.6,
  low_availability_threshold: 50,
  low_availability_increase_pct: 15,
  wholesale_increase_trigger_pct: 10,
  wholesale_increase_response_pct: 15,
} as const

export const FRAUD_THRESHOLDS = {
  max_verifications_per_hour: 50,
  rate_limit_per_hour: 10,
  max_consecutive_refunds: 3,
  cancel_rate_flag_pct: 40,
  cancel_rate_min_attempts: 20,
  soft_ban_after_failures: 10,
  soft_ban_duration_hours: 1,
  multi_country_login_threshold: 3,
  multi_country_window_hours: 24,
} as const

export const AGENT_TIERS = {
  bronze: { min_monthly_credits: 25000, discount_pct: 10, commission_pct: 5 },
  silver: { min_monthly_credits: 100000, discount_pct: 18, commission_pct: 8 },
  gold: { min_monthly_credits: 500000, discount_pct: 25, commission_pct: 10 },
} as const

export const VIP_TIERS = {
  free: { monthly_fee_xaf: 0, bonus_credits: 0, priority: false, hold_time_min: 5 },
  vip: { monthly_fee_xaf: 2500, bonus_credits: 500, priority: true, hold_time_min: 10 },
  pro: { monthly_fee_xaf: 7500, bonus_credits: 2000, priority: true, hold_time_min: 15 },
} as const

export const REFERRAL_CONFIG = {
  referrer_bonus: 100,
  referee_bonus: 50,
  referrer_commission_pct: 5,
  commission_purchases: 3,
  max_referral_earnings: 10000,
  bonus_expiry_days: 90,
} as const

export const MOMO_FEE_STRATEGY = {
  absorb_below_xaf: 5000,
  fee_percentage: 0.015,
  split_threshold_xaf: 6500,
  split_ratio: 0.5,
} as const

export const PROVIDER_ROUTING = {
  providers: ['grizzlysms', 'sms_activate', '5sim', 'sms_man'],
  cache_ttl_seconds: 60,
  reliability_penalty_multiplier: 2,
  max_retry_attempts: 3,
} as const

export const ADMIN_METRICS = {
  credit_velocity_target_days: 7,
  credit_velocity_warning_days: 14,
  breakage_rate_target: { min: 0.08, max: 0.12 },
  arpu_credits_target: 500,
  arpu_xaf_target: 4000,
  clv_xaf_target: 35000,
  churn_balance_warning_pct: 60,
  margin_alert_below: 0.4,
  daily_spend_alert_multiplier: 1.2,
  provider_error_rate_alert: 0.15,
} as const

export const CREDIT_VALUE_XAF = 2.6 as const

// --- 2. MODELES DE DONNEES ---

export type CreditType = (typeof CREDIT_TYPES)[keyof typeof CREDIT_TYPES]
export type ProviderName = (typeof PROVIDER_ROUTING.providers)[number]
export type VipTier = keyof typeof VIP_TIERS
export type PackageId = (typeof CREDIT_PACKAGES)[number]['id']
export type ServiceCode = keyof typeof SERVICE_PRICING

export interface CreditPackage {
  id: PackageId
  credits: number
  price_xaf: number
  bonus_pct: number
  label: string | null
}

export interface CreditBalance {
  base: number
  bonus: number
  promotional: number
}

export interface CreditLot {
  type: CreditType
  amount: number
  expiresAt: Date | null
}

export interface CreditTransaction {
  txn_id: string
  type:
    | 'debit_credits'
    | 'purchase_credits'
    | 'refund_credits'
    | 'bonus_credits'
    | 'adjustment_credits'
    | 'hold_credits'
    | 'release_hold_credits'
  user_id: string
  amount_credits: number
  credit_type: CreditType
  service: ServiceCode | null
  provider: ProviderName | null
  wholesale_cost_usd: number | null
  status: 'completed' | 'pending' | 'refunded' | 'failed'
  payment_method: 'mtn_momo' | 'orange_money' | 'card' | null
  payment_ref: string | null
  ip_address: string | null
  device_fingerprint: string | null
  timestamp: Date
  admin_note: string | null
}

export interface ServicePricing {
  service: ServiceCode
  countryCode: string
  credits: number
}

export interface DynamicPricingRule {
  min_margin_multiplier: number
  low_availability_threshold: number
  low_availability_increase_pct: number
  wholesale_increase_trigger_pct: number
  wholesale_increase_response_pct: number
}

export interface ProviderCost {
  provider: ProviderName
  service: ServiceCode
  countryCode: string
  costUsd: number
  availability: number
  successRate30d: number
}

export interface UserSegment {
  id: 'high_value' | 'regular' | 'occasional' | 'dormant' | 'lost'
  minCreditsPerMonth: number
  maxCreditsPerMonth: number | null
}

export interface AgentTier {
  tier: keyof typeof AGENT_TIERS
  min_monthly_credits: number
  discount_pct: number
  commission_pct: number
}

export interface PromoCode {
  code: string
  bonusCredits: number
  discountPct: number
  usageLimit: number
  usedCount: number
  expiresAt: Date
  singleUsePerUser: boolean
  newUsersOnly: boolean
}

export interface HoldResult {
  ok: boolean
  reason?: string
  hold?: HoldReservation
}

export interface HoldReservation {
  holdId: string
  userId: string
  service: ServiceCode
  countryCode: string
  amount: number
  creditType: CreditType
  state: HoldState
  provider?: ProviderName
  createdAt: Date
  timerMinutes: number
}

export type HoldState =
  | 'REQUEST_NUMBER'
  | 'HOLD'
  | 'API_CALL'
  | 'SUCCESS'
  | 'TIMER_START'
  | 'SMS_RECEIVED'
  | 'DEBIT_CONFIRMED'
  | 'TIMEOUT'
  | 'USER_CANCEL'
  | 'FAILURE'
  | 'REFUND_100'
  | 'RETRY'
  | 'ABANDON'
  | 'DONE'

export interface FraudSignals {
  verificationsLastHour: number
  consecutiveRefundsByService: number
  cancelRatePct: number
  cancelAttempts: number
  consecutiveFailures: number
  countriesLast24h: number
}

// --- 3. FORFAITS DE CREDITS ---

/**
 * Retourne tous les forfaits normalises sous forme mutable.
 */
export const getCreditPackages = (): CreditPackage[] =>
  CREDIT_PACKAGES.map((p) => ({
    id: p.id,
    credits: p.credits,
    price_xaf: p.price_xaf,
    bonus_pct: p.bonus_pct,
    label: p.label,
  }))

/**
 * Calcule le bonus en credits pour un forfait.
 */
export const calculatePackageBonus = (pack: CreditPackage): number =>
  Math.floor((pack.credits * pack.bonus_pct) / 100)

/**
 * Calcule les credits effectifs (base + bonus).
 */
export const getEffectiveCredits = (pack: CreditPackage): number => pack.credits + calculatePackageBonus(pack)

// --- 4. TARIFICATION DES SERVICES ---

/**
 * Donne le prix en credits pour un service/pays selon la table du rapport.
 */
export const getServiceCreditPrice = (service: ServiceCode, countryCode: string): number => {
  const cfg = SERVICE_PRICING[service]
  const direct = cfg[countryCode as keyof typeof cfg]
  return typeof direct === 'number' ? direct : cfg.DEFAULT
}

// --- 5. MOTEUR DE CREDITS (debit/credit/hold/refund) ---

/**
 * Donne l ordre de consommation des types de credits.
 */
export const creditSpendOrder: CreditType[] = [
  CREDIT_TYPES.PROMO,
  CREDIT_TYPES.BONUS,
  CREDIT_TYPES.BASE,
]

/**
 * Retourne le solde disponible total.
 */
export const getTotalBalance = (balance: CreditBalance): number =>
  balance.base + balance.bonus + balance.promotional

/**
 * Applique un achat de credits a un solde.
 */
export const applyCreditPurchase = (
  balance: CreditBalance,
  pack: CreditPackage
): { balance: CreditBalance; baseAdded: number; bonusAdded: number } => {
  const bonus = calculatePackageBonus(pack)
  return {
    balance: {
      ...balance,
      base: balance.base + pack.credits,
      bonus: balance.bonus + bonus,
    },
    baseAdded: pack.credits,
    bonusAdded: bonus,
  }
}

/**
 * Essaie de reserver un hold sur un seul type de credit.
 * Regle metier: ne jamais fractionner entre types.
 */
export const reserveCredits = (
  userId: string,
  balance: CreditBalance,
  amount: number,
  service: ServiceCode,
  countryCode: string,
  vipTier: VipTier
): HoldResult => {
  if (amount <= 0) {
    return { ok: false, reason: 'invalid_amount' }
  }

  const availableByType: Record<CreditType, number> = {
    base: balance.base,
    bonus: balance.bonus,
    promotional: balance.promotional,
  }

  const selectedType = creditSpendOrder.find((t) => availableByType[t] >= amount)

  if (!selectedType) {
    return { ok: false, reason: 'insufficient_single_credit_type' }
  }

  const hold: HoldReservation = {
    holdId: `hold_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    service,
    countryCode,
    amount,
    creditType: selectedType,
    state: 'HOLD',
    createdAt: new Date(),
    timerMinutes: VIP_TIERS[vipTier].hold_time_min,
  }

  return { ok: true, hold }
}

/**
 * Confirme le debit d un hold.
 */
export const confirmDebit = (
  balance: CreditBalance,
  hold: HoldReservation
): { balance: CreditBalance; state: HoldState } => {
  const next = { ...balance }
  if (hold.creditType === CREDIT_TYPES.PROMO) {
    next.promotional -= hold.amount
  } else if (hold.creditType === CREDIT_TYPES.BONUS) {
    next.bonus -= hold.amount
  } else {
    next.base -= hold.amount
  }
  return { balance: next, state: 'DEBIT_CONFIRMED' }
}

/**
 * Rembourse un hold confirme (cas d echec/time out).
 */
export const refundHold = (
  balance: CreditBalance,
  hold: HoldReservation
): { balance: CreditBalance; state: HoldState } => {
  const next = { ...balance }
  if (hold.creditType === CREDIT_TYPES.PROMO) {
    next.promotional += hold.amount
  } else if (hold.creditType === CREDIT_TYPES.BONUS) {
    next.bonus += hold.amount
  } else {
    next.base += hold.amount
  }
  return { balance: next, state: 'REFUND_100' }
}

/**
 * Fait evoluer l etat de la machine hold/debit/refund.
 */
export const transitionHoldState = (
  current: HoldState,
  event: 'api_success' | 'api_failure' | 'sms_received' | 'timeout' | 'user_cancel' | 'retry' | 'abandon'
): HoldState => {
  switch (current) {
    case 'REQUEST_NUMBER':
      return 'HOLD'
    case 'HOLD':
      return 'API_CALL'
    case 'API_CALL':
      return event === 'api_success' ? 'SUCCESS' : 'FAILURE'
    case 'SUCCESS':
      return 'TIMER_START'
    case 'TIMER_START':
      if (event === 'sms_received') return 'SMS_RECEIVED'
      if (event === 'timeout') return 'TIMEOUT'
      if (event === 'user_cancel') return 'USER_CANCEL'
      return current
    case 'FAILURE':
    case 'TIMEOUT':
    case 'USER_CANCEL':
      return 'REFUND_100'
    case 'SMS_RECEIVED':
      return 'DEBIT_CONFIRMED'
    case 'REFUND_100':
      if (event === 'retry') return 'RETRY'
      if (event === 'abandon') return 'ABANDON'
      return 'DONE'
    case 'RETRY':
      return 'API_CALL'
    case 'DEBIT_CONFIRMED':
    case 'ABANDON':
      return 'DONE'
    default:
      return current
  }
}

// --- 6. TARIFICATION DYNAMIQUE ---

/**
 * Calcule la marge brute en ratio (ex: 1.2 = 120%).
 */
export const calculateMarginRatio = (userPriceCredits: number, wholesaleUsd: number, xafPerCredit = CREDIT_VALUE_XAF): number => {
  const revenueXaf = userPriceCredits * xafPerCredit
  const wholesaleXaf = wholesaleUsd * 650
  return (revenueXaf - wholesaleXaf) / wholesaleXaf
}

/**
 * Calcule un prix plancher en credits base sur le cout de gros.
 */
export const getFloorPriceCredits = (wholesaleUsd: number): number => {
  const wholesaleXaf = wholesaleUsd * 650
  const floorXaf = wholesaleXaf * DYNAMIC_PRICING_RULES.min_margin_multiplier
  return Math.ceil(floorXaf / CREDIT_VALUE_XAF)
}

/**
 * Ajuste un prix selon disponibilite + variation cout.
 */
export const applyDynamicPricing = (
  baseCredits: number,
  availability: number,
  wholesaleDeltaPct: number
): number => {
  let result = baseCredits
  if (availability < DYNAMIC_PRICING_RULES.low_availability_threshold) {
    result = Math.ceil(result * (1 + DYNAMIC_PRICING_RULES.low_availability_increase_pct / 100))
  }
  if (wholesaleDeltaPct > DYNAMIC_PRICING_RULES.wholesale_increase_trigger_pct) {
    result = Math.ceil(result * (1 + DYNAMIC_PRICING_RULES.wholesale_increase_response_pct / 100))
  }
  return result
}

// --- 7. SYSTEME DE BONUS ---

/**
 * Calcule le bonus de premier achat.
 */
export const getFirstPurchaseBonus = (): number => 100

/**
 * Calcule les credits referral de niveau 2.
 */
export const getReferralCommissionCredits = (purchaseCredits: number): number =>
  Math.floor((purchaseCredits * REFERRAL_CONFIG.referrer_commission_pct) / 100)

// --- 8. EXPIRATION DES CREDITS ---

/**
 * Retourne la date d expiration d un lot selon son type.
 */
export const getCreditExpiry = (type: CreditType, now = new Date()): Date | null => {
  if (type === CREDIT_TYPES.BASE) return null
  const days = type === CREDIT_TYPES.BONUS ? 90 : 30
  return new Date(now.getTime() + days * 24 * 3600 * 1000)
}

/**
 * Retourne les avertissements J-7/J-1 pour un lot expirant.
 */
export const getExpirationWarningDates = (expiresAt: Date): Date[] =>
  EXPIRATION_WARNINGS.map((d) => new Date(expiresAt.getTime() - d * 24 * 3600 * 1000))

// --- 9. DETECTION DE FRAUDE ---

export interface FraudDecision {
  flagged: boolean
  hardBlock: boolean
  rateLimited: boolean
  reasons: string[]
}

/**
 * Evalue les signaux de fraude et propose une decision.
 */
export const evaluateFraudSignals = (signals: FraudSignals): FraudDecision => {
  const reasons: string[] = []
  let hardBlock = false
  let rateLimited = false

  if (signals.verificationsLastHour > FRAUD_THRESHOLDS.max_verifications_per_hour) {
    reasons.push('rapid_consumption')
    rateLimited = true
  }
  if (
    signals.cancelAttempts >= FRAUD_THRESHOLDS.cancel_rate_min_attempts &&
    signals.cancelRatePct > FRAUD_THRESHOLDS.cancel_rate_flag_pct
  ) {
    reasons.push('refund_abuse')
    hardBlock = true
  }
  if (signals.consecutiveRefundsByService > FRAUD_THRESHOLDS.max_consecutive_refunds) {
    reasons.push('consecutive_refunds')
    hardBlock = true
  }
  if (signals.consecutiveFailures >= FRAUD_THRESHOLDS.soft_ban_after_failures) {
    reasons.push('soft_ban_trigger')
    hardBlock = true
  }
  if (signals.countriesLast24h >= FRAUD_THRESHOLDS.multi_country_login_threshold) {
    reasons.push('geo_anomaly')
  }

  return {
    flagged: reasons.length > 0,
    hardBlock,
    rateLimited,
    reasons,
  }
}

// --- 10. PROGRAMME DE PARRAINAGE ---

/**
 * Retourne les bonus de parrainage immediate.
 */
export const getReferralSignupBonuses = (): { referrer: number; referee: number } => ({
  referrer: REFERRAL_CONFIG.referrer_bonus,
  referee: REFERRAL_CONFIG.referee_bonus,
})

// --- 11. NIVEAUX AGENTS/REVENDEURS ---

/**
 * Assigne le niveau agent selon volume mensuel.
 */
export const getAgentTier = (monthlyCredits: number): keyof typeof AGENT_TIERS | null => {
  if (monthlyCredits >= AGENT_TIERS.gold.min_monthly_credits) return 'gold'
  if (monthlyCredits >= AGENT_TIERS.silver.min_monthly_credits) return 'silver'
  if (monthlyCredits >= AGENT_TIERS.bronze.min_monthly_credits) return 'bronze'
  return null
}

// --- 12. CODES PROMOTIONNELS ---

/**
 * Valide si un code promo peut etre applique.
 */
export const canUsePromoCode = (promo: PromoCode, now = new Date()): boolean =>
  promo.usedCount < promo.usageLimit && promo.expiresAt > now

// --- 13. METRIQUES ADMIN DASHBOARD ---

/**
 * Calcule le nombre de verifications possibles et le reste.
 */
export const calculateVerificationCapacity = (
  totalCredits: number,
  servicePriceCredits: number
): { verifications: number; remainingCredits: number } => ({
  verifications: Math.floor(totalCredits / servicePriceCredits),
  remainingCredits: totalCredits % servicePriceCredits,
})

export interface AdminKpiInput {
  activeUsers: number
  monthlyCreditsConsumed: number
  monthlyRevenueXaf: number
  breakageRate: number
}

/**
 * Calcule un jeu minimum de KPI admin.
 */
export const computeAdminKpis = (input: AdminKpiInput) => {
  const arpuCredits = input.activeUsers > 0 ? input.monthlyCreditsConsumed / input.activeUsers : 0
  const arpuXaf = input.activeUsers > 0 ? input.monthlyRevenueXaf / input.activeUsers : 0
  return {
    arpuCredits,
    arpuXaf,
    breakageInTarget:
      input.breakageRate >= BREAKAGE_TARGET.min && input.breakageRate <= BREAKAGE_TARGET.max,
  }
}

// --- 14. ROUTAGE MULTI-FOURNISSEURS ---

export interface ProviderRouteScore {
  provider: ProviderName
  score: number
}

/**
 * Score les fournisseurs selon cout + penalite de fiabilite.
 */
export const scoreProvider = (cost: ProviderCost): ProviderRouteScore => {
  const penalty =
    (1 - cost.successRate30d) * cost.costUsd * PROVIDER_ROUTING.reliability_penalty_multiplier
  return {
    provider: cost.provider,
    score: cost.costUsd + penalty,
  }
}

/**
 * Selectionne le meilleur fournisseur selon score minimal.
 */
export const selectBestProvider = (costs: ProviderCost[]): ProviderName => {
  if (costs.length === 0) {
    throw new Error('no_provider_costs_available')
  }
  return costs
    .map(scoreProvider)
    .sort((a, b) => a.score - b.score)[0].provider
}

// --- 15. DB-DRIVEN ECONOMICS ACCESS ---

export interface EconomicsRuntime {
  creditValueXaf: number
  usdToXafRate: number
  minMarginMultiplier: number
  firstPurchaseBonus: number
  bonusExpiryDays: number
  promoExpiryDays: number
  expirationWarnings: number[]
  fraud: {
    maxVerificationsPerHour: number
    maxConsecutiveRefunds: number
    cancelRateFlagPct: number
    softBanAfterFailures: number
    geoAnomalyCountries24h: number
  }
}

export const getEconomicsRuntime = async (): Promise<EconomicsRuntime> => {
  await loadEconomicsConfig()
  const expirationWarnings = (await getEconomicsConfigJson<number[]>('expiration_warning_days')) ?? [7, 1]

  return {
    creditValueXaf: await getEconomicsConfigNumber('credit_value_xaf'),
    usdToXafRate: await getEconomicsConfigNumber('usd_to_xaf_rate'),
    minMarginMultiplier: await getEconomicsConfigNumber('min_margin_multiplier'),
    firstPurchaseBonus: await getEconomicsConfigNumber('first_purchase_bonus'),
    bonusExpiryDays: await getEconomicsConfigNumber('bonus_expiry_days'),
    promoExpiryDays: await getEconomicsConfigNumber('promo_expiry_days'),
    expirationWarnings,
    fraud: {
      maxVerificationsPerHour: await getEconomicsConfigNumber('max_verifications_per_hour'),
      maxConsecutiveRefunds: await getEconomicsConfigNumber('max_consecutive_refunds'),
      cancelRateFlagPct: await getEconomicsConfigNumber('cancel_rate_flag_pct'),
      softBanAfterFailures: await getEconomicsConfigNumber('soft_ban_after_failures'),
      geoAnomalyCountries24h: await getEconomicsConfigNumber('geo_anomaly_countries_24h'),
    },
  }
}

export const calculateMarginRatioFromConfig = async (
  userPriceCredits: number,
  wholesaleUsd: number
): Promise<number> => {
  const runtime = await getEconomicsRuntime()
  const revenueXaf = userPriceCredits * runtime.creditValueXaf
  const wholesaleXaf = wholesaleUsd * runtime.usdToXafRate
  return (revenueXaf - wholesaleXaf) / wholesaleXaf
}

export const getFloorPriceCreditsFromConfig = async (wholesaleUsd: number): Promise<number> => {
  const runtime = await getEconomicsRuntime()
  const wholesaleXaf = wholesaleUsd * runtime.usdToXafRate
  const floorXaf = wholesaleXaf * runtime.minMarginMultiplier
  return Math.ceil(floorXaf / runtime.creditValueXaf)
}
