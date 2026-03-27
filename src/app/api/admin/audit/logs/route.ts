import { NextResponse } from 'next/server'
import { count, desc, eq, ilike, or } from 'drizzle-orm'

import { db } from '@/database'
import { adminAuditLog, user } from '@/database/schema'
import { requireAdminSession, AdminAuthError } from '@/lib/auth/require-admin'

export async function GET(request: Request) {
  try {
    await requireAdminSession()

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 25)))
    const offset = (page - 1) * limit

    const whereClause = q
      ? or(
        ilike(adminAuditLog.action, `%${q}%`),
        ilike(adminAuditLog.targetType, `%${q}%`),
        ilike(adminAuditLog.targetId, `%${q}%`),
        ilike(user.name, `%${q}%`),
        ilike(user.email, `%${q}%`)
      )
      : undefined

    const [totalResult] = await db
      .select({ value: count() })
      .from(adminAuditLog)
      .leftJoin(user, eq(adminAuditLog.adminId, user.id))
      .where(whereClause)

    const logs = await db
      .select({
        id: adminAuditLog.id,
        adminId: adminAuditLog.adminId,
        adminName: user.name,
        adminImage: user.image,
        adminEmail: user.email,
        action: adminAuditLog.action,
        targetType: adminAuditLog.targetType,
        targetId: adminAuditLog.targetId,
        beforeData: adminAuditLog.beforeData,
        afterData: adminAuditLog.afterData,
        ipAddress: adminAuditLog.ipAddress,
        userAgent: adminAuditLog.userAgent,
        createdAt: adminAuditLog.createdAt,
      })
      .from(adminAuditLog)
      .leftJoin(user, eq(adminAuditLog.adminId, user.id))
      .where(whereClause)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit)
      .offset(offset)

    const total = Number(totalResult?.value ?? 0)

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'admin_audit_fetch_failed' },
      { status }
    )
  }
}
