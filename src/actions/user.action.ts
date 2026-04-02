'use server'

import { auth } from '@/common/auth'
import { headers } from 'next/headers'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { user as userTable } from '@/database/schemas/auth'
import { creditAdjustmentApproval } from '@/database/schemas/credits'
import { adminAuditLog } from '@/database/schemas/governance'
import {
  platformConfig,
  promoCode,
  fraudEvent,
  supportMessages,
} from '@/database/schemas/governance'
import { smsActivation } from '@/database/schemas/activations'
import { creditHold } from '@/database/schemas/credits'
import { subscription } from '@/database/schemas/payments'
import { and, eq, inArray, or } from 'drizzle-orm'

const log = createLogger({ prefix: 'user-action' })

export interface UpdateUserActionResult {
  success: boolean
  error?: string
}

export async function updateUserAction(values: {
  name?: string
  image?: string | null
}): Promise<UpdateUserActionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    log.warn('update_user_unauthorized', { values })
    return { success: false, error: 'unauthorized' }
  }

  if (!values.name?.trim() && values.image === undefined) {
    return { success: false, error: 'no_fields_to_update' }
  }

  log.info('update_user_started', { userId: session.user.id, values })

  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        ...(values.name && { name: values.name.trim() }),
        ...(values.image !== undefined && { image: values.image }),
      },
    })

    log.info('update_user_success', { userId: session.user.id })
    return { success: true }
  } catch (error) {
    log.error('update_user_failed', {
      userId: session.user.id,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'update_failed',
    }
  }
}

export interface DeleteAccountResult {
  success: boolean
  error?: string
}

export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    log.warn('delete_unauthorized')
    return { success: false, error: 'unauthorized' }
  }

  const userId = session.user.id
  log.info('delete_started', { userId })

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(creditAdjustmentApproval)
        .where(
          or(
            eq(creditAdjustmentApproval.requesterId, userId),
            eq(creditAdjustmentApproval.targetUserId, userId),
            eq(creditAdjustmentApproval.approverId, userId)
          )
        )

      await tx.delete(adminAuditLog).where(eq(adminAuditLog.adminId, userId))

      await tx
        .update(userTable)
        .set({ referredByUserId: null })
        .where(eq(userTable.referredByUserId, userId))

      await tx
        .update(platformConfig)
        .set({ updatedBy: null })
        .where(eq(platformConfig.updatedBy, userId))

      await tx.update(promoCode).set({ createdBy: null }).where(eq(promoCode.createdBy, userId))

      await tx.update(fraudEvent).set({ resolvedBy: null }).where(eq(fraudEvent.resolvedBy, userId))

      await tx
        .update(supportMessages)
        .set({ adminId: null })
        .where(eq(supportMessages.adminId, userId))

      await tx
        .update(smsActivation)
        .set({
          state: 'cancelled',
          cancelledAt: new Date(),
        })
        .where(
          and(
            eq(smsActivation.userId, userId),
            inArray(smsActivation.state, ['requested', 'waiting'])
          )
        )

      await tx
        .update(creditHold)
        .set({
          state: 'released',
          releasedAt: new Date(),
        })
        .where(and(eq(creditHold.userId, userId), eq(creditHold.state, 'held')))

      const activeSubscriptions = await tx
        .select({
          id: subscription.id,
          providerSubscriptionId: subscription.providerSubscriptionId,
          provider: subscription.provider,
        })
        .from(subscription)
        .where(and(eq(subscription.userId, userId), eq(subscription.status, 'active')))

      for (const sub of activeSubscriptions) {
        log.info('subscription_marked_for_cancellation', {
          subscriptionId: sub.id,
          providerSubscriptionId: sub.providerSubscriptionId,
          provider: sub.provider,
        })
      }

      await tx.delete(userTable).where(eq(userTable.id, userId))
    })

    log.info('delete_complete', { userId })
    return { success: true }
  } catch (error) {
    log.error('delete_failed', {
      userId,
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'delete_failed',
    }
  }
}
