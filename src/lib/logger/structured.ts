/**
 * StructuredLogger — Production-grade logger with transport support.
 *
 * Backward compatible: `createLogger()` and the default export still work.
 * New: structured entries, transports, request context, file persistence.
 *
 * This class produces StructuredLogEntry objects and dispatches them to
 * registered transports. It does NOT directly call console or write files.
 */

import type { LogLevel, LoggerConfig, LoggerContext } from './types'
import { LOG_LEVEL_PRIORITY, DEFAULT_CONFIG } from './types'
import type { StructuredLogEntry, StructuredError } from './schema'
import { normalizeError, redact, serializeEntry } from './schema'
import type { Transport } from './transport'
import { getEnvironment, getRuntimeMode, formatTimestamp, getTimestamp, formatDuration } from './utils'

// Re-export the old Logger for backward compat
export { Logger as LegacyLogger } from './logger'
export { createLogger as createLegacyLogger } from './logger'

// ─── Configuration ───────────────────────────────────────────────────────────

export interface StructuredLoggerConfig {
    prefix?: string
    minLevel?: LogLevel
    /** Static context attached to every entry */
    defaultContext?: Record<string, unknown>
    /** Transports to dispatch to (default: console) */
    transports?: Transport[]
}

// ─── Timers ──────────────────────────────────────────────────────────────────

interface TimerEntry {
    start: number
    label: string
}

// ─── StructuredLogger ────────────────────────────────────────────────────────

export class StructuredLogger {
    private prefix: string
    private minLevel: LogLevel
    private context: Record<string, unknown>
    private transports: Transport[]
    private timers: Map<string, TimerEntry> = new Map()
    private environment: 'server' | 'client' | 'edge'
    private runtime: 'node' | 'edge' | 'browser'

    constructor(config: StructuredLoggerConfig = {}) {
        const env = getEnvironment()
        const mode = getRuntimeMode()
        const isProd = mode === 'production'

        this.prefix = config.prefix ?? 'app'
        this.minLevel = config.minLevel ?? (isProd ? 'info' : 'debug')
        this.context = config.defaultContext ? { ...config.defaultContext } : {}
        this.transports = config.transports ?? []
        this.environment = env
        this.runtime = env === 'client' ? 'browser' : env === 'edge' ? 'edge' : 'node'
    }

    // ─── Log Level Methods ─────────────────────────────────────────────────

    trace(message: string, data?: Record<string, unknown>): void {
        this.emit('trace', message, data)
    }

    debug(message: string, data?: Record<string, unknown>): void {
        this.emit('debug', message, data)
    }

    info(message: string, data?: Record<string, unknown>): void {
        this.emit('info', message, data)
    }

    warn(message: string, data?: Record<string, unknown>): void {
        this.emit('warn', message, data)
    }

    error(message: string, errorOrData?: Error | Record<string, unknown>, data?: Record<string, unknown>): void {
        if (errorOrData instanceof Error) {
            this.emit('error', message, data, errorOrData)
        } else {
            this.emit('error', message, errorOrData)
        }
    }

    fatal(message: string, errorOrData?: Error | Record<string, unknown>, data?: Record<string, unknown>): void {
        if (errorOrData instanceof Error) {
            this.emit('fatal', message, data, errorOrData)
        } else {
            this.emit('fatal', message, errorOrData)
        }
    }

    // ─── Child Logger ──────────────────────────────────────────────────────

    /**
     * Create a child logger that inherits transports and context.
     * Additional context/config merges on top.
     */
    child(contextOrConfig?: Record<string, unknown> | StructuredLoggerConfig): StructuredLogger {
        // Check if it's a config object
        const configKeys = ['prefix', 'minLevel', 'defaultContext', 'transports']
        const isConfig = contextOrConfig && Object.keys(contextOrConfig).some((k) => configKeys.includes(k))

        if (isConfig) {
            const cfg = contextOrConfig as StructuredLoggerConfig
            const child = new StructuredLogger({
                prefix: cfg.prefix ?? this.prefix,
                minLevel: cfg.minLevel ?? this.minLevel,
                transports: cfg.transports ?? this.transports,
                defaultContext: { ...this.context, ...cfg.defaultContext },
            })
            return child
        }

        // It's context
        const child = new StructuredLogger({
            prefix: this.prefix,
            minLevel: this.minLevel,
            transports: this.transports,
            defaultContext: { ...this.context, ...(contextOrConfig ?? {}) },
        })
        return child
    }

    /**
     * Return a logger with one-time context for chaining.
     *
     * logger.with({ requestId: '...' }).info('message')
     */
    with(context: Record<string, unknown>): StructuredLogger {
        return this.child(context)
    }

    // ─── Context ───────────────────────────────────────────────────────────

    setContext(key: string, value: unknown): void {
        this.context[key] = value
    }

    clearContext(): void {
        this.context = {}
    }

    getContext(): Readonly<Record<string, unknown>> {
        return { ...this.context }
    }

    // ─── Timers ────────────────────────────────────────────────────────────

    timer(label: string): void {
        this.timers.set(label, { start: getTimestamp(), label })
    }

    timerEnd(label: string): number | undefined {
        const t = this.timers.get(label)
        if (!t) {
            this.warn(`Timer "${label}" does not exist`)
            return undefined
        }
        const durationMs = getTimestamp() - t.start
        this.timers.delete(label)

        this.emitRaw({
            timestamp: formatTimestamp(),
            level: 'info',
            message: `${label} completed`,
            prefix: this.prefix,
            durationMs,
            context: Object.keys(this.context).length > 0 ? { ...this.context } : undefined,
            environment: this.environment,
            runtime: this.runtime,
        })

        return durationMs
    }

    // ─── Transport Management ──────────────────────────────────────────────

    addTransport(transport: Transport): void {
        this.transports.push(transport)
    }

    async flush(): Promise<void> {
        await Promise.all(this.transports.map((t) => t.flush?.()))
    }

    async close(): Promise<void> {
        await Promise.all(this.transports.map((t) => t.close?.()))
    }

    // ─── Internal ──────────────────────────────────────────────────────────

    private emit(level: LogLevel, message: string, data?: Record<string, unknown>, err?: Error): void {
        if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) return

        const entry: StructuredLogEntry = {
            timestamp: formatTimestamp(),
            level,
            message,
            prefix: this.prefix,
            environment: this.environment,
            runtime: this.runtime,
        }

        // Merge context (includes inherited child context)
        if (Object.keys(this.context).length > 0) {
            // Pull known fields out of context into top-level entry
            const ctx = { ...this.context }

            if (ctx.requestId) { entry.requestId = String(ctx.requestId); delete ctx.requestId }
            if (ctx.traceId) { entry.traceId = String(ctx.traceId); delete ctx.traceId }
            if (ctx.method) { entry.method = String(ctx.method); delete ctx.method }
            if (ctx.path) { entry.path = String(ctx.path); delete ctx.path }
            if (ctx.url) { entry.url = String(ctx.url); delete ctx.url }
            if (ctx.userId) { entry.userId = String(ctx.userId); delete ctx.userId }
            if (ctx.sessionId) { entry.sessionId = String(ctx.sessionId); delete ctx.sessionId }
            if (ctx.locale) { entry.locale = String(ctx.locale); delete ctx.locale }
            if (ctx.route) { entry.route = String(ctx.route); delete ctx.route }
            if (ctx.statusCode) { entry.statusCode = Number(ctx.statusCode); delete ctx.statusCode }
            if (ctx.durationMs) { entry.durationMs = Number(ctx.durationMs); delete ctx.durationMs }
            if (ctx.stream) { entry.stream = ctx.stream as 'app' | 'error' | 'access' | 'audit'; delete ctx.stream }

            if (Object.keys(ctx).length > 0) {
                entry.context = ctx
            }
        }

        // Data payload
        if (data && Object.keys(data).length > 0) {
            entry.data = redact(data)
        }

        // Error
        if (err) {
            entry.error = normalizeError(err)
        }

        // Add hostname and pid if in Node
        if (this.runtime === 'node') {
            try {
                entry.pid = process.pid
                if (typeof require !== 'undefined') {
                    entry.hostname = require('node:os').hostname()
                }
            } catch { /* ignore in edge/browser */ }
        }

        this.dispatch(entry)
    }

    /** Emit a pre-built entry (used by timerEnd, request helpers) */
    emitRaw(entry: StructuredLogEntry): void {
        if (LOG_LEVEL_PRIORITY[entry.level] < LOG_LEVEL_PRIORITY[this.minLevel]) return
        this.dispatch(entry)
    }

    private dispatch(entry: StructuredLogEntry): void {
        for (const transport of this.transports) {
            try {
                // Check stream filter
                if (transport.streams && transport.streams.length > 0 && entry.stream) {
                    if (!transport.streams.includes(entry.stream)) continue
                }
                if (LOG_LEVEL_PRIORITY[entry.level] >= LOG_LEVEL_PRIORITY[transport.minLevel]) {
                    transport.write(entry)
                }
            } catch (err) {
                // Never let a transport crash the app
                console.error(`[logger] Transport "${transport.name}" failed:`, err)
            }
        }
    }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a new StructuredLogger.
 *
 * ```ts
 * import { createStructuredLogger } from '@/lib/logger/structured'
 * const log = createStructuredLogger({ prefix: 'api' })
 * ```
 */
export function createStructuredLogger(config?: StructuredLoggerConfig): StructuredLogger {
    return new StructuredLogger(config)
}
