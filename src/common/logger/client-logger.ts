/**
 * Client Logger — Browser-side log ingestion
 *
 * Sends log entries to /api/internal/logs via POST.
 * Batches entries and flushes periodically or on page unload.
 *
 * Usage:
 *   import { clientLogger } from '@/lib/logger/client-logger'
 *   clientLogger.info('Button clicked', { buttonId: 'cta-hero' })
 *   clientLogger.error('Uncaught error', { error: err.message })
 */

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface ClientLogEntry {
  timestamp: string
  level: LogLevel
  message: string
  channel: 'client'
  runtime: 'browser'
  source: string
  prefix?: string
  url?: string
  pathname?: string
  component?: string
  event?: string
  userId?: string
  sessionId?: string
  locale?: string
  data?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class ClientLogger {
  private buffer: ClientLogEntry[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private prefix: string
  private flushIntervalMs: number
  private maxBufferSize: number
  private endpoint: string

  constructor(opts?: {
    prefix?: string
    flushIntervalMs?: number
    maxBufferSize?: number
    endpoint?: string
  }) {
    this.prefix = opts?.prefix ?? 'client'
    this.flushIntervalMs = opts?.flushIntervalMs ?? 3000
    this.maxBufferSize = opts?.maxBufferSize ?? 20
    this.endpoint = opts?.endpoint ?? '/api/internal/logs'

    // Auto-flush on unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush())
      // Periodic flush
      this.scheduleFlush()
    }
  }

  trace(message: string, data?: Record<string, unknown>) {
    this.log('trace', message, data)
  }
  debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data)
  }
  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data)
  }
  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data)
  }

  error(
    message: string,
    errorOrData?: Error | Record<string, unknown>,
    data?: Record<string, unknown>
  ) {
    const entry = this.buildEntry('error', message, data)
    if (errorOrData instanceof Error) {
      entry.error = {
        name: errorOrData.name,
        message: errorOrData.message,
        stack: errorOrData.stack,
      }
    } else if (errorOrData) {
      entry.data = { ...(entry.data ?? {}), ...errorOrData }
    }
    this.enqueue(entry)
  }

  fatal(message: string, errorOrData?: Error | Record<string, unknown>) {
    this.error(message, errorOrData)
  }

  /**
   * Create a child logger with a specific prefix / context.
   */
  child(prefix: string): ClientLogger {
    return new ClientLogger({
      prefix,
      flushIntervalMs: this.flushIntervalMs,
      maxBufferSize: this.maxBufferSize,
      endpoint: this.endpoint,
    })
  }

  /**
   * Immediately flush buffered entries to the server.
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const entries = this.buffer.splice(0, this.buffer.length)
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
        keepalive: true, // Survive page unload
      })
      if (!res.ok) {
        // Put entries back on failure (best effort)
        console.warn('[client-logger] Flush failed:', res.status)
      }
    } catch (err) {
      console.warn('[client-logger] Flush error:', err)
    }
  }

  // ── Internal ───────────────────────────────────────────────────────

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry = this.buildEntry(level, message, data)
    this.enqueue(entry)

    // Also log to console in dev
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      const consoleFn =
        level === 'error' || level === 'fatal' ? 'error' : level === 'warn' ? 'warn' : 'log'
      console[consoleFn](`[${this.prefix}] ${message}`, data ?? '')
    }
  }

  private buildEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): ClientLogEntry {
    const entry: ClientLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      channel: 'client',
      runtime: 'browser',
      source: 'client',
      prefix: this.prefix,
    }

    if (typeof window !== 'undefined') {
      entry.url = window.location.href
      entry.pathname = window.location.pathname
    }

    if (data) entry.data = data

    return entry
  }

  private enqueue(entry: ClientLogEntry) {
    this.buffer.push(entry)
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush()
    }
  }

  private scheduleFlush() {
    this.flushTimer = setInterval(() => this.flush(), this.flushIntervalMs)
  }
}

// ── Singleton instance ───────────────────────────────────────────────────────

export const clientLogger = new ClientLogger()
export { ClientLogger }
export default clientLogger
