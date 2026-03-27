import { NextResponse } from 'next/server'
import { count, desc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { creditPurchase } from '@/database/schema'
import { requireAdminSession, AdminAuthError } from '@/lib/auth/require-admin'

export async function GET(request: Request) {
    try {
        await requireAdminSession()

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, Number(searchParams.get('page') ?? 1))
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 25)))
        const offset = (page - 1) * limit
        const status = searchParams.get('status')

        const whereClause = status
            ? eq(creditPurchase.status, status as any)
            : undefined

        const [totalResult] = await db
            .select({ value: count() })
            .from(creditPurchase)
            .where(whereClause)

        const purchases = await db
            .select()
            .from(creditPurchase)
            .where(whereClause)
            .orderBy(desc(creditPurchase.createdAt))
            .limit(limit)
            .offset(offset)

        const total = Number(totalResult?.value ?? 0)

        return NextResponse.json({
            purchases,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        const httpStatus = error instanceof AdminAuthError ? error.status : 500
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'admin_purchases_fetch_failed' },
            { status: httpStatus }
        )
    }
}
