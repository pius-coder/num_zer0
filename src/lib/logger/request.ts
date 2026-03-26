/**
 * Request Lifecycle Helpers
 *
 * Provide structured request logging compatible with Next.js middleware,
 * route handlers, and server actions.
 *
 * Usage:
 *   const ctx = extractRequestContext(request)
 *   logger.info('request_start', ctx)
 *   // ... later
 *   logger.info('request_end', { ...ctx, statusCode: 200, durationMs: 42 })
 */

import type { StructuredLogEntry } from './schema'
import { redact } from './schema'

/**
 * Minimal request shape that works with both NextRequest and standard Request.
 * Avoids importing next/server so this stays Edge-safe.
 */
interface RequestLike {
    method: string
    url: string
    headers: {
        get(name: string): string | null
        forEach?(cb: (value: string, key: string) => void): void
    }
    nextUrl?: { pathname: string }
}

export interface RequestContext {
    requestId: string
    method: string
    path: string
    url: string
    userAgent?: string
    ip?: string
    referer?: string
    locale?: string
}

/**
 * Extract structured context from a request object.
 * Generates a requestId if none is found in headers.
 */
export function extractRequestContext(request: RequestLike): RequestContext {
    const requestId =
        request.headers.get('x-request-id') ??
        request.headers.get('x-trace-id') ??
        crypto.randomUUID()

    const pathname =
        (request as { nextUrl?: { pathname: string } }).nextUrl?.pathname ??
        new URL(request.url).pathname

    const ctx: RequestContext = {
        requestId,
        method: request.method,
        path: pathname,
        url: request.url,
    }

    const ua = request.headers.get('user-agent')
    if (ua) ctx.userAgent = ua

    // Try common IP headers
    const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        request.headers.get('cf-connecting-ip')
    if (ip) ctx.ip = ip

    const referer = request.headers.get('referer')
    if (referer) ctx.referer = referer

    // Locale from accept-language or path
    const langHeader = request.headers.get('accept-language')
    if (langHeader) ctx.locale = langHeader.split(',')[0]?.split(';')[0]?.trim()

    return ctx
}

/**
 * Build a partial StructuredLogEntry from request context.
 * Merges cleanly with logger.info(...) calls.
 */
export function requestToLogFields(ctx: RequestContext): Partial<StructuredLogEntry> {
    return {
        requestId: ctx.requestId,
        method: ctx.method,
        path: ctx.path,
        url: ctx.url,
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        referer: ctx.referer,
        locale: ctx.locale,
        stream: 'access',
    }
}

/**
 * Extract headers as a redacted plain object.
 * Useful for audit logging.
 */
export function extractHeaders(request: RequestLike): Record<string, string> {
    const raw: Record<string, string> = {}
    if (request.headers.forEach) {
        request.headers.forEach((value, key) => {
            raw[key] = value
        })
    }
    return redact(raw)
}
