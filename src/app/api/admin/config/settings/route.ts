import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/database'
import { platformConfig } from '@/database/schema'
import { requireAdminSession, AdminAuthError } from '@/lib/auth/require-admin'
import { setEconomicsConfigValue } from '@/lib/economics/config-service'

const updateSchema = z.object({
  key: z.string().min(1),
  valueType: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.any())]),
})

export async function GET() {
  try {
    await requireAdminSession()
    const settings = await db.select().from(platformConfig).orderBy(asc(platformConfig.key))
    return NextResponse.json({ settings })
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'admin_config_fetch_failed' },
      { status }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession()
    const payload = updateSchema.parse(await request.json())

    // Get existing value for audit log "before" data and default valueType
    const { eq } = await import('drizzle-orm')
    const existing = await db.query.platformConfig.findFirst({
      where: eq(platformConfig.key, payload.key),
    })

    const finalValueType = payload.valueType || (existing?.valueType as any) || 'string'

    await setEconomicsConfigValue(payload.key, payload.value, finalValueType, session.user.id)

    // Record audit log
    const { recordAdminAction } = await import('@/lib/admin/audit-service')
    await recordAdminAction({
      adminId: session.user.id,
      action: 'update_config',
      targetType: 'platform_config',
      targetId: payload.key,
      beforeData: existing ? { value: existing.value } : null,
      afterData: { value: String(payload.value) },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 400
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'admin_config_update_failed' },
      { status }
    )
  }
}
