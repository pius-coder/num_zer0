import { and, eq } from 'drizzle-orm'

import { db } from '@/database'
import { service, serviceCountryPrice, smsActivation } from '@/database/schema'
import { createLogger } from '@/lib/logger'
import { CreditLedgerService } from './credit-ledger-service'
import { ProviderRoutingService } from './provider-routing-service'

const log = createLogger({ prefix: 'sms-activation' })

export interface RequestActivationInput {
  userId: string
  serviceCode: string
  countryCode: string
  holdTimeMinutes: number
  idempotencyKey: string
}

export class ActivationService {
  static async quote(serviceCode: string, countryCode: string): Promise<number> {
    const svc = await db.query.service.findFirst({
      where: and(eq(service.code, serviceCode), eq(service.isActive, true)),
    })
    if (!svc) {
      throw new Error('service_not_found')
    }

    const countryRow = await db.query.serviceCountryPrice.findFirst({
      where: and(eq(serviceCountryPrice.serviceId, svc.id), eq(serviceCountryPrice.countryCode, countryCode)),
    })
    return countryRow?.priceCredits ?? svc.defaultPriceCredits
  }

  static async request(input: RequestActivationInput) {
    const svc = await db.query.service.findFirst({
      where: and(eq(service.code, input.serviceCode), eq(service.isActive, true)),
    })
    if (!svc) {
      throw new Error('service_not_found')
    }

    const quotedCredits = await this.quote(input.serviceCode, input.countryCode)
    const providerCandidate = await ProviderRoutingService.selectBestProvider(
      svc.apiCode,
      input.countryCode
    )

    const hold = await CreditLedgerService.holdCredits({
      userId: input.userId,
      amount: quotedCredits,
      holdTimeMinutes: input.holdTimeMinutes,
      idempotencyKey: input.idempotencyKey,
    })

    const activationId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const [activation] = await db
      .insert(smsActivation)
      .values({
        id: activationId,
        userId: input.userId,
        serviceId: svc.id,
        countryCode: input.countryCode,
        providerId: providerCandidate.providerId,
        state: 'assigned',
        creditsCharged: quotedCredits,
        wholesaleCostUsd: String(providerCandidate.costUsd),
        timerExpiresAt: hold?.expiresAt ?? null,
        numberAssignedAt: new Date(),
      })
      .returning()

    log.info('activation_requested', {
      activationId,
      userId: input.userId,
      serviceCode: input.serviceCode,
      countryCode: input.countryCode,
      holdId: hold?.id,
      providerCode: providerCandidate.providerCode,
    })

    return activation
  }

  static async markSmsReceived(activationId: string, smsCode: string) {
    const activation = await db.query.smsActivation.findFirst({
      where: eq(smsActivation.id, activationId),
    })
    if (!activation) {
      throw new Error('activation_not_found')
    }

    await db
      .update(smsActivation)
      .set({
        state: 'completed',
        smsCode,
        smsReceivedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(smsActivation.id, activationId))

    return db.query.smsActivation.findFirst({ where: eq(smsActivation.id, activationId) })
  }

  static async cancelActivation(activationId: string) {
    const activation = await db.query.smsActivation.findFirst({
      where: eq(smsActivation.id, activationId),
    })
    if (!activation) {
      throw new Error('activation_not_found')
    }

    await db
      .update(smsActivation)
      .set({
        state: 'cancelled',
        cancelledAt: new Date(),
      })
      .where(eq(smsActivation.id, activationId))

    return db.query.smsActivation.findFirst({ where: eq(smsActivation.id, activationId) })
  }
}
