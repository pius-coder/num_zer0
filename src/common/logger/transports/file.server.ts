/**
 * File Transport (Node.js ONLY)
 *
 * Writes JSONL (one JSON object per line) to date-partitioned files.
 * DISABLED on Vercel/Serverless (read-only filesystem).
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Transport } from '../transport'
import type { StructuredLogEntry } from '../schema'
import type { LogLevel } from '../types'
import { LOG_LEVEL_PRIORITY } from '../types'
import { serializeEntry } from '../schema'

export interface FileTransportOptions {
  logDir?: string
  minLevel?: LogLevel
  flushIntervalMs?: number
  maxBufferSize?: number
}

type StreamName = 'app' | 'error' | 'access' | 'audit'

function getDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function resolveLogDir(custom?: string): string {
  if (custom) return custom
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
  // DISABLE on Vercel/Serverless — filesystem is read-only
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    return {
      name: 'noop',
      minLevel: 'fatal',
      write: () => {},
      flush: async () => {},
      close: async () => {},
    }
  }

  const logDir = resolveLogDir(opts.logDir)
  const minLevel: LogLevel = opts.minLevel ?? 'debug'
  const flushIntervalMs = opts.flushIntervalMs ?? 500
  const maxBufferSize = opts.maxBufferSize ?? 50

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
    }
  }

  function flushAll(): void {
    for (const s of ['app', 'error', 'access', 'audit'] as StreamName[]) {
      flushStream(s)
    }
  }

  flushTimer = setInterval(flushAll, flushIntervalMs)
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
      if (stream === 'error') buffers.app.push(line)
      if (buffers[stream].length >= maxBufferSize) flushStream(stream)
    },
    async flush(): Promise<void> { flushAll() },
    async close(): Promise<void> {
      if (flushTimer) { clearInterval(flushTimer); flushTimer = null }
      flushAll()
    },
  }
}
