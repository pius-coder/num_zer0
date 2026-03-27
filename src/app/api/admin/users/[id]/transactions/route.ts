import { NextResponse } from 'next/server'
import { count, desc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { creditTransaction } from '@/database/schema'
import { requireAdminSession, AdminAuthError } from '@/lib/auth/require-admin'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdminSession()
        const { id } = await params

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, Number(searchParams.get('page') ?? 1))
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 25)))
        const offset = (page - 1) * limit

        const [totalResult] = await db
            .select({ value: count() })
            .from(creditTransaction)
            .where(eq(creditTransaction.userId, id))

        const transactions = await db
            .select()
            .from(creditTransaction)
            .where(eq(creditTransaction.userId, id))
            .orderBy(desc(creditTransaction.createdAt))
            .limit(limit)
            .offset(offset)

        const total = Number(totalResult?.value ?? 0)

        return NextResponse.json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        const status = error instanceof AdminAuthError ? error.status : 500
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'admin_user_txns_failed' },
            { status }
        )
    }
}
