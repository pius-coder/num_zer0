import { NextResponse } from 'next/server'
import { count, desc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { smsActivation } from '@/database/schema'
import { requireAdminSession, AdminAuthError } from '@/lib/auth/require-admin'

export async function GET(request: Request) {
    try {
        await requireAdminSession()

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, Number(searchParams.get('page') ?? 1))
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 25)))
        const offset = (page - 1) * limit
        const state = searchParams.get('state')

        const whereClause = state
            ? eq(smsActivation.state, state as any)
            : undefined

        const [totalResult] = await db
            .select({ value: count() })
            .from(smsActivation)
            .where(whereClause)

        const activations = await db
            .select()
            .from(smsActivation)
            .where(whereClause)
            .orderBy(desc(smsActivation.createdAt))
            .limit(limit)
            .offset(offset)

        const total = Number(totalResult?.value ?? 0)

        return NextResponse.json({
            activations,
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
            { error: error instanceof Error ? error.message : 'admin_activations_fetch_failed' },
            { status }
        )
    }
}
