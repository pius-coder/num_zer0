import { eq } from 'drizzle-orm'

import { BaseService } from './base.service'
import { smsActivation } from '@/database/schema'
import { CreditLedgerService } from './credit-ledger.service'
import { ProviderRoutingService } from './provider-routing.service'
import { getServiceBySlug } from '@/common/catalog'
import { getGrizzlyClient } from './grizzly'
import { PricingResolverService } from './pricing-resolver.service'

export interface RequestActivationInput {
  userId: string
  serviceCode: string
  countryCode: string
  holdTimeMinutes: number
  idempotencyKey: string
}

export interface ActivationResult {
  id: string
  userId: string
  serviceSlug: string
  countryCode: string
  phoneNumber: string | null
  smsCode: string | null
  state: string
  creditsCharged: number
  providerId: string
  providerActivationId: number | null
  createdAt: Date
  timerExpiresAt: Date | null
}

export class ActivationService extends BaseService {
  private creditLedger: CreditLedgerService
  private providerRouting: ProviderRoutingService

  constructor() {
    super({ prefix: 'activation', db: true })
    this.creditLedger = new CreditLedgerService()
    this.providerRouting = new ProviderRoutingService()
  }

  /**
   * Resolves price via shadow pricing: override → Grizzly live.
   * Returns full PriceResult including availability.
   */
  async quotePrice(serviceCode: string, countryCode: string) {
    const resolver = new PricingResolverService()
    return resolver.resolvePrice(serviceCode, countryCode)
  }

  async quote(serviceCode: string, countryCode: string): Promise<number> {
    const quotedPrice = await this.quotePrice(serviceCode, countryCode)
    return quotedPrice.priceCredits
  }

  async request(input: RequestActivationInput) {
    const serviceMeta = getServiceBySlug(input.serviceCode)
    this.assert(!!serviceMeta, 'service_not_found', 'Service not found in catalog', {
      serviceCode: input.serviceCode,
    })

    const grizzly = getGrizzlyClient()
    
    // 1. GENERATE ID FIRST for perfect traceability
    const activationId = this.generateId('act')
    let grizzlyResult: any

    try {
      // 2. DIRECT CALL TO GRIZZLY
      grizzlyResult = await grizzly.getNumberV2({
        service: serviceMeta.externalId,
        country: input.countryCode,
      })
    } catch (err) {
      this.log.error('activation_grizzly_failed', {
        slug: 'activation-failure-detail',
        error: err instanceof Error ? err.message : String(err),
        serviceCode: input.serviceCode,
        countryCode: input.countryCode,
      })
      throw err
    }

    const priceResult = await this.quotePrice(input.serviceCode, input.countryCode)
    const quotedCredits = priceResult.priceCredits

    try {
      // 3. HOLD CREDITS with the pre-generated ID
      // This will link all consumed lots (bonus/base) to this unique activationId
      await this.creditLedger.holdCredits({
        userId: input.userId,
        amount: quotedCredits,
        holdTimeMinutes: input.holdTimeMinutes,
        idempotencyKey: input.idempotencyKey,
        activationId: activationId,
      })

      // 4. SAVE TO DB with the same ID
      const [activation] = await this.db
        .insert(smsActivation)
        .values({
          id: activationId,
          userId: input.userId,
          serviceSlug: input.serviceCode,
          countryCode: input.countryCode,
          providerId: 'grizzly',
          providerActivationId: String(grizzlyResult.activationId),
          state: 'waiting',
          creditsCharged: quotedCredits,
          wholesaleCostUsd: String(grizzlyResult.activationCost),
          timerExpiresAt: new Date(Date.now() + input.holdTimeMinutes * 60 * 1000),
          numberAssignedAt: new Date(),
          phoneNumber: grizzlyResult.phoneNumber,
        })
        .returning()

      this.log.info('activation_requested', {
        slug: 'activation-success',
        activationId,
        userId: input.userId,
      })

      return activation as ActivationResult
    } catch (dbErr) {
      this.log.error('activation_db_failed', {
        slug: 'activation-db-error',
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      })

      // TOTAL ROLLBACK
      // 1. Release ALL credits holds linked to this activationId
      await this.creditLedger.releaseHoldByActivationId(activationId)

      // 2. Cancel on Grizzly if we had a number
      if (grizzlyResult?.activationId) {
        try {
          await grizzly.setStatus(grizzlyResult.activationId, -8)
        } catch {}
      }
      throw dbErr
    }
  }

  /**
   * Cancel activation with Grizzly refund check (Task 12).
   * 1. Fetch activation details
   * 2. Call Grizzly setStatus(id, -8) to cancel
   * 3. Check if Grizzly refunded based on response
   * 4. If refunded → mark 'cancelled' AND refund credits
   * 5. If NOT refunded → mark 'cancelled_no_refund' (credits kept)
   */
  async cancelActivation(activationId: string) {
    const existing = await this.db.query.smsActivation.findFirst({
      where: eq(smsActivation.id, activationId),
    })
    this.assert(!!existing, 'activation_not_found', 'Activation not found', { activationId })

    // Only cancel 'waiting' or 'assigned' states
    if (existing.state === 'cancelled' || existing.state === 'cancelled_no_refund') {
      return existing
    }

    // Call Grizzly to cancel the activation (status -8 = ACCESS_CANCEL)
    const grizzly = getGrizzlyClient()
    const providerActivationId = existing.providerActivationId
      ? Number(existing.providerActivationId)
      : null

    let grizzlyRefunded = false

    if (providerActivationId) {
      try {
        const result = await grizzly.setStatus(providerActivationId, -8)
        // If Grizzly returns ACCESS_CANCEL, it confirmed the cancellation
        // and will refund (or already refunded at their side)
        grizzlyRefunded = result.raw === 'ACCESS_CANCEL'
        this.log.info('grizzly_cancel_response', {
          activationId,
          grizzlyStatus: result.raw,
          refunded: grizzlyRefunded,
        })
      } catch (err) {
        this.log.warn('grizzly_cancel_failed', {
          activationId,
          error: err instanceof Error ? err.message : String(err),
        })
        // Don't block cancellation if Grizzly call fails
        // Default to no-refund to protect our margins
      }
    }

    // Determine final state
    const finalState = grizzlyRefunded ? 'cancelled' : 'cancelled_no_refund'

    const [updated] = await this.db
      .update(smsActivation)
      .set({
        state: finalState as any,
        cancelledAt: new Date(),
        ...(grizzlyRefunded ? { refundedAt: new Date() } : {}),
      })
      .where(eq(smsActivation.id, activationId))
      .returning()

    this.assert(!!updated, 'activation_not_found', 'Activation update failed', { activationId })

    // If Grizzly refunded, release ALL held credits for this activation
    if (grizzlyRefunded) {
      await this.creditLedger.releaseHoldByActivationId(activationId)
      this.log.info('credits_refunded_on_cancel', { activationId })
    } else {
      this.log.info('cancel_no_refund_grizzly_did_not_refund', {
        activationId,
        finalState,
      })
    }

    return updated
  }

  async markSmsReceived(activationId: string, smsCode: string) {
    const [updated] = await this.db
      .update(smsActivation)
      .set({
        state: 'completed',
        smsCode,
        smsReceivedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(smsActivation.id, activationId))
      .returning()
    this.assert(!!updated, 'activation_not_found', 'Activation not found', { activationId })
    this.log.info('sms_received', { activationId, codeLength: smsCode.length })
    return updated
  }

  /**
   * Poll Grizzly for the SMS code using the providerActivationId (Task 11).
   * This is the "single source of truth" for the SMS code.
   */
  async checkSmsStatus(activationId: string) {
    const existing = await this.db.query.smsActivation.findFirst({
      where: eq(smsActivation.id, activationId),
    })

    if (!existing || !existing.providerActivationId) {
      throw this.error('activation_not_found', 'Activation or Provider ID not found')
    }

    // If already completed, no need to check
    if (existing.state === 'completed' && existing.smsCode) {
      return existing
    }

    const grizzly = getGrizzlyClient()
    const status = await grizzly.getStatusV2(Number(existing.providerActivationId))

    // If SMS is received (status.sms contains the data)
    if (status.sms && status.sms.code) {
      const [updated] = await this.db
        .update(smsActivation)
        .set({
          state: 'completed',
          smsCode: status.sms.code,
          fullSmsText: status.sms.text,
          smsReceivedAt: new Date(),
          completedAt: new Date(),
        })
        .where(eq(smsActivation.id, activationId))
        .returning()
      
      this.log.info('sms_retrieved_from_grizzly', {
        activationId,
        code: status.sms.code,
      })
      
      return updated
    }

    return existing
  }
}
