import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireSession } from '@/lib/economics/api-auth'
import { ActivationService } from '@/lib/economics/activation-service'

const payloadSchema = z.object({
  serviceCode: z.string().min(2),
  countryCode: z.string().length(2),
  holdTimeMinutes: z.number().int().min(1).max(30).default(5),
  idempotencyKey: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const payload = payloadSchema.parse(await request.json())

    const activation = await ActivationService.request({
      userId: session.user.id,
      serviceCode: payload.serviceCode,
      countryCode: payload.countryCode,
      holdTimeMinutes: payload.holdTimeMinutes,
      idempotencyKey: payload.idempotencyKey,
    })

    return NextResponse.json({ activation }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'activation_request_failed' },
      { status: 400 }
    )
  }
}
