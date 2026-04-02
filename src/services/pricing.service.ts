import { BaseService } from './base.service'
import { EconomicsConfigService } from './economics-config.service'

export interface PricingResult {
  priceCredits: number
  floorCredits: number
  marginRatio: number
}

export class PricingService extends BaseService {
  private config: EconomicsConfigService

  constructor() {
    super({ prefix: 'pricing-service' })
    this.config = new EconomicsConfigService()
  }

  async calculatePriceCredits(wholesaleUsd: number): Promise<PricingResult> {
    const [usdToXaf, creditValueXaf, minMargin] = await Promise.all([
      this.config.getNumber('usd_to_xaf_rate'),
      this.config.getNumber('credit_value_xaf'),
      this.config.getNumber('min_margin_multiplier'),
    ])

    const wholesaleXaf = wholesaleUsd * usdToXaf
    const wholesaleCredits = wholesaleXaf / creditValueXaf
    const floorCredits = Math.ceil(wholesaleCredits * minMargin)
    const priceCredits = Math.ceil(wholesaleCredits * 2.5)
    const marginRatio = priceCredits / Math.max(wholesaleCredits, 1)

    return { priceCredits, floorCredits, marginRatio }
  }

  async applyDynamicPricing(baseCredits: number, availability: number): Promise<number> {
    if (availability <= 0) return Math.ceil(baseCredits * 1.5)
    if (availability < 5) return Math.ceil(baseCredits * 1.2)
    if (availability > 100) return Math.ceil(baseCredits * 0.95)
    return baseCredits
  }

  async getFirstPurchaseBonus(): Promise<number> {
    return this.config.getNumber('first_purchase_bonus')
  }

  async calculateMarginRatio(priceCredits: number, wholesaleUsd: number): Promise<number> {
    const [usdToXaf, creditValueXaf] = await Promise.all([
      this.config.getNumber('usd_to_xaf_rate'),
      this.config.getNumber('credit_value_xaf'),
    ])
    const wholesaleCredits = (wholesaleUsd * usdToXaf) / creditValueXaf
    return priceCredits / Math.max(wholesaleCredits, 0.001)
  }
}
