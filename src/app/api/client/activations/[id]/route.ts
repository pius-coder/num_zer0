import { NextResponse } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { smsActivation } from '@/database/schema'
import { requireSession } from '@/lib/economics/api-auth'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: Params) {
  try {
    const session = await requireSession()
    const { id } = await context.params

    const activation = await db.query.smsActivation.findFirst({
      where: and(eq(smsActivation.id, id), eq(smsActivation.userId, session.user.id)),
      orderBy: [desc(smsActivation.createdAt)],
    })

    if (!activation) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({ activation })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'activation_fetch_failed' },
      { status: 400 }
    )
  }
}
