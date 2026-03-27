import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { user, creditWallet, creditTransaction } from '@/database/schema'
import { requireAdminSession, AdminAuthError } from '@/lib/auth/require-admin'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdminSession()
        const { id } = await params

        const [userData] = await db
            .select()
            .from(user)
            .where(eq(user.id, id))
            .limit(1)

        if (!userData) {
            return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
        }

        const [wallet] = await db
            .select()
            .from(creditWallet)
            .where(eq(creditWallet.userId, id))
            .limit(1)

        const recentTransactions = await db
            .select()
            .from(creditTransaction)
            .where(eq(creditTransaction.userId, id))
            .orderBy(desc(creditTransaction.createdAt))
            .limit(10)

        return NextResponse.json({
            user: userData,
            wallet: wallet ?? null,
            recentTransactions,
        })
    } catch (error) {
        const status = error instanceof AdminAuthError ? error.status : 500
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'admin_user_detail_failed' },
            { status }
        )
    }
}
