import { NextResponse } from 'next/server'
import { eq, sum, count, sql } from 'drizzle-orm'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { requireAdminSession } from '@/common/auth/require-admin.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { user, creditWallet, creditPurchase, smsActivation, fraudEvent } from '@/database/schema'

const log = createLogger({ prefix: 'api-admin-user-detail' })

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireAdminSession()
    const authed = withUser(ctx, session.user.id)

    const { id } = await params

    const [userRow] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (!userRow) {
      return NextResponse.json({ error: 'not_found', message: 'User not found' }, { status: 404 })
    }

    const [wallet] = await db
      .select({
        baseBalance: creditWallet.baseBalance,
        bonusBalance: creditWallet.bonusBalance,
        promoBalance: creditWallet.promoBalance,
        totalPurchased: creditWallet.totalPurchased,
        totalConsumed: creditWallet.totalConsumed,
        totalRefunded: creditWallet.totalRefunded,
        totalExpired: creditWallet.totalExpired,
        heldBalance: creditWallet.heldBalance,
      })
      .from(creditWallet)
      .where(eq(creditWallet.userId, id))
      .limit(1)

    const [purchaseStats] = await db
      .select({
        totalPurchases: count(),
        totalSpentXaf: sum(creditPurchase.priceXaf),
      })
      .from(creditPurchase)
      .where(eq(creditPurchase.userId, id))

    const [activationStats] = await db
      .select({
        totalActivations: count(),
        completedActivations: count(sql`CASE WHEN ${smsActivation.state} = 'completed' THEN 1 END`),
      })
      .from(smsActivation)
      .where(eq(smsActivation.userId, id))

    const [fraudStats] = await db
      .select({
        totalFraudEvents: count(),
        unresolvedFraudEvents: count(sql`CASE WHEN NOT ${fraudEvent.isResolved} THEN 1 END`),
      })
      .from(fraudEvent)
      .where(eq(fraudEvent.userId, id))

    log.info('admin_user_detail_read', {
      ...toAuditEntry(authed, 'read', 'user', 'success'),
      targetUserId: id,
    })

    return NextResponse.json(
      {
        user: userRow,
        wallet: wallet ?? null,
        stats: {
          purchases: {
            total: purchaseStats?.totalPurchases ?? 0,
            totalSpentXaf: Number(purchaseStats?.totalSpentXaf ?? 0),
          },
          activations: {
            total: activationStats?.totalActivations ?? 0,
            completed: Number(activationStats?.completedActivations ?? 0),
          },
          fraud: {
            total: fraudStats?.totalFraudEvents ?? 0,
            unresolved: Number(fraudStats?.unresolvedFraudEvents ?? 0),
          },
        },
      },
      { headers: { 'Cache-Control': 'private, max-age=10' } }
    )
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
