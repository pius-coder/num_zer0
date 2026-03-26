/**
 * Log Reader — Server Only (Node.js)
 *
 * Reads JSONL log files with bounded tail-reading for safety.
 * Supports filtering, searching, pagination, and file discovery diagnostics.
 *
 * IMPORTANT: This module must only be imported from server-side code.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LogChannel = 'app' | 'error' | 'access' | 'audit' | 'client'

export interface LogEntry {
    // Everything is optional except these three — we tolerate partial records
    timestamp: string
    level: string
    message: string
    [key: string]: unknown
}

export interface LogQuery {
    /** Which channels to read. Default: all channels that have files */
    channels?: LogChannel[]
    /** Filter by log level */
    level?: string | string[]
    /** Filter by prefix / namespace */
    prefix?: string
    /** Text search in message + prefix + path + requestId + error.message */
    search?: string
    /** Filter by requestId */
    requestId?: string
    /** Filter by path (substring match) */
    path?: string
    /** Filter by userId */
    userId?: string
    /** Date (YYYY-MM-DD) — if set, only reads that day's file(s) */
    date?: string
    /** Date range start (YYYY-MM-DD or ISO) */
    from?: string
    /** Date range end (YYYY-MM-DD or ISO) */
    to?: string
    /** Page number (1-indexed, default 1) */
    page?: number
    /** Page size (default 50, max 200) */
    pageSize?: number
    /** Sort order (default 'desc' = newest first) */
    sort?: 'asc' | 'desc'
}

export interface LogQueryResult {
    entries: LogEntry[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    /** Diagnostic: which files were actually read */
    filesRead: string[]
    /** Diagnostic: how many lines were parsed */
    linesParsed: number
    /** Diagnostic: how many lines were skipped (malformed) */
    linesSkipped: number
}

export interface LogFileInfo {
    name: string
    channel: string
    date: string
    sizeBytes: number
    path: string
}

export interface LogStats {
    logDir: string
    logDirExists: boolean
    totalFiles: number
    totalSizeBytes: number
    channels: Record<string, { files: number; sizeBytes: number; entries?: number }>
    dates: string[]
    files: LogFileInfo[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_CHANNELS: LogChannel[] = ['app', 'error', 'access', 'audit', 'client']
const FILE_PATTERN = /^([a-z]+)-(\d{4}-\d{2}-\d{2})\.jsonl$/
const MAX_READ_BYTES = 10 * 1024 * 1024 // 10MB per file
const MAX_LINES_PER_FILE = 10000

// ─── Path Resolution ─────────────────────────────────────────────────────────

function getLogDir(): string {
    try {
        return path.join(process.cwd(), 'logs')
    } catch {
        return '/tmp/n0-logs'
    }
}

// ─── File Discovery ──────────────────────────────────────────────────────────

/**
 * Discover all JSONL log files in the log directory.
 * Returns metadata for each file including channel, date, and size.
 */
export function discoverLogFiles(logDir?: string): LogFileInfo[] {
    const dir = logDir ?? getLogDir()
    if (!fs.existsSync(dir)) return []

    const files: LogFileInfo[] = []
    for (const name of fs.readdirSync(dir)) {
        const match = name.match(FILE_PATTERN)
        if (!match) continue

        const filePath = path.join(dir, name)
        try {
            const stat = fs.statSync(filePath)
            files.push({
                name,
                channel: match[1],
                date: match[2],
                sizeBytes: stat.size,
                path: filePath,
            })
        } catch {
            // Skip inaccessible files
        }
    }

    // Sort by date descending, then channel
    return files.sort((a, b) =>
        b.date.localeCompare(a.date) || a.channel.localeCompare(b.channel)
    )
}

/**
 * List available dates that have at least one log file.
 */
export function listLogDates(logDir?: string): string[] {
    const files = discoverLogFiles(logDir)
    const dates = new Set(files.map((f) => f.date))
    return Array.from(dates).sort().reverse()
}

/**
 * List available channels that have at least one file.
 */
export function listAvailableChannels(logDir?: string): string[] {
    const files = discoverLogFiles(logDir)
    const channels = new Set(files.map((f) => f.channel))
    return Array.from(channels).sort()
}

// ─── Bounded File Reading ────────────────────────────────────────────────────

interface ReadResult {
    entries: LogEntry[]
    linesParsed: number
    linesSkipped: number
}

/**
 * Read a JSONL file with bounded tail-reading.
 * Reads the last `maxBytes` of the file, parses up to `maxLines`.
 * Tolerates malformed lines (counts them as skipped).
 */
function readJsonlBounded(
    filePath: string,
    maxLines = MAX_LINES_PER_FILE,
    maxBytes = MAX_READ_BYTES,
): ReadResult {
    const result: ReadResult = { entries: [], linesParsed: 0, linesSkipped: 0 }

    if (!fs.existsSync(filePath)) return result

    let stat: fs.Stats
    try {
        stat = fs.statSync(filePath)
    } catch {
        return result
    }
    if (stat.size === 0) return result

    const readSize = Math.min(stat.size, maxBytes)
    const startPos = Math.max(0, stat.size - readSize)

    let fd: number
    try {
        fd = fs.openSync(filePath, 'r')
    } catch {
        return result
    }

    try {
        const buffer = Buffer.alloc(readSize)
        fs.readSync(fd, buffer, 0, readSize, startPos)

        const content = buffer.toString('utf-8')
        const lines = content.split('\n').filter((l) => l.trim().length > 0)

        // Discard first potentially partial line if we started mid-file
        if (startPos > 0 && lines.length > 0) {
            lines.shift()
        }

        // Take last N lines
        const tail = lines.slice(-maxLines)

        for (const line of tail) {
            try {
                const parsed = JSON.parse(line) as LogEntry
                // Minimal validation: must have timestamp and level
                if (parsed.timestamp && parsed.level) {
                    result.entries.push(parsed)
                    result.linesParsed++
                } else {
                    result.linesSkipped++
                }
            } catch {
                result.linesSkipped++
            }
        }
    } finally {
        fs.closeSync(fd)
    }

    return result
}

// ─── Filtering ───────────────────────────────────────────────────────────────

function matchesQuery(entry: LogEntry, query: LogQuery): boolean {
    // Level filter
    if (query.level) {
        const levels = Array.isArray(query.level) ? query.level : [query.level]
        if (!levels.includes(entry.level)) return false
    }

    // Prefix filter
    if (query.prefix) {
        const entryPrefix = entry.prefix as string | undefined
        if (entryPrefix !== query.prefix) return false
    }

    // RequestId
    if (query.requestId) {
        if ((entry.requestId as string) !== query.requestId) return false
    }

    // UserId
    if (query.userId) {
        if ((entry.userId as string) !== query.userId) return false
    }

    // Path filter (substring)
    if (query.path) {
        const entryPath = (entry.path ?? entry.pathname ?? '') as string
        if (!entryPath.includes(query.path)) return false
    }

    // Text search across multiple fields
    if (query.search) {
        const q = query.search.toLowerCase()
        const haystack = [
            entry.message,
            entry.prefix as string,
            entry.requestId as string,
            entry.path as string,
            entry.pathname as string,
            entry.url as string,
            entry.event as string,
            (entry.error as { message?: string })?.message,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
        if (!haystack.includes(q)) return false
    }

    // Date range
    if (query.from) {
        const fromDate = query.from.length === 10 ? `${query.from}T00:00:00.000Z` : query.from
        if (entry.timestamp < fromDate) return false
    }
    if (query.to) {
        const toDate = query.to.length === 10 ? `${query.to}T23:59:59.999Z` : query.to
        if (entry.timestamp > toDate) return false
    }

    return true
}

// ─── Main Query ──────────────────────────────────────────────────────────────

/**
 * Query log files with filtering, searching, and pagination.
 * 
 * KEY FIX: When no channels are specified, reads ALL channels that have files.
 * When no date is specified, reads today's files (or the most recent available).
 */
export function queryLogs(query: LogQuery = {}): LogQueryResult {
    const page = Math.max(1, query.page ?? 1)
    const pageSize = Math.min(200, Math.max(1, query.pageSize ?? 50))
    const sort = query.sort ?? 'desc'

    // Discover all available files
    const allDiscovered = discoverLogFiles()

    // Determine which channels to query
    let targetChannels: string[]
    if (query.channels && query.channels.length > 0) {
        targetChannels = query.channels
    } else {
        // Default: ALL channels that have files
        targetChannels = [...new Set(allDiscovered.map((f) => f.channel))]
        if (targetChannels.length === 0) {
            targetChannels = ['app'] // Fallback
        }
    }

    // Determine which date(s) to read
    let targetDates: string[] | null = null
    if (query.date) {
        targetDates = [query.date]
    } else if (query.from || query.to) {
        const fromDate = query.from?.slice(0, 10) ?? '0000-00-00'
        const toDate = query.to?.slice(0, 10) ?? '9999-99-99'
        targetDates = [...new Set(allDiscovered.map((f) => f.date))]
            .filter((d) => d >= fromDate && d <= toDate)
    } else {
        // Default: last 7 days of available data, or today
        const availableDates = [...new Set(allDiscovered.map((f) => f.date))].sort().reverse()
        targetDates = availableDates.slice(0, 7)
        if (targetDates.length === 0) {
            // Include today even if no file exists yet
            targetDates = [new Date().toISOString().slice(0, 10)]
        }
    }

    // Select files matching channels + dates
    const filesToRead = allDiscovered.filter(
        (f) => targetChannels.includes(f.channel) && (targetDates === null || targetDates.includes(f.date))
    )

    // Read and merge
    let totalLinesParsed = 0
    let totalLinesSkipped = 0
    let allEntries: LogEntry[] = []

    for (const fileInfo of filesToRead) {
        const readResult = readJsonlBounded(fileInfo.path)
        allEntries.push(...readResult.entries)
        totalLinesParsed += readResult.linesParsed
        totalLinesSkipped += readResult.linesSkipped
    }

    // Apply filters
    allEntries = allEntries.filter((e) => matchesQuery(e, query))

    // Sort
    allEntries.sort((a, b) => {
        const cmp = a.timestamp.localeCompare(b.timestamp)
        return sort === 'desc' ? -cmp : cmp
    })

    const total = allEntries.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    // Paginate
    const start = (page - 1) * pageSize
    const paged = allEntries.slice(start, start + pageSize)

    return {
        entries: paged,
        total,
        page,
        pageSize,
        totalPages,
        filesRead: filesToRead.map((f) => f.name),
        linesParsed: totalLinesParsed,
        linesSkipped: totalLinesSkipped,
    }
}

/**
 * Get comprehensive log statistics and available file inventory.
 */
export function getLogStats(logDir?: string): LogStats {
    const dir = logDir ?? getLogDir()
    const exists = fs.existsSync(dir)

    if (!exists) {
        return {
            logDir: dir,
            logDirExists: false,
            totalFiles: 0,
            totalSizeBytes: 0,
            channels: {},
            dates: [],
            files: [],
        }
    }

    const files = discoverLogFiles(dir)
    const channels: Record<string, { files: number; sizeBytes: number }> = {}

    for (const f of files) {
        if (!channels[f.channel]) {
            channels[f.channel] = { files: 0, sizeBytes: 0 }
        }
        channels[f.channel].files++
        channels[f.channel].sizeBytes += f.sizeBytes
    }

    const totalSizeBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0)
    const dates = [...new Set(files.map((f) => f.date))].sort().reverse()

    return {
        logDir: dir,
        logDirExists: true,
        totalFiles: files.length,
        totalSizeBytes,
        channels,
        dates,
        files,
    }
}

/**
 * Get all logs for a specific requestId across all channels.
 */
export function getLogsByRequestId(requestId: string): LogEntry[] {
    return queryLogs({
        requestId,
        pageSize: 200,
        sort: 'asc',
    }).entries
}
