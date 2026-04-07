import { NextResponse } from 'next/server'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { rateLimit, getClientKey } from '@/middleware/rate-limit'
import { requireAdminSession } from '@/common/auth/require-admin.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { priceOverride } from '@/database/schema'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import crypto from 'crypto'

const log = createLogger({ prefix: 'api-admin-country-overrides' })

const CreateOverrideSchema = z.object({
  serviceSlug: z.string().min(1),
  priceCredits: z.number().int().positive(),
  floorCredits: z.number().int().positive().optional(),
  note: z.string().max(500).optional(),
})

const DeleteOverrideSchema = z.object({
  serviceSlug: z.string().min(1),
})

export async function GET(req: Request, { params }: { params: Promise<{ iso: string }> }) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireAdminSession()
    const authed = withUser(ctx, session.user.id)

    const key = getClientKey(session.user.id, req)
    const { allowed, retryAfterMs } = rateLimit(key)
    if (!allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const { iso } = await params

    const overrides = await db
      .select()
      .from(priceOverride)
      .where(eq(priceOverride.countryIso, iso))

    log.info('admin_country_overrides_listed', {
      ...toAuditEntry(authed, 'list', 'overrides', 'success'),
      countryIso: iso,
      count: overrides.length,
    })

    return NextResponse.json({ items: overrides, total: overrides.length })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ iso: string }> }) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireAdminSession()
    const authed = withUser(ctx, session.user.id)

    const key = getClientKey(session.user.id, req)
    const { allowed, retryAfterMs } = rateLimit(key)
    if (!allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      )
    }

    const { iso } = await params
    const body = CreateOverrideSchema.parse(await req.json())

    // Upsert: insert or update on conflict
    const id = `po_${crypto.randomUUID()}`
    const [result] = await db
      .insert(priceOverride)
      .values({
        id,
        serviceSlug: body.serviceSlug,
        countryIso: iso,
        priceCredits: body.priceCredits,
        floorCredits: body.floorCredits ?? null,
        note: body.note ?? null,
      })
      .onConflictDoUpdate({
        target: [priceOverride.serviceSlug, priceOverride.countryIso],
        set: {
          priceCredits: body.priceCredits,
          floorCredits: body.floorCredits ?? null,
          note: body.note ?? null,
          updatedAt: new Date(),
        },
      })
      .returning()

    log.info('admin_override_created', {
      ...toAuditEntry(authed, 'create', 'override', 'success'),
      countryIso: iso,
      serviceSlug: body.serviceSlug,
      priceCredits: body.priceCredits,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ iso: string }> }) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireAdminSession()
    const authed = withUser(ctx, session.user.id)

    const { iso } = await params
    const body = DeleteOverrideSchema.parse(await req.json())

    const deleted = await db
      .delete(priceOverride)
      .where(
        and(
          eq(priceOverride.countryIso, iso),
          eq(priceOverride.serviceSlug, body.serviceSlug)
        )
      )
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'not_found', message: 'Override not found' },
        { status: 404 }
      )
    }

    log.info('admin_override_deleted', {
      ...toAuditEntry(authed, 'delete', 'override', 'success'),
      countryIso: iso,
      serviceSlug: body.serviceSlug,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
