'use server'

import { ActivationService } from '@/services/activation.service'
import { auth } from '@/common/auth'
import { headers } from 'next/headers'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { supportMessages, smsActivation } from '@/database/schema'
import { eq, and } from 'drizzle-orm'
import type { RequestActivationInput } from '@/type/activation'

const log = createLogger({ prefix: 'activation-action' })
const activationService = new ActivationService()

const USER_FACING_ERROR =
  'Service temporairement indisponible. Veuillez réessayer dans quelques instants.'

async function createSupportAlert(params: {
  userId: string
  serviceCode: string
  countryCode: string
  errorCode: string
  context: Record<string, unknown>
}): Promise<string> {
  const messageId = `alert_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  await db.insert(supportMessages).values({
    id: messageId,
    userId: params.userId,
    direction: 'user_to_admin',
    subject: `Alerte technique: ${params.errorCode}`,
    content: JSON.stringify({
      type: 'activation_error',
      errorCode: params.errorCode,
      serviceCode: params.serviceCode,
      countryCode: params.countryCode,
      userId: params.userId,
      ...params.context,
    }),
  })

  return messageId
}

function generateErrorCode(prefix: string, serviceCode: string): string {
  return `ERR_${prefix}_${serviceCode.toUpperCase().slice(0, 6)}_${Date.now().toString(36).toUpperCase()}`
}

export interface RequestActivationResult {
  success: boolean
  activationId?: string
  phoneNumber?: string | null
  smsCode?: string | null
  state?: string
  creditsCharged?: number
  error?: string
  errorCode?: string
}

export async function requestActivationAction(
  input: RequestActivationInput
): Promise<RequestActivationResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    log.warn('request_activation_unauthorized', { input })
    return { success: false, error: 'unauthorized' }
  }

  log.info('request_activation_started', {
    input,
    userId: session.user.id,
  })

  try {
    const activation = await activationService.request({
      userId: session.user.id,
      ...input,
    })

    log.info('request_activation_complete', {
      activationId: activation?.id,
      userId: session.user.id,
    })

    return {
      success: true,
      activationId: activation?.id,
      phoneNumber: activation?.phoneNumber,
      smsCode: null, // SECURITY: Never expose SMS codes to client
      state: activation?.state,
      creditsCharged: activation?.creditsCharged,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isGrizzlyNoBalance = errorMessage.includes('grizzly_no_balance')
    const isAllProvidersFailed = errorMessage.includes('all_providers_failed')

    if (isGrizzlyNoBalance || isAllProvidersFailed) {
      const errorCode = generateErrorCode(
        isGrizzlyNoBalance ? 'NO_BALANCE' : 'ALL_FAILED',
        input.serviceCode
      )

      await createSupportAlert({
        userId: session.user.id,
        serviceCode: input.serviceCode,
        countryCode: input.countryCode,
        errorCode,
        context: {
          errorMessage,
          timestamp: new Date().toISOString(),
        },
      })

      log.warn('request_activation_service_unavailable', {
        input,
        errorCode,
        userId: session.user.id,
        isGrizzlyNoBalance,
      })

      return {
        success: false,
        error: USER_FACING_ERROR,
        errorCode,
      }
    }

    log.error('request_activation_failed', {
      input,
      error: errorMessage,
    })
    return {
      success: false,
      error: USER_FACING_ERROR,
    }
  }
}

export interface CancelActivationResult {
  success: boolean
  activationId?: string
  error?: string
}

export async function cancelActivationAction(
  activationId: string
): Promise<CancelActivationResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    log.warn('cancel_activation_unauthorized', { activationId })
    return { success: false, error: 'unauthorized' }
  }

  log.info('cancel_activation_started', {
    activationId,
    userId: session.user.id,
  })

  try {
    // SECURITY: Verify ownership before canceling
    const existingActivation = await db.query.smsActivation.findFirst({
      where: and(eq(smsActivation.id, activationId), eq(smsActivation.userId, session.user.id)),
    })

    if (!existingActivation) {
      log.warn('cancel_activation_not_found_or_forbidden', {
        activationId,
        userId: session.user.id,
      })
      return { success: false, error: 'not_found' }
    }

    const activation = await activationService.cancelActivation(activationId)

    log.info('cancel_activation_complete', {
      activationId,
      userId: session.user.id,
    })

    return {
      success: true,
      activationId: activation?.id,
    }
  } catch (error) {
    log.error('cancel_activation_failed', {
      activationId,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'cancel_failed',
    }
  }
}

export interface RetryActivationResult {
  success: boolean
  activationId?: string
  error?: string
  errorCode?: string
}

export async function retryActivationAction(
  input: RequestActivationInput
): Promise<RetryActivationResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    log.warn('retry_activation_unauthorized', { input })
    return { success: false, error: 'unauthorized' }
  }

  log.info('retry_activation_started', {
    input,
    userId: session.user.id,
  })

  try {
    const activation = await activationService.request({
      userId: session.user.id,
      ...input,
    })

    log.info('retry_activation_complete', {
      activationId: activation?.id,
      userId: session.user.id,
    })

    return {
      success: true,
      activationId: activation?.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const isGrizzlyNoBalance = errorMessage.includes('grizzly_no_balance')
    const isAllProvidersFailed = errorMessage.includes('all_providers_failed')

    if (isGrizzlyNoBalance || isAllProvidersFailed) {
      const errorCode = generateErrorCode(
        isGrizzlyNoBalance ? 'NO_BALANCE' : 'ALL_FAILED',
        input.serviceCode
      )

      await createSupportAlert({
        userId: session.user.id,
        serviceCode: input.serviceCode,
        countryCode: input.countryCode,
        errorCode,
        context: {
          errorMessage,
          timestamp: new Date().toISOString(),
        },
      })

      return {
        success: false,
        error: USER_FACING_ERROR,
        errorCode,
      }
    }

    log.error('retry_activation_failed', {
      input,
      error: errorMessage,
    })
    return {
      success: false,
      error: USER_FACING_ERROR,
    }
  }
}
