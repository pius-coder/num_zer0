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

    // ── PHASE 1: PRE-FLIGHT CHECK ──
    const quoteResult = await this.quotePrice(input.serviceCode, input.countryCode)

    // Check availability (out of stock guard)
    if (quoteResult.source === 'computed' && (quoteResult.availability ?? 0) <= 0) {
      throw this.error(
        'out_of_stock',
        'Ce service est actuellement en rupture de stock pour ce pays.',
        { serviceCode: input.serviceCode, countryCode: input.countryCode }
      )
    }

    const quotedCredits = quoteResult.priceCredits

    // Get best provider (with live balance check + availability guard)
    const candidate = await this.providerRouting.selectBestProvider(
      serviceMeta.externalId,
      input.countryCode
    )

    // FINAL GRIZZLY BALANCE CHECK — before holding user credits
    await this.verifyGrizzlyBalanceLive(
      serviceMeta.externalId,
      input.countryCode
    )

    // ── PHASE 2: FINANCIAL COMMITMENT ──
    const hold = await this.creditLedger.holdCredits({
      userId: input.userId,
      amount: quotedCredits,
      holdTimeMinutes: input.holdTimeMinutes,
      idempotencyKey: input.idempotencyKey,
    })

    // ── PHASE 3: THE PURCHASE ──
    try {
      // FINAL GRIZZLY BALANCE CHECK right before purchase
      await this.verifyGrizzlyBalanceLive(
        serviceMeta.externalId,
        input.countryCode
      )

      const grizzly = getGrizzlyClient()
      const grizzlyResult = await grizzly.getNumberV2({
        service: serviceMeta.externalId,
        country: input.countryCode,
      })

      // Success — insert activation
      const activationId = this.generateId('act')
      const [activation] = await this.db
        .insert(smsActivation)
        .values({
          id: activationId,
          userId: input.userId,
          serviceSlug: input.serviceCode,
          countryCode: input.countryCode,
          providerId: candidate.providerId,
          providerActivationId: String(grizzlyResult.activationId),
          state: 'waiting',
          creditsCharged: quotedCredits,
          wholesaleCostUsd: String(candidate.costUsd),
          timerExpiresAt: hold?.expiresAt ?? null,
          numberAssignedAt: new Date(),
          phoneNumber: grizzlyResult.phoneNumber,
        })
        .returning()

      this.log.info('activation_requested', {
        activationId,
        userId: input.userId,
        serviceCode: input.serviceCode,
        providerId: candidate.providerId,
        grizzlyActivationId: grizzlyResult.activationId,
      })

      return activation as ActivationResult
    } catch (err) {
      // Release held credits on failure
      if (hold?.id) {
        await this.creditLedger.releaseHold(hold.id)
      }
      throw err
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

  /**
   * FINAL Grizzly balance check — last gate before purchase.
   * Catches the race condition where balance dropped since Phase 1.
   * Throws 'grizzly_no_balance' if insufficient.
   */
  private async verifyGrizzlyBalanceLive(serviceCode: string, countryCode: string): Promise<void> {
    const grizzly = getGrizzlyClient()
    const balance = await grizzly.getBalance()

    const priceEntry = await grizzly.getPricesV3(countryCode, serviceCode)
    if (!priceEntry) return // Let the purchase call handle it

    const costUsd = priceEntry.price
    const safetyBuffer = 0.05

    if (balance < costUsd + safetyBuffer) {
      this.log.error('grizzly_insufficient_balance', {
        balance,
        requiredUsd: costUsd,
        safetyBuffer,
      })

      throw this.error(
        'grizzly_no_balance',
        `Solde fournisseur insuffisant. Coût: $${costUsd.toFixed(4)}, Solde: $${balance.toFixed(4)}`,
        { currentBalanceUsd: balance, requiredUsd: costUsd },
      )
    }

    this.log.info('grizzly_balance_verified', {
      balance,
      costUsd,
    })
  }
}
