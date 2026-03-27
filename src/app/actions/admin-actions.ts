'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/database'
import {
    user as userTable,
    creditPackage,
    fraudEvent,
    creditPurchase,
    smsActivation,
    platformConfig,
    creditTransaction,
    creditWallet,
    creditLot,
} from '@/database/schema'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { nanoid } from 'nanoid'

// --- USERS ---

export async function updateUserAccountStatus(userId: string, isBanned: boolean) {
    const session = await requireAdminSession()
    await db.update(userTable).set({ banned: isBanned }).where(eq(userTable.id, userId))

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: isBanned ? 'ban_user' : 'unban_user',
        targetType: 'user',
        targetId: userId,
    })

    revalidatePath('/[locale]/(admin)/admin/users', 'page')
    return { success: true }
}

export async function manualCreditAdjustment(
    userId: string,
    amount: number,
    type: 'base' | 'bonus' | 'promotional',
    reason: string,
    note?: string
) {
    const session = await requireAdminSession()

    await db.transaction(async (tx) => {
        // Need wallet
        let [wallet] = await tx.select().from(creditWallet).where(eq(creditWallet.userId, userId))
        if (!wallet) {
            const [newWallet] = await tx.insert(creditWallet).values({
                id: `wallet_${nanoid()}`,
                userId,
                baseBalance: 0,
                bonusBalance: 0,
                promoBalance: 0,
                totalPurchased: 0,
                totalConsumed: 0,
                totalRefunded: 0,
                totalExpired: 0,
                totalBonusReceived: 0,
            }).returning()
            wallet = newWallet
        }

        // Create lot
        const lotId = `lot_${nanoid()}`
        const txId = `txn_${nanoid()}`

        // Compute balanceAfter
        let balanceAfter = wallet.baseBalance + wallet.bonusBalance + wallet.promoBalance + amount

        await tx.insert(creditTransaction).values({
            id: txId,
            userId,
            walletId: wallet.id,
            type: 'adjustment',
            creditType: type,
            amount: amount,
            balanceAfter: balanceAfter,
            description: reason,
            adminNote: note,
        })

        if (amount > 0) {
            await tx.insert(creditLot).values({
                id: lotId,
                walletId: wallet.id,
                creditType: type,
                initialAmount: amount,
                remainingAmount: amount,
                sourceTxnId: txId,
            })
        }

        // Update wallet
        if (type === 'base') {
            await tx.update(creditWallet).set({
                baseBalance: amount > 0 ? wallet.baseBalance + amount : wallet.baseBalance - Math.abs(amount)
            }).where(eq(creditWallet.id, wallet.id))
        } else if (type === 'bonus') {
            await tx.update(creditWallet).set({
                bonusBalance: amount > 0 ? wallet.bonusBalance + amount : wallet.bonusBalance - Math.abs(amount)
            }).where(eq(creditWallet.id, wallet.id))
        } else if (type === 'promotional') {
            await tx.update(creditWallet).set({
                promoBalance: amount > 0 ? wallet.promoBalance + amount : wallet.promoBalance - Math.abs(amount)
            }).where(eq(creditWallet.id, wallet.id))
        }
    })

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: 'manual_credit_adjustment',
        targetType: 'user',
        targetId: userId,
        afterData: { amount, type, reason },
    })

    revalidatePath('/[locale]/(admin)/admin/users', 'page')
    return { success: true }
}

// --- CREDIT PACKAGES ---

export async function createCreditPackage(data: any) {
    const session = await requireAdminSession()
    const id = `pkg_${nanoid()}`
    await db.insert(creditPackage).values({
        id,
        ...data,
    })

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: 'create_package',
        targetType: 'credit_package',
        targetId: id,
        afterData: data,
    })

    revalidatePath('/[locale]/(admin)/admin/credits', 'page')
    return { success: true }
}

export async function updateCreditPackage(id: string, data: any) {
    const session = await requireAdminSession()
    await db.update(creditPackage).set(data).where(eq(creditPackage.id, id))

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: 'update_package',
        targetType: 'credit_package',
        targetId: id,
        afterData: data,
    })

    revalidatePath('/[locale]/(admin)/admin/credits', 'page')
    return { success: true }
}

export async function deleteCreditPackage(id: string) {
    const session = await requireAdminSession()
    await db.delete(creditPackage).where(eq(creditPackage.id, id))

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: 'delete_package',
        targetType: 'credit_package',
        targetId: id,
    })

    revalidatePath('/[locale]/(admin)/admin/credits', 'page')
    return { success: true }
}

// --- FRAUD ---

export async function resolveFraudEvent(eventId: string, isResolved: boolean, note?: string) {
    const session = await requireAdminSession()
    await db.update(fraudEvent).set({
        isResolved,
        resolvedBy: session.user.id,
        resolvedAt: isResolved ? new Date() : null,
        resolutionNote: note,
    }).where(eq(fraudEvent.id, eventId))

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: isResolved ? 'resolve_fraud' : 'unresolve_fraud',
        targetType: 'fraud_event',
        targetId: eventId,
        afterData: { note },
    })

    revalidatePath('/[locale]/(admin)/admin/fraud', 'page')
    return { success: true }
}

// --- CONFIG ---

export async function updatePlatformConfig(key: string, value: any, valueType: string) {
    const session = await requireAdminSession()

    const parsedValue = valueType === 'number' ? Number(value) : valueType === 'boolean' ? value === 'true' || value === true : String(value)

    // Get before data
    const existing = await db.query.platformConfig.findFirst({
        where: eq(platformConfig.key, key)
    })

    await db.update(platformConfig).set({ value: String(parsedValue) }).where(eq(platformConfig.key, key))

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: 'update_config',
        targetType: 'platform_config',
        targetId: key,
        beforeData: existing ? { value: existing.value } : null,
        afterData: { value: String(parsedValue) },
    })

    revalidatePath('/[locale]/(admin)/admin/config', 'page')
    return { success: true }
}

// --- FINANCE (Refunds) ---

export async function refundPurchase(purchaseId: string) {
    const session = await requireAdminSession()
    // Mark purchase as refunded (this is simplified, ideally hits payment gateway too)
    await db.update(creditPurchase).set({ status: 'refunded' }).where(eq(creditPurchase.id, purchaseId))

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: 'refund_purchase',
        targetType: 'credit_purchase',
        targetId: purchaseId,
    })

    revalidatePath('/[locale]/(admin)/admin/finance', 'page')
    return { success: true }
}

export async function cancelActivation(activationId: string) {
    const session = await requireAdminSession()
    await db.update(smsActivation).set({ state: 'cancelled', cancelledAt: new Date() }).where(eq(smsActivation.id, activationId))

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: 'cancel_activation',
        targetType: 'sms_activation',
        targetId: activationId,
    })

    revalidatePath('/[locale]/(admin)/admin/finance', 'page')
    return { success: true }
}

export async function syncPurchaseWithFapshi(purchaseId: string) {
    const session = await requireAdminSession()

    const purchase = await db.query.creditPurchase.findFirst({
        where: eq(creditPurchase.id, purchaseId),
    })

    if (!purchase || !purchase.paymentRef) {
        throw new Error('purchase_not_syncable')
    }

    const { PaymentPurchaseService } = await import('@/lib/economics/payment-purchase-service')

    await PaymentPurchaseService.confirmPurchaseFromWebhook(purchase.paymentRef)

    // Audit Log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
        adminId: session.user.id,
        action: 'sync_purchase',
        targetType: 'credit_purchase',
        targetId: purchaseId,
    })

    revalidatePath('/[locale]/(admin)/admin/finance', 'page')
    return { success: true }
}

