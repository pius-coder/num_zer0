/**
 * Console Transport
 *
 * Works in ALL runtimes (Node, Edge, Browser).
 * - Development: rich ANSI-colored output via existing formatters
 * - Production:  single-line JSON to stdout/stderr
 */

import type { Transport } from '../transport'
import type { StructuredLogEntry } from '../schema'
import type { LogLevel } from '../types'
import { LOG_LEVEL_PRIORITY } from '../types'
import { serializeEntry } from '../schema'
import { getEnvironment, getRuntimeMode } from '../utils'

type ConsoleMethod = 'log' | 'info' | 'warn' | 'error' | 'debug'

function levelToConsole(level: LogLevel): ConsoleMethod {
    switch (level) {
        case 'trace': return 'debug'
        case 'debug': return 'debug'
        case 'info': return 'log'
        case 'warn': return 'warn'
        case 'error': return 'error'
        case 'fatal': return 'error'
        default: return 'log'
    }
}

export interface ConsoleTransportOptions {
    /** Minimum level (default: 'debug' in dev, 'info' in prod) */
    minLevel?: LogLevel
    /** Force JSON output even in development */
    forceJson?: boolean
    /** Force pretty output even in production */
    forcePretty?: boolean
}

export function createConsoleTransport(opts: ConsoleTransportOptions = {}): Transport {
    const mode = getRuntimeMode()
    const isProd = mode === 'production'
    const useJson = opts.forceJson ?? isProd
    const minLevel = opts.minLevel ?? (isProd ? 'info' : 'debug')

    return {
        name: 'console',
        minLevel,

        write(entry: StructuredLogEntry): void {
            if (LOG_LEVEL_PRIORITY[entry.level] < LOG_LEVEL_PRIORITY[minLevel]) return

            const method = levelToConsole(entry.level)

            if (useJson) {
                // Production: single-line JSON
                console[method](serializeEntry(entry))
            } else {
                // Development: human-readable
                const parts: string[] = []
                const lvl = `[${entry.level.toUpperCase().padEnd(5)}]`
                const ts = entry.timestamp.replace(/.*T/, '').replace('Z', '')
                const pfx = entry.prefix ? `[${entry.prefix}]` : ''

                parts.push(lvl, ts, pfx, entry.message)

                if (entry.durationMs !== undefined) {
                    parts.push(`(${entry.durationMs.toFixed(1)}ms)`)
                }

                // Inline context
                const ctx = { ...entry.context, ...entry.data }
                if (entry.requestId) (ctx as Record<string, unknown>).requestId = entry.requestId
                if (entry.method) (ctx as Record<string, unknown>).method = entry.method
                if (entry.path) (ctx as Record<string, unknown>).path = entry.path
                if (entry.statusCode) (ctx as Record<string, unknown>).statusCode = entry.statusCode
                if (entry.userId) (ctx as Record<string, unknown>).userId = entry.userId

                const ctxKeys = Object.keys(ctx || {})
                if (ctxKeys.length > 0) {
                    const pairs = ctxKeys.map((k) => `${k}=${String((ctx as Record<string, unknown>)[k])}`).join(' ')
                    parts.push(`{${pairs}}`)
                }

                const line = parts.filter(Boolean).join(' ')
                console[method](line)

                // Print error stack separately for readability
                if (entry.error?.stack) {
                    console[method](`  ${entry.error.name}: ${entry.error.message}`)
                    const stackLines = entry.error.stack.split('\n').slice(1, 6)
                    for (const sl of stackLines) {
                        console[method](`    ${sl.trim()}`)
                    }
                }
            }
        },
    }
}
