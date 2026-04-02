/**
 * File Transport (Node.js ONLY)
 *
 * Writes JSONL (one JSON object per line) to date-partitioned files:
 *   logs/app-2026-03-26.jsonl
 *   logs/error-2026-03-26.jsonl
 *   logs/access-2026-03-26.jsonl
 *   logs/audit-2026-03-26.jsonl
 *
 * This file uses the `.server.ts` Next.js convention so it is NEVER
 * included in client or edge bundles. Do NOT import this file from
 * code that may run in Edge or Browser runtimes.
 *
 * Safety:
 * - Creates log directory on first write
 * - Appends to files (no truncation)
 * - Buffers writes to reduce I/O (flushes every 500ms or 50 entries)
 * - Handles errors gracefully (logs to stderr, never throws)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Transport } from '../transport'
import type { StructuredLogEntry } from '../schema'
import type { LogLevel } from '../types'
import { LOG_LEVEL_PRIORITY } from '../types'
import { serializeEntry } from '../schema'

export interface FileTransportOptions {
  /** Base directory for log files (default: <project>/logs) */
  logDir?: string
  /** Minimum level to write (default: 'debug') */
  minLevel?: LogLevel
  /** Buffer flush interval in ms (default: 500) */
  flushIntervalMs?: number
  /** Max buffer size before forced flush (default: 50) */
  maxBufferSize?: number
}

type StreamName = 'app' | 'error' | 'access' | 'audit'

function getDateString(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

function resolveLogDir(custom?: string): string {
  if (custom) return custom
  // Default: project root / logs
  try {
    return path.join(process.cwd(), 'logs')
  } catch {
    return '/tmp/n0-logs'
  }
}

function streamForEntry(entry: StructuredLogEntry): StreamName {
  if (entry.stream) return entry.stream
  if (entry.level === 'error' || entry.level === 'fatal') return 'error'
  if (entry.method && entry.path) return 'access'
  return 'app'
}

export function createFileTransport(opts: FileTransportOptions = {}): Transport {
  const logDir = resolveLogDir(opts.logDir)
  const minLevel: LogLevel = opts.minLevel ?? 'debug'
  const flushIntervalMs = opts.flushIntervalMs ?? 500
  const maxBufferSize = opts.maxBufferSize ?? 50

  // Buffers per stream
  const buffers: Record<StreamName, string[]> = {
    app: [],
    error: [],
    access: [],
    audit: [],
  }

  let dirCreated = false
  let flushTimer: ReturnType<typeof setInterval> | null = null

  function ensureDir(): void {
    if (dirCreated) return
    try {
      fs.mkdirSync(logDir, { recursive: true })
      dirCreated = true
    } catch (err) {
      console.error(`[logger/file-transport] Failed to create log dir: ${logDir}`, err)
    }
  }

  function getFilePath(stream: StreamName): string {
    return path.join(logDir, `${stream}-${getDateString()}.jsonl`)
  }

  function flushStream(stream: StreamName): void {
    const buf = buffers[stream]
    if (buf.length === 0) return

    const lines = buf.splice(0, buf.length)
    const data = lines.join('\n') + '\n'
    const filePath = getFilePath(stream)

    try {
      ensureDir()
      fs.appendFileSync(filePath, data, 'utf-8')
    } catch (err) {
      console.error(`[logger/file-transport] Write failed: ${filePath}`, err)
      // Re-add to buffer? No — we'd loop. Drop them.
    }
  }

  function flushAll(): void {
    for (const stream of ['app', 'error', 'access', 'audit'] as StreamName[]) {
      flushStream(stream)
    }
  }

  // Start periodic flush
  flushTimer = setInterval(flushAll, flushIntervalMs)
  // Don't keep Node alive just for logging
  if (flushTimer && typeof flushTimer === 'object' && 'unref' in flushTimer) {
    flushTimer.unref()
  }

  return {
    name: 'file',
    minLevel,

    write(entry: StructuredLogEntry): void {
      if (LOG_LEVEL_PRIORITY[entry.level] < LOG_LEVEL_PRIORITY[minLevel]) return

      const stream = streamForEntry(entry)
      const line = serializeEntry(entry)
      buffers[stream].push(line)

      // Also write errors to both error stream AND app stream
      if (stream === 'error') {
        buffers.app.push(line)
      }

      // Force flush if buffer is large
      if (buffers[stream].length >= maxBufferSize) {
        flushStream(stream)
      }
    },

    async flush(): Promise<void> {
      flushAll()
    },

    async close(): Promise<void> {
      if (flushTimer) {
        clearInterval(flushTimer)
        flushTimer = null
      }
      flushAll()
    },
  }
}
