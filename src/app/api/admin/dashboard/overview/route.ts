import { NextResponse } from 'next/server'
import { count, sum } from 'drizzle-orm'

import { db } from '@/database'
import { creditPurchase, smsActivation, creditTransaction } from '@/database/schema'
import { requireAdminSession, AdminAuthError } from '@/lib/auth/require-admin'

export async function GET() {
  try {
    await requireAdminSession()
    const [purchaseCount] = await db.select({ value: count() }).from(creditPurchase)
    const [activationCount] = await db.select({ value: count() }).from(smsActivation)
    const [creditsVolume] = await db
      .select({ value: sum(creditTransaction.amount) })
      .from(creditTransaction)

    return NextResponse.json({
      metrics: {
        purchases: Number(purchaseCount?.value ?? 0),
        activations: Number(activationCount?.value ?? 0),
        creditVolume: Number(creditsVolume?.value ?? 0),
      },
    })
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'admin_dashboard_failed' },
      { status }
    )
  }
}
