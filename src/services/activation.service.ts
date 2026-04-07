import { eq, and } from 'drizzle-orm'

import { BaseService } from './base.service'
import { smsActivation } from '@/database/schema'
import { creditHold } from '@/database/schema'
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
    let grizzlyResult: any

    try {
      // DIRECT CALL TO GRIZZLY (Single source of truth)
      grizzlyResult = await grizzly.getNumberV2({
        service: serviceMeta.externalId,
        country: input.countryCode,
      })
    } catch (err) {
      // Log exact error for Vercel debugging
      this.log.error('activation_grizzly_failed', {
        slug: 'activation-failure-detail',
        error: err instanceof Error ? err.message : String(err),
        serviceCode: input.serviceCode,
        countryCode: input.countryCode,
      })
      throw err
    }

    // If Grizzly success, we calculate price and hold credits afterwards
    const priceResult = await this.quotePrice(input.serviceCode, input.countryCode)
    const quotedCredits = priceResult.priceCredits

    try {
      const hold = await this.creditLedger.holdCredits({
        userId: input.userId,
        amount: quotedCredits,
        holdTimeMinutes: input.holdTimeMinutes,
        idempotencyKey: input.idempotencyKey,
      })

      // Save to DB
      const activationId = this.generateId('act')
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
          timerExpiresAt: hold?.expiresAt ?? null,
          numberAssignedAt: new Date(),
          phoneNumber: grizzlyResult.phoneNumber,
        })
        .returning()

      this.log.info('activation_requested', {
        slug: 'activation-success',
        activationId,
        userId: input.userId,
        serviceCode: input.serviceCode,
      })

      return activation as ActivationResult
    } catch (dbErr) {
      // If DB fails, try to cancel on Grizzly to avoid losing money
      this.log.error('activation_db_failed', {
        slug: 'activation-db-error',
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      })
      try {
        await grizzly.setStatus(grizzlyResult.activationId, -8)
      } catch {}
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

    // If Grizzly refunded, release held credits to user
    if (grizzlyRefunded) {
      // Find and release any active holds for this activation
      const activeHold = await this.db.query.creditHold.findFirst({
        where: and(
          eq(creditHold.activationId, activationId),
          eq(creditHold.state, 'held'),
        ),
      })
      if (activeHold) {
        await this.creditLedger.releaseHold(activeHold.id)
        this.log.info('credits_refunded_on_cancel', {
          activationId,
          holdId: activeHold.id,
        })
      }
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
}
