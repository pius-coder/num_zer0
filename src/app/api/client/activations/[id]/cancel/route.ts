import { NextResponse } from 'next/server'

import { requireSession } from '@/lib/economics/api-auth'
import { ActivationService } from '@/lib/economics/activation-service'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(_: Request, context: Params) {
  try {
    await requireSession()
    const { id } = await context.params
    const activation = await ActivationService.cancelActivation(id)
    return NextResponse.json({ activation })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'activation_cancel_failed' },
      { status: 400 }
    )
  }
}
