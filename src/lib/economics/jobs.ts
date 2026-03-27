import { and, eq, lt, sql } from 'drizzle-orm'

import { db } from '@/database'
import { creditHold, creditLot, creditWallet } from '@/database/schema'
import { createLogger } from '@/lib/logger'

const log = createLogger({ prefix: 'economics-jobs' })

export const releaseExpiredHoldsJob = async () => {
  const expiredHolds = await db.query.creditHold.findMany({
    where: and(eq(creditHold.state, 'held'), lt(creditHold.expiresAt, new Date())),
    limit: 500,
  })

  for (const hold of expiredHolds) {
    await db.transaction(async (tx) => {
      await tx
        .update(creditLot)
        .set({
          remainingAmount: sql`${creditLot.remainingAmount} + ${hold.amount}`,
        })
        .where(eq(creditLot.id, hold.lotId))

      await tx
        .update(creditWallet)
        .set({
          ...(hold.creditType === 'base'
            ? { baseBalance: sql`${creditWallet.baseBalance} + ${hold.amount}` }
            : hold.creditType === 'bonus'
              ? { bonusBalance: sql`${creditWallet.bonusBalance} + ${hold.amount}` }
              : { promoBalance: sql`${creditWallet.promoBalance} + ${hold.amount}` }),
        })
        .where(eq(creditWallet.id, hold.walletId))

      await tx
        .update(creditHold)
        .set({
          state: 'expired',
          releasedAt: new Date(),
        })
        .where(eq(creditHold.id, hold.id))
    })
  }

  log.info('release_expired_holds_job_complete', { releasedCount: expiredHolds.length })
  return expiredHolds.length
}
