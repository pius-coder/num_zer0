import { NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'

import { db } from '@/database'
import { fraudEvent } from '@/database/schema'
import { requireAdminSession, AdminAuthError } from '@/lib/auth/require-admin'

export async function GET() {
  try {
    await requireAdminSession()
    const events = await db.query.fraudEvent.findMany({
      orderBy: [desc(fraudEvent.createdAt)],
      limit: 200,
    })
    return NextResponse.json({ events })
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'admin_fraud_fetch_failed' },
      { status }
    )
  }
}
