import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

/**
 * Server-only guard: requires an authenticated session from an ADMIN user.
 *
 * Admin check strategy (env-based — no role column needed yet):
 *  1. Read `ADMIN_EMAILS` env var (comma-separated list of emails)
 *  2. Match the session user's email against the list (case-insensitive)
 *
 * Throws with status-appropriate messages for API route catch blocks.
 */
export async function requireAdminSession() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })


    if (!session) {
        console.warn('[AdminAuth] Unauthorized: No session found')
        throw new AdminAuthError('unauthorized', 401)
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)

    const userEmail = session.user.email?.toLowerCase()

    if (!userEmail || !adminEmails.includes(userEmail)) {
        console.warn(`[AdminAuth] Forbidden: User ${userEmail ?? 'unknown'} is not an admin`)
        throw new AdminAuthError('forbidden: admin access required', 403)
    }

    console.info(`[AdminAuth] Admin access granted: ${userEmail}`)
    return session
}

export class AdminAuthError extends Error {
    status: number
    constructor(message: string, status: number) {
        super(message)
        this.name = 'AdminAuthError'
        this.status = status
    }
}
