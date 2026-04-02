import { eq, sql } from 'drizzle-orm'

import { BaseService, isServiceError } from './base.service'
import { smsActivation } from '@/database/schema'
import { CreditLedgerService } from './credit-ledger.service'
import { ProviderRoutingService } from './provider-routing.service'
import { getServiceBySlug } from '@/common/catalog'
import { getGrizzlyClient } from './grizzly'

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
   * Uses the `service_with_availability` DB view (Rule 7).
   * Pre-computed JOIN — no app-side table joins needed.
   */
  async quote(serviceCode: string, countryCode: string): Promise<number> {
    const [row] = await this.db.execute<{ price_credits: number }>(
      sql`SELECT price_credits FROM service_with_availability
          WHERE service_slug = ${serviceCode}
            AND country_iso = ${countryCode}
            AND is_active = true
          LIMIT 1`
    )
    return row?.price_credits ?? 100
  }

  async request(input: RequestActivationInput) {
    const serviceMeta = getServiceBySlug(input.serviceCode)
    this.assert(!!serviceMeta, 'service_not_found', 'Service not found in catalog', {
      serviceCode: input.serviceCode,
    })

    const quotedCredits = await this.quote(input.serviceCode, input.countryCode)

    // Get all candidates sorted by score, with live balance
    const candidates = await this.providerRouting.listCandidatesWithBalance(
      serviceMeta.externalId,
      input.countryCode
    )
    this.assert(candidates.length > 0, 'no_provider_candidate', 'No provider available', {
      serviceCode: input.serviceCode,
      countryCode: input.countryCode,
    })

    const triedProviders: string[] = []
    let lastError: unknown

    for (const candidate of candidates) {
      // Hold credits for this attempt
      const hold = await this.creditLedger.holdCredits({
        userId: input.userId,
        amount: quotedCredits,
        holdTimeMinutes: input.holdTimeMinutes,
        idempotencyKey: `${input.idempotencyKey}_${candidate.providerId}`,
      })

      try {
        // Request number from Grizzly with specific provider filter
        const grizzly = getGrizzlyClient()
        const grizzlyResult = await grizzly.getNumberV2({
          service: serviceMeta.externalId,
          country: input.countryCode,
          providerIds: candidate.providerId ? [Number(candidate.providerId)] : undefined,
        })

        // Success — insert activation with phone number and provider activation ID
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
        lastError = err
        triedProviders.push(candidate.providerId)

        // Release held credits before trying next provider
        if (hold?.id) {
          await this.creditLedger.releaseHold(hold.id)
        }

        // If it's a grizzly_no_balance error, no point trying other providers
        // (they all share the same Grizzly account)
        if (isServiceError(err) && err.code === 'grizzly_no_balance') {
          throw err
        }

        this.log.warn('provider_attempt_failed', {
          providerId: candidate.providerId,
          providerCode: candidate.providerCode,
          error: err instanceof Error ? err.message : String(err),
          remaining: candidates.length - triedProviders.length,
        })
      }
    }

    // All providers failed
    this.log.error('all_providers_failed', {
      serviceCode: input.serviceCode,
      countryCode: input.countryCode,
      triedProviders,
      lastError: lastError instanceof Error ? lastError.message : String(lastError),
    })

    this.assert(false, 'all_providers_failed', 'All providers failed to assign a number', {
      serviceCode: input.serviceCode,
      countryCode: input.countryCode,
      triedProviders,
      lastError: lastError instanceof Error ? lastError.message : String(lastError),
    })
  }

  async cancelActivation(activationId: string) {
    const [updated] = await this.db
      .update(smsActivation)
      .set({ state: 'cancelled', cancelledAt: new Date() })
      .where(eq(smsActivation.id, activationId))
      .returning()
    this.assert(!!updated, 'activation_not_found', 'Activation not found', { activationId })
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
