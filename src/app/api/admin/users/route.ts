import { NextResponse } from 'next/server'
import { count, desc, eq, ilike, or, sql } from 'drizzle-orm'

import { db } from '@/database'
import { user, creditWallet } from '@/database/schema'
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
                ilike(user.name, `%${q}%`),
                ilike(user.email, `%${q}%`),
                ilike(user.phoneNumber, `%${q}%`)
            )
            : undefined

        const [totalResult] = await db
            .select({ value: count() })
            .from(user)
            .where(whereClause)

        const users = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                image: user.image,
                createdAt: user.createdAt,
                isBanned: user.banned,
                baseBalance: sql<number>`COALESCE(${creditWallet.baseBalance}, 0)`,
                bonusBalance: sql<number>`COALESCE(${creditWallet.bonusBalance}, 0)`,
                promoBalance: sql<number>`COALESCE(${creditWallet.promoBalance}, 0)`,
            })
            .from(user)
            .leftJoin(creditWallet, eq(user.id, creditWallet.userId))
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limit)
            .offset(offset)

        const total = Number(totalResult?.value ?? 0)

        return NextResponse.json({
            users,
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
            { error: error instanceof Error ? error.message : 'admin_users_fetch_failed' },
            { status }
        )
    }
}
