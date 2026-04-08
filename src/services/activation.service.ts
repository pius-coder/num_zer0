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

    // 1. QUOTE PRICE — need the amount before holding credits
    const priceResult = await this.quotePrice(input.serviceCode, input.countryCode)
    const quotedCredits = priceResult.priceCredits

    // 2. HOLD CREDITS (without activationId — FK not linked yet)
    // credit_hold.activation_id is nullable, so this is valid
    try {
      await this.creditLedger.holdCredits({
        userId: input.userId,
        amount: quotedCredits,
        holdTimeMinutes: input.holdTimeMinutes,
        idempotencyKey: input.idempotencyKey,
        // activationId omitted — will be linked after smsActivation is inserted
      })
    } catch (err) {
      this.log.error('activation_hold_failed', {
        error: err instanceof Error ? err.message : String(err),
        serviceCode: input.serviceCode,
      })
      throw err
    }

    // 3. GET NUMBER FROM GRIZZLY
    let grizzlyResult: Awaited<ReturnType<typeof grizzly.getNumberV2>>
    try {
      grizzlyResult = await grizzly.getNumberV2({
        service: serviceMeta.externalId,
        country: input.countryCode,
      })
    } catch (err) {
      // Grizzly failed — release held credits and rethrow
      this.log.error('activation_grizzly_failed', {
        error: err instanceof Error ? err.message : String(err),
        serviceCode: input.serviceCode,
        countryCode: input.countryCode,
      })
      await this.creditLedger.releaseHoldsByIdempotencyKey(input.idempotencyKey)
      throw err
    }

    // 4. SIGNAL ACCESS_READY to Grizzly (mandatory per Grizzly lifecycle)
    try {
      await grizzly.setStatus(grizzlyResult.activationId, 1)
    } catch (err) {
      // setStatus(1) failed — cancel on Grizzly with -1 (immediate cancel) and release credits
      this.log.error('activation_set_ready_failed', {
        activationId: grizzlyResult.activationId,
        error: err instanceof Error ? err.message : String(err),
      })
      try {
        await grizzly.setStatus(grizzlyResult.activationId, -1)
      } catch {}
      await this.creditLedger.releaseHoldsByIdempotencyKey(input.idempotencyKey)
      throw err
    }

    // 5. GENERATE ID and INSERT smsActivation (FK now safe — holds don't reference it yet)
    const activationId = this.generateId('act')
    try {
      await this.db.insert(smsActivation).values({
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
    } catch (dbErr) {
      this.log.error('activation_db_failed', {
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      })
      // Cancel on Grizzly (use -1 = immediate cancel) and release credits
      try {
        await grizzly.setStatus(grizzlyResult.activationId, -1)
      } catch {}
      await this.creditLedger.releaseHoldsByIdempotencyKey(input.idempotencyKey)
      throw dbErr
    }

    // 6. LINK HOLDS to the activation (FK now valid — smsActivation exists)
    try {
      await this.creditLedger.linkHoldsToActivation(input.idempotencyKey, activationId)
    } catch (linkErr) {
      this.log.error('activation_link_holds_failed', {
        activationId,
        error: linkErr instanceof Error ? linkErr.message : String(linkErr),
      })
      // Attempt full cleanup: cancel Grizzly + release credits
      try {
        await grizzly.setStatus(grizzlyResult.activationId, -1)
      } catch {}
      await this.creditLedger.releaseHoldsByIdempotencyKey(input.idempotencyKey)
      // Mark activation as cancelled since credits are released
      try {
        await this.db
          .update(smsActivation)
          .set({ state: 'cancelled', cancelledAt: new Date() })
          .where(eq(smsActivation.id, activationId))
      } catch {}
      throw linkErr
    }

    this.log.info('activation_requested', {
      activationId,
      userId: input.userId,
      serviceCode: input.serviceCode,
      phoneNumber: grizzlyResult.phoneNumber,
    })

    // Return the activation data
    return {
      id: activationId,
      userId: input.userId,
      serviceSlug: input.serviceCode,
      countryCode: input.countryCode,
      phoneNumber: grizzlyResult.phoneNumber,
      smsCode: null,
      state: 'waiting',
      creditsCharged: quotedCredits,
      providerId: 'grizzly',
      providerActivationId: grizzlyResult.activationId,
      createdAt: new Date(),
      timerExpiresAt: new Date(Date.now() + input.holdTimeMinutes * 60 * 1000),
    } as ActivationResult
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

    // Call Grizzly to cancel the activation
    // -1 = immediate cancel (before ACCESS_READY was sent)
    // 8 = cancel after ACCESS_READY (state is 'active')
    const grizzly = getGrizzlyClient()
    const providerActivationId = existing.providerActivationId
      ? Number(existing.providerActivationId)
      : null

    // Pick the right cancel code based on Grizzly lifecycle state
    // 'waiting' = setStatus(1) was never called → use -1
    // 'active' / 'assigned' = setStatus(1) was called → use 8
    const cancelCode = existing.state === 'waiting' ? -1 : 8
    let grizzlyRefunded = false

    if (providerActivationId) {
      try {
        const result = await grizzly.setStatus(providerActivationId, cancelCode as -1 | 8)
        // If Grizzly returns ACCESS_CANCEL, it confirmed the cancellation
        // and will refund (or already refunded at their side)
        grizzlyRefunded = result.status === 'ACCESS_CANCEL'
        this.log.info('grizzly_cancel_response', {
          activationId,
          grizzlyStatus: result.status,
          cancelCode,
          refunded: grizzlyRefunded,
        })
      } catch (err) {
        this.log.warn('grizzly_cancel_failed', {
          activationId,
          cancelCode,
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
