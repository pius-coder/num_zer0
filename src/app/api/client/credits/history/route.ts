import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { creditTransaction } from '@/database/schema'
import { requireSession } from '@/lib/economics/api-auth'

export async function GET() {
  try {
    const session = await requireSession()
    const transactions = await db.query.creditTransaction.findMany({
      where: eq(creditTransaction.userId, session.user.id),
      orderBy: [desc(creditTransaction.createdAt)],
      limit: 100,
    })
    return NextResponse.json({ transactions })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'credit_history_failed' },
      { status: 400 }
    )
  }
}

