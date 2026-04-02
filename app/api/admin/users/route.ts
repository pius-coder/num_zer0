import { NextResponse } from 'next/server'
import { desc, ilike, or, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { handleError } from '@/middleware/error-handler'
import { extractRequestContext, withUser, toAuditEntry } from '@/middleware/request-context'
import { requireAdminSession } from '@/common/auth/require-admin.server'
import { createLogger } from '@/common/logger'
import { db } from '@/database'
import { user } from '@/database/schema'

const log = createLogger({ prefix: 'api-admin-users' })

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

export async function GET(req: Request) {
  const ctx = extractRequestContext(req)

  try {
    const session = await requireAdminSession()
    const authed = withUser(ctx, session.user.id)

    const url = new URL(req.url)
    const { page, limit, search } = QuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      search: url.searchParams.get('search') ?? undefined,
    })

    const offset = (page - 1) * limit

    const whereClause =
      search && search.length > 0
        ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
        : undefined

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          banned: user.banned,
          banReason: user.banReason,
        })
        .from(user)
        .where(whereClause)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(user).where(whereClause),
    ])

    const total = totalRow?.total ?? 0

    log.info('admin_users_listed', {
      ...toAuditEntry(authed, 'list', 'users', 'success'),
      page,
      total,
      search: search ?? null,
    })

    return NextResponse.json(
      {
        data: rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { headers: { 'Cache-Control': 'private, max-age=10' } }
    )
  } catch (err) {
    return handleError(err, ctx.requestId)
  }
}
