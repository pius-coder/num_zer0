import { headers } from 'next/headers'
import { nanoid } from 'nanoid'

import { db } from '@/database'
import { adminAuditLog } from '@/database/schema'
import { createLogger } from '@/lib/logger'

const log = createLogger({ prefix: 'admin-audit' })

export interface AuditLogParams {
    adminId: string
    action: string
    targetType?: string
    targetId?: string
    beforeData?: any
    afterData?: any
}

/**
 * Records an immutable audit log entry for an admin action.
 * Infers IP address and User Agent from request headers.
 */
export async function recordAdminAction(params: AuditLogParams) {
    try {
        const head = await headers()

        // Attempt to get real IP (Vercel/Cloudflare headers first)
        const ipAddress =
            head.get('x-forwarded-for')?.split(',')[0] ||
            head.get('x-real-ip') ||
            '127.0.0.1'

        const userAgent = head.get('user-agent') || 'unknown'

        await db.insert(adminAuditLog).values({
            id: `audit_${nanoid()}`,
            adminId: params.adminId,
            action: params.action,
            targetType: params.targetType ?? null,
            targetId: params.targetId ?? null,
            beforeData: params.beforeData ?? null,
            afterData: params.afterData ?? null,
            ipAddress: ipAddress,
            userAgent: userAgent,
        })

        log.info('admin_action_recorded', {
            adminId: params.adminId,
            action: params.action,
            target: `${params.targetType}:${params.targetId}`
        })
    } catch (error) {
        // We don't want audit logging failure to crash the main operation, 
        // but we must log the error so we know it failed.
        log.error('failed_to_record_admin_audit', {
            error: error instanceof Error ? error.message : String(error),
            action: params.action
        })
    }
}
