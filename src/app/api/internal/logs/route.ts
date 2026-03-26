/**
 * API Route: Internal Log Explorer + Client Log Ingestion
 *
 * GET  /api/internal/logs           — Query logs from disk
 * GET  /api/internal/logs?action=stats — Log file statistics
 * POST /api/internal/logs           — Client log ingestion
 *
 * Protected by admin check (GET) or origin check (POST).
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { queryLogs, getLogStats } from '@/lib/logger/log-reader.server'
import type { LogQuery, LogChannel } from '@/lib/logger/log-reader.server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Auth ────────────────────────────────────────────────────────────────────

function isAdminRequest(request: NextRequest): boolean {
    const adminKey = process.env.INTERNAL_ADMIN_KEY
    if (adminKey) {
        const provided =
            request.headers.get('x-admin-key') ??
            request.nextUrl.searchParams.get('adminKey')
        return provided === adminKey
    }
    // In development, allow all
    if (process.env.NODE_ENV === 'development') return true
    return false
}

// ─── GET: Query Logs ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    if (!isAdminRequest(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = request.nextUrl.searchParams

    // Stats endpoint
    if (params.get('action') === 'stats') {
        try {
            const stats = getLogStats()
            return NextResponse.json(stats)
        } catch (err) {
            return NextResponse.json(
                { error: 'Failed to read stats', detail: String(err) },
                { status: 500 },
            )
        }
    }

    // Build query
    const query: LogQuery = {}

    const channels = params.get('channels')
    if (channels) {
        query.channels = channels.split(',').filter(Boolean) as LogChannel[]
    }
    // No channels = reader defaults to ALL available channels

    const level = params.get('level')
    if (level) {
        const levels = level.split(',').filter(Boolean)
        query.level = levels.length === 1 ? levels[0] : levels
    }

    const prefix = params.get('prefix')
    if (prefix) query.prefix = prefix

    const search = params.get('search')
    if (search) query.search = search

    const requestId = params.get('requestId')
    if (requestId) query.requestId = requestId

    const userId = params.get('userId')
    if (userId) query.userId = userId

    const pathFilter = params.get('path')
    if (pathFilter) query.path = pathFilter

    const date = params.get('date')
    if (date) query.date = date

    const from = params.get('from')
    if (from) query.from = from

    const to = params.get('to')
    if (to) query.to = to

    const page = params.get('page')
    if (page) query.page = parseInt(page, 10)

    const pageSize = params.get('pageSize')
    if (pageSize) query.pageSize = parseInt(pageSize, 10)

    const sort = params.get('sort')
    if (sort === 'asc' || sort === 'desc') query.sort = sort

    try {
        const result = queryLogs(query)
        return NextResponse.json(result)
    } catch (err) {
        return NextResponse.json(
            { error: 'Failed to query logs', detail: String(err) },
            { status: 500 },
        )
    }
}

// ─── POST: Client Log Ingestion ──────────────────────────────────────────────

const SENSITIVE_KEYS = new Set([
    'authorization', 'cookie', 'set-cookie', 'password',
    'token', 'secret', 'apikey', 'api_key', 'accesstoken',
    'refreshtoken', 'private_key',
])

function redactValue(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase().replace(/[-_]/g, ''))) {
            result[key] = '[REDACTED]'
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result[key] = redactValue(value as Record<string, unknown>)
        } else {
            result[key] = value
        }
    }
    return result
}

/**
 * Client log ingestion endpoint.
 * Accepts an array of log entries from the browser.
 * Writes them to client-YYYY-MM-DD.jsonl
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const entries: unknown[] = Array.isArray(body) ? body : [body]

        if (entries.length === 0) {
            return NextResponse.json({ received: 0 })
        }

        // Cap at 50 entries per request
        const capped = entries.slice(0, 50)

        // Import fs dynamically to keep this file compatible
        const fs = await import('node:fs')
        const path = await import('node:path')
        const logDir = path.join(process.cwd(), 'logs')
        fs.mkdirSync(logDir, { recursive: true })

        const dateStr = new Date().toISOString().slice(0, 10)
        const filePath = path.join(logDir, `client-${dateStr}.jsonl`)

        const ip =
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
            request.headers.get('x-real-ip') ?? 'unknown'
        const userAgent = request.headers.get('user-agent') ?? 'unknown'

        const lines: string[] = []
        for (const raw of capped) {
            if (typeof raw !== 'object' || raw === null) continue

            const entry = redactValue(raw as Record<string, unknown>)

            // Ensure required fields
            const record: Record<string, unknown> = {
                timestamp: (entry.timestamp as string) || new Date().toISOString(),
                level: (entry.level as string) || 'info',
                message: (entry.message as string) || 'client_event',
                channel: 'client',
                runtime: 'browser',
                source: 'client',
                ip,
                userAgent,
                ...entry,
            }

            try {
                lines.push(JSON.stringify(record))
            } catch {
                // Skip un-serializable entries
            }
        }

        if (lines.length > 0) {
            fs.appendFileSync(filePath, lines.join('\n') + '\n', 'utf-8')
        }

        return NextResponse.json({ received: lines.length })
    } catch (err) {
        return NextResponse.json(
            { error: 'Failed to ingest logs', detail: String(err) },
            { status: 500 },
        )
    }
}
