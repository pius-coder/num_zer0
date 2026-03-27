import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { smsActivation } from '@/database/schema'
import { requireSession } from '@/lib/economics/api-auth'

export async function GET() {
  try {
    const session = await requireSession()
    const activations = await db.query.smsActivation.findMany({
      where: eq(smsActivation.userId, session.user.id),
      orderBy: [desc(smsActivation.createdAt)],
      limit: 100,
    })
    return NextResponse.json({ activations })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'activation_history_failed' },
      { status: 400 }
    )
  }
}
