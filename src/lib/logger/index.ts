/**
 * Logger Package — Unified Entry Point
 *
 * This file re-exports both the legacy Logger (for backward compat)
 * and the new StructuredLogger with transport support.
 *
 * Consumers should prefer the structured logger for new code:
 *   import { createLogger } from '@/lib/logger'
 *
 * The default export is a pre-configured global StructuredLogger instance.
 */

// ─── Structured Logger (new) ─────────────────────────────────────────────────

export { StructuredLogger, createStructuredLogger } from './structured'
export type { StructuredLoggerConfig } from './structured'

// ─── Schema ──────────────────────────────────────────────────────────────────

export type { StructuredLogEntry, StructuredError } from './schema'
export { normalizeError, redact, serializeEntry } from './schema'

// ─── Transports ──────────────────────────────────────────────────────────────

export type { Transport } from './transport'
export { createConsoleTransport } from './transports/console'
// NOTE: File transport must be imported explicitly from './transports/file.server'
// to avoid bundling Node.js fs in edge/client code.

// ─── Request Helpers ─────────────────────────────────────────────────────────

export { extractRequestContext, requestToLogFields, extractHeaders } from './request'
export type { RequestContext } from './request'

// ─── Legacy Logger (backward compat) ─────────────────────────────────────────

export { Logger, createLogger as createLegacyLogger } from './logger'

// ─── Type exports ────────────────────────────────────────────────────────────

export type {
    LogLevel,
    LogEntry,
    LoggerConfig,
    LoggerContext,
    SerializerOptions,
    TableOptions,
    Environment,
    RuntimeMode,
    ErrorInfo,
    JSONLogEntry,
    BrowserStyle,
    TimerEntry,
} from './types'

export {
    LOG_LEVEL_PRIORITY,
    LOG_LEVEL_ICONS,
    LOG_LEVEL_BADGES,
    DEFAULT_CONFIG,
    TREE_CHARS,
} from './types'

// ─── Utility exports ─────────────────────────────────────────────────────────

export {
    isServer,
    isClient,
    isEdgeRuntime,
    getEnvironment,
    getRuntimeMode,
    isDevelopment,
    isProduction,
    isTest,
    formatDuration,
    safeStringify,
} from './utils'

// ─── Global Instance & createLogger ──────────────────────────────────────────

import { StructuredLogger } from './structured'
import { createConsoleTransport } from './transports/console'
import { getEnvironment } from './utils'
import type { LogLevel } from './types'

/**
 * Auto-detect whether we can use the file transport.
 * Only in Node runtime, never in edge or browser.
 */
function createDefaultTransports() {
    const transports = [createConsoleTransport()]

    // Use process.env.NEXT_RUNTIME to strictly gate Node-only code.
    // This allows bundlers (Turbopack/Webpack) to tree-shake this branch in the browser.
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { createFileTransport } = require('./transports/file.server')
            transports.push(createFileTransport())
        } catch (err) {
            // File transport not available or failed to load
            console.warn('[logger] Failed to load file transport:', err)
        }
    }

    return transports
}

// Lazily initialized global logger
let _globalLogger: StructuredLogger | null = null

function getGlobalLogger(): StructuredLogger {
    if (!_globalLogger) {
        _globalLogger = new StructuredLogger({
            prefix: 'n0-app',
            transports: createDefaultTransports(),
        })
    }
    return _globalLogger
}

/**
 * Create a new logger instance.
 *
 * This is the primary API. It returns a StructuredLogger pre-configured
 * with console + file transports.
 *
 * ```ts
 * import { createLogger } from '@/lib/logger'
 * const log = createLogger({ prefix: 'api-users' })
 * log.info('Fetching users', { count: 42 })
 * ```
 */
export function createLogger(config?: {
    prefix?: string
    minLevel?: LogLevel
    defaultContext?: Record<string, unknown>
}): StructuredLogger {
    return getGlobalLogger().child({
        prefix: config?.prefix,
        minLevel: config?.minLevel,
        defaultContext: config?.defaultContext,
    })
}

/**
 * Get the global logger instance.
 */
export function getLogger(): StructuredLogger {
    return getGlobalLogger()
}

/**
 * Create a module-scoped logger.
 */
export function createModuleLogger(prefix: string): StructuredLogger {
    return getGlobalLogger().child({ prefix })
}

// Default export: global logger
export default getGlobalLogger()

// Re-export for backward compat
export type { LogLevel as Level } from './types'
