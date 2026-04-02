'use server'

import { requireAdminSession } from '@/common/auth/require-admin.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import {
  user,
  creditPurchase,
  smsActivation,
  platformConfig,
  priceRule,
  creditPackage,
  fraudEvent,
  supportMessages,
} from '@/database/schema'
import { eq, and, count, desc, gte, sql } from 'drizzle-orm'
import { z } from 'zod'
import { PaymentPurchaseService } from '@/services/payment-purchase.service'
import { SyncService } from '@/services/sync.service'
import { EconomicsConfigService } from '@/services/economics-config.service'
import { FraudService } from '@/services/fraud.service'
import { CreditLedgerService } from '@/services/credit-ledger.service'

const log = createLogger({ prefix: 'admin-action' })

export interface AdminActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}

// ── User Management ──────────────────────────────────────────────────────────

const UpdateAccountStatusSchema = z.object({
  userId: z.string(),
  isBanned: z.boolean(),
})

export async function updateUserAccountStatusAction(
  input: z.infer<typeof UpdateAccountStatusSchema>
): Promise<AdminActionResult> {
  try {
    await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  log.info('admin_update_account_status', { userId: input.userId, isBanned: input.isBanned })

  try {
    const parsed = UpdateAccountStatusSchema.parse(input)
    await db.update(user).set({ banned: parsed.isBanned }).where(eq(user.id, parsed.userId))
    log.info('admin_update_account_status_complete', { userId: parsed.userId })
    return { success: true }
  } catch (error) {
    log.error('admin_update_account_status_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'update_failed' }
  }
}

const CreditAdjustmentSchema = z.object({
  userId: z.string(),
  amount: z.number().int().min(1).max(100_000),
  creditType: z.enum(['base', 'bonus', 'promotional']),
  reason: z.string().min(1).max(500),
  note: z.string().max(1000).optional(),
})

export async function manualCreditAdjustmentAction(
  input: z.infer<typeof CreditAdjustmentSchema>
): Promise<AdminActionResult> {
  try {
    await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  log.info('admin_credit_adjust_started', { userId: input.userId, amount: input.amount })

  try {
    const parsed = CreditAdjustmentSchema.parse(input)
    const creditLedger = new CreditLedgerService()
    await creditLedger.creditWallet({
      userId: parsed.userId,
      creditsBase: parsed.creditType === 'base' ? parsed.amount : 0,
      creditsBonus: parsed.creditType === 'bonus' ? parsed.amount : 0,
      purchaseId: `admin_adj_${parsed.userId}_${Date.now()}`,
    })
    log.info('admin_credit_adjust_complete', { userId: parsed.userId, amount: parsed.amount })
    return { success: true }
  } catch (error) {
    log.error('admin_credit_adjust_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'adjustment_failed' }
  }
}

// ── Config Management ─────────────────────────────────────────────────────────

const ConfigUpdateSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  valueType: z.enum(['string', 'number', 'boolean', 'json']),
})

export async function updatePlatformConfigAction(
  input: z.infer<typeof ConfigUpdateSchema>
): Promise<AdminActionResult> {
  try {
    await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  try {
    const parsed = ConfigUpdateSchema.parse(input)
    const configService = new EconomicsConfigService()
    await configService.set(parsed.key, parsed.value, parsed.valueType)
    log.info('admin_config_updated', { key: parsed.key })
    return { success: true }
  } catch (error) {
    log.error('admin_config_update_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'config_update_failed' }
  }
}

// ── Provider Sync ─────────────────────────────────────────────────────────────

const SyncProviderSchema = z.object({
  providerId: z.string(),
  scope: z.enum(['mappings', 'prices', 'balance', 'all']),
  serviceCode: z.string().optional(),
})

export async function syncProviderDataAction(
  input: z.infer<typeof SyncProviderSchema>
): Promise<AdminActionResult<Record<string, unknown>>> {
  try {
    await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  log.info('admin_sync_started', { providerId: input.providerId, scope: input.scope })

  try {
    const parsed = SyncProviderSchema.parse(input)
    const syncService = new SyncService()
    const results: Record<string, unknown> = {}

    if (parsed.scope === 'mappings' || parsed.scope === 'all') {
      results.mappings = await syncService.syncExternalMappings(parsed.providerId)
    }
    if (parsed.scope === 'prices' || parsed.scope === 'all') {
      results.prices = await syncService.syncPricesFromProvider(
        parsed.providerId,
        parsed.serviceCode
      )
      results.priceRules = await syncService.recalculatePriceRules()
    }
    if (parsed.scope === 'balance' || parsed.scope === 'all') {
      results.balance = await syncService.syncProviderBalance(parsed.providerId)
    }

    log.info('admin_sync_complete', { providerId: parsed.providerId, scope: parsed.scope })
    return { success: true, data: results }
  } catch (error) {
    log.error('admin_sync_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'sync_failed' }
  }
}

// ── Purchase Management ───────────────────────────────────────────────────────

export async function refundPurchaseAction(purchaseId: string): Promise<AdminActionResult> {
  try {
    await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  log.info('admin_refund_started', { purchaseId })

  try {
    const purchaseService = new PaymentPurchaseService()
    await purchaseService.markPurchaseFailed(purchaseId, 'admin_manual_refund')
    log.info('admin_refund_complete', { purchaseId })
    return { success: true }
  } catch (error) {
    log.error('admin_refund_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'refund_failed' }
  }
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export async function getAdminDashboardStatsAction(): Promise<
  AdminActionResult<{
    totalUsers: number
    totalRevenue: number
    pendingPurchases: number
    unresolvedFraud: number
    unreadMessages: number
  }>
> {
  try {
    await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  try {
    const [{ value: totalUsers }] = await db.select({ value: count() }).from(user)

    const [{ value: totalRevenue }] = await db
      .select({ value: sql<number>`SUM(${creditPurchase.priceXaf})` })
      .from(creditPurchase)
      .where(eq(creditPurchase.status, 'credited'))

    const [{ value: pendingPurchases }] = await db
      .select({ value: count() })
      .from(creditPurchase)
      .where(eq(creditPurchase.status, 'payment_pending'))

    const [{ value: unresolvedFraud }] = await db
      .select({ value: count() })
      .from(fraudEvent)
      .where(eq(fraudEvent.isResolved, false))

    const [{ value: unreadMessages }] = await db
      .select({ value: count() })
      .from(supportMessages)
      .where(and(eq(supportMessages.isRead, false), eq(supportMessages.direction, 'user_to_admin')))

    return {
      success: true,
      data: {
        totalUsers: Number(totalUsers ?? 0),
        totalRevenue: Number(totalRevenue ?? 0),
        pendingPurchases: Number(pendingPurchases ?? 0),
        unresolvedFraud: Number(unresolvedFraud ?? 0),
        unreadMessages: Number(unreadMessages ?? 0),
      },
    }
  } catch (error) {
    log.error('admin_dashboard_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'stats_unavailable' }
  }
}

// ── Fraud Management ──────────────────────────────────────────────────────────

export async function resolveFraudEventAction(
  eventId: string,
  note?: string
): Promise<AdminActionResult> {
  try {
    await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  try {
    const fraudService = new FraudService()
    await fraudService.resolveFraudEvent(eventId, note)
    log.info('admin_fraud_resolved', { eventId })
    return { success: true }
  } catch (error) {
    log.error('admin_fraud_resolve_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'resolve_failed' }
  }
}

// ── Price Rules ───────────────────────────────────────────────────────────────

const PriceRuleUpdateSchema = z.object({
  id: z.string(),
  priceCredits: z.number().int().positive(),
  floorCredits: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

export async function updatePriceRuleAction(
  input: z.infer<typeof PriceRuleUpdateSchema>
): Promise<AdminActionResult> {
  try {
    await requireAdminSession()
  } catch {
    return { success: false, error: 'unauthorized' }
  }

  try {
    const parsed = PriceRuleUpdateSchema.parse(input)
    await db
      .update(priceRule)
      .set({
        priceCredits: parsed.priceCredits,
        ...(parsed.floorCredits !== undefined && { floorCredits: parsed.floorCredits }),
        ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
        updatedAt: new Date(),
      })
      .where(eq(priceRule.id, parsed.id))
    log.info('admin_price_rule_updated', { id: parsed.id })
    return { success: true }
  } catch (error) {
    log.error('admin_price_rule_failed', {
      error: error instanceof Error ? error.message : String(error),
    })
    return { success: false, error: 'update_failed' }
  }
}
