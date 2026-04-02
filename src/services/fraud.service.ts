import { eq } from 'drizzle-orm'

import { BaseService } from './base.service'
import { EconomicsConfigService } from './economics-config.service'
import { fraudEvent } from '@/database/schema'

export interface FraudSignals {
  userId: string
  verificationsLastHour: number
  consecutiveRefundsByService: number
  cancelRatePct: number
  cancelAttempts: number
  consecutiveFailures: number
  countriesLast24h: number
  ipAddress?: string
  deviceFingerprint?: string
}

export interface FraudDecision {
  flagged: boolean
  hardBlock: boolean
  rateLimited: boolean
  reasons: string[]
}

export class FraudService extends BaseService {
  private configService: EconomicsConfigService

  constructor() {
    super({ prefix: 'fraud-service', db: true })
    this.configService = new EconomicsConfigService()
  }

  async evaluateFraudSignals(signals: FraudSignals): Promise<FraudDecision> {
    const maxVerificationsPerHour = await this.configService.getNumber('max_verifications_per_hour')
    const maxConsecutiveRefunds = await this.configService.getNumber('max_consecutive_refunds')
    const cancelRateFlagPct = await this.configService.getNumber('cancel_rate_flag_pct')
    const softBanAfterFailures = await this.configService.getNumber('soft_ban_after_failures')
    const geoAnomalyCountries24h = await this.configService.getNumber('geo_anomaly_countries_24h')

    const reasons: string[] = []
    let hardBlock = false
    let rateLimited = false

    if (signals.verificationsLastHour > maxVerificationsPerHour) {
      reasons.push('rapid_consumption')
      rateLimited = true
    }

    if (signals.cancelAttempts >= 20 && signals.cancelRatePct > cancelRateFlagPct) {
      reasons.push('refund_abuse')
      hardBlock = true
    }

    if (signals.consecutiveRefundsByService > maxConsecutiveRefunds) {
      reasons.push('consecutive_refunds')
      hardBlock = true
    }

    if (signals.consecutiveFailures >= softBanAfterFailures) {
      reasons.push('soft_ban_trigger')
      hardBlock = true
    }

    if (signals.countriesLast24h >= geoAnomalyCountries24h) {
      reasons.push('geo_anomaly')
    }

    const flagged = reasons.length > 0

    if (flagged) {
      await this.db.insert(fraudEvent).values({
        id: this.generateId('fraud'),
        userId: signals.userId,
        signalType: reasons.join(','),
        signals: {
          verificationsLastHour: signals.verificationsLastHour,
          consecutiveRefundsByService: signals.consecutiveRefundsByService,
          cancelRatePct: signals.cancelRatePct,
          cancelAttempts: signals.cancelAttempts,
          consecutiveFailures: signals.consecutiveFailures,
          countriesLast24h: signals.countriesLast24h,
        },
        decision: hardBlock ? 'hard_ban' : rateLimited ? 'rate_limit' : 'flag',
        isResolved: false,
        ipAddress: signals.ipAddress ?? null,
        deviceFingerprint: signals.deviceFingerprint ?? null,
      })

      this.log.warn('fraud_detected', {
        userId: signals.userId,
        reasons,
        hardBlock,
      })
    }

    return { flagged, hardBlock, rateLimited, reasons }
  }

  async resolveFraudEvent(eventId: string, note?: string) {
    const event = await this.db.query.fraudEvent.findFirst({
      where: eq(fraudEvent.id, eventId),
    })
    this.assert(!!event, 'fraud_event_not_found', 'Fraud event not found', { eventId })

    await this.db
      .update(fraudEvent)
      .set({
        isResolved: true,
        resolvedAt: new Date(),
        resolutionNote: note ?? null,
      })
      .where(eq(fraudEvent.id, eventId))

    this.log.info('fraud_event_resolved', { eventId })

    return this.db.query.fraudEvent.findFirst({ where: eq(fraudEvent.id, eventId) })
  }
}
