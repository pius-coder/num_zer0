/**
 * Canonical Structured Log Entry
 *
 * This is the single source-of-truth type for all log records persisted to disk
 * or sent to external services. Every transport serializes to this shape.
 *
 * Fields are optional except level, message, and timestamp because not every
 * runtime/context has access to every piece of metadata.
 */

import type { LogLevel, Environment } from './types'

// ─── Structured Error Payload ────────────────────────────────────────────────

export interface StructuredError {
    name: string
    message: string
    code?: string
    statusCode?: number
    stack?: string
    cause?: StructuredError
    details?: Record<string, unknown>
}

// ─── Canonical Log Record ────────────────────────────────────────────────────

export interface StructuredLogEntry {
    // ── Required ──
    timestamp: string      // ISO 8601
    level: LogLevel
    message: string

    // ── Identity / Correlation ──
    requestId?: string
    traceId?: string
    spanId?: string

    // ── Source ──
    prefix?: string        // logger namespace, e.g. "proxy", "api-users"
    environment?: Environment
    runtime?: 'node' | 'edge' | 'browser'
    pid?: number
    hostname?: string

    // ── HTTP Context ──
    method?: string        // GET, POST, …
    path?: string          // /fr/dashboard
    route?: string         // /[locale]/dashboard
    url?: string           // full URL
    statusCode?: number
    durationMs?: number

    // ── User / Session ──
    userId?: string
    sessionId?: string

    // ── Client Hints ──
    userAgent?: string
    ip?: string
    referer?: string
    locale?: string

    // ── Error ──
    error?: StructuredError

    // ── Data ──
    data?: Record<string, unknown>
    context?: Record<string, unknown>

    // ── Log Stream ──
    /** Which log stream/file this entry belongs to */
    stream?: 'app' | 'error' | 'access' | 'audit'
}

// ─── Redaction ───────────────────────────────────────────────────────────────

const REDACT_KEYS = new Set([
    'authorization',
    'cookie',
    'set-cookie',
    'password',
    'passwd',
    'secret',
    'token',
    'api_key',
    'apikey',
    'api-key',
    'access_token',
    'refresh_token',
    'private_key',
    'privatekey',
    'credit_card',
    'ssn',
    'x-api-key',
])

/**
 * Recursively redact sensitive keys from an object.
 * Returns a new object; does not mutate the original.
 */
export function redact<T>(obj: T, depth = 0): T {
    if (depth > 8) return obj
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj

    if (Array.isArray(obj)) {
        return obj.map((item) => redact(item, depth + 1)) as unknown as T
    }

    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (REDACT_KEYS.has(key.toLowerCase())) {
            result[key] = '[REDACTED]'
        } else if (typeof value === 'object' && value !== null) {
            result[key] = redact(value, depth + 1)
        } else {
            result[key] = value
        }
    }
    return result as T
}

// ─── Error Normalization ─────────────────────────────────────────────────────

/**
 * Convert any thrown value into a serializable StructuredError.
 */
export function normalizeError(err: unknown): StructuredError {
    if (err instanceof Error) {
        const structured: StructuredError = {
            name: err.name,
            message: err.message,
            stack: err.stack,
        }

        // Duck-type AppError
        const appErr = err as unknown as Record<string, unknown>
        if (typeof appErr.code === 'string') structured.code = appErr.code
        if (typeof appErr.statusCode === 'number') structured.statusCode = appErr.statusCode
        if (appErr.details && typeof appErr.details === 'object') {
            structured.details = appErr.details as Record<string, unknown>
        }
        if (err.cause) {
            structured.cause = normalizeError(err.cause)
        }

        return structured
    }

    if (typeof err === 'string') {
        return { name: 'Error', message: err }
    }

    return { name: 'UnknownError', message: String(err) }
}

// ─── Serialize entry to JSONL line ───────────────────────────────────────────

/**
 * Serialize a StructuredLogEntry to a single JSON string (one line, no newline).
 * Safe against circular refs via try/catch fallback.
 */
export function serializeEntry(entry: StructuredLogEntry): string {
    try {
        return JSON.stringify(entry)
    } catch {
        // Fallback: strip data/context to avoid circular refs
        return JSON.stringify({
            timestamp: entry.timestamp,
            level: entry.level,
            message: entry.message,
            prefix: entry.prefix,
            error: entry.error ? { name: entry.error.name, message: entry.error.message } : undefined,
            _serializationError: true,
        })
    }
}
