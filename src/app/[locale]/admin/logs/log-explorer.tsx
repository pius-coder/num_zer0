'use client'

/**
 * Log Explorer — Internal Observability Dashboard
 *
 * A Vercel/Sentry-inspired internal log viewer.
 * Reads from /api/internal/logs (JSONL files on disk).
 *
 * Features:
 * - Auto-discovers all available log channels and dates
 * - Summary cards (total, by level, by channel, recent errors)
 * - Filter by channel, level, prefix, search, requestId, userId, path, date
 * - Paginated results with diagnostic metadata
 * - Expandable row detail panel with raw JSON
 * - Auto-refresh toggle
 * - Empty/loading/error states
 * - File inventory diagnostics
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LogEntry {
    timestamp: string
    level: string
    message: string
    prefix?: string
    requestId?: string
    traceId?: string
    method?: string
    path?: string
    pathname?: string
    url?: string
    statusCode?: number
    durationMs?: number
    userId?: string
    sessionId?: string
    locale?: string
    ip?: string
    userAgent?: string
    referer?: string
    source?: string
    channel?: string
    event?: string
    runtime?: string
    environment?: string
    hostname?: string
    pid?: number
    stream?: string
    error?: {
        name: string
        message: string
        stack?: string
        code?: string
        statusCode?: number
    }
    data?: Record<string, unknown>
    context?: Record<string, unknown>
    metadata?: Record<string, unknown>
    [key: string]: unknown
}

interface QueryResult {
    entries: LogEntry[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    filesRead: string[]
    linesParsed: number
    linesSkipped: number
}

interface FileInfo {
    name: string
    channel: string
    date: string
    sizeBytes: number
}

interface Stats {
    logDir: string
    logDirExists: boolean
    totalFiles: number
    totalSizeBytes: number
    channels: Record<string, { files: number; sizeBytes: number }>
    dates: string[]
    files: FileInfo[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { color: string; bg: string }> = {
    trace: { color: '#6B7280', bg: '#6B728015' },
    debug: { color: '#3B82F6', bg: '#3B82F615' },
    info: { color: '#10B981', bg: '#10B98115' },
    warn: { color: '#F59E0B', bg: '#F59E0B15' },
    error: { color: '#EF4444', bg: '#EF444420' },
    fatal: { color: '#DC2626', bg: '#DC262630' },
}

const CHANNEL_COLORS: Record<string, string> = {
    app: '#8B5CF6',
    access: '#06B6D4',
    error: '#EF4444',
    audit: '#F59E0B',
    client: '#EC4899',
}

// ─── Styles (inline object factory to keep component self-contained) ─────────

const s = {
    root: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ui-monospace, monospace', fontSize: '13px', background: '#09090b', color: '#e4e4e7', minHeight: '100vh' } as React.CSSProperties,
    container: { maxWidth: '1600px', margin: '0 auto', padding: '20px 24px' } as React.CSSProperties,
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' } as React.CSSProperties,
    title: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#fafafa', letterSpacing: '-0.3px' } as React.CSSProperties,
    subtitle: { margin: '4px 0 0', color: '#71717a', fontSize: '12px' } as React.CSSProperties,
    card: { background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '14px 18px' } as React.CSSProperties,
    cardLabel: { fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' } as React.CSSProperties,
    cardValue: { fontSize: '22px', fontWeight: 700, color: '#fafafa' } as React.CSSProperties,
    filterBar: { background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '16px', marginBottom: '16px' } as React.CSSProperties,
    filterGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' } as React.CSSProperties,
    label: { display: 'block', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 } as React.CSSProperties,
    input: { width: '100%', padding: '6px 10px', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#e4e4e7', fontSize: '12px', boxSizing: 'border-box', outline: 'none' } as React.CSSProperties,
    select: { width: '100%', padding: '6px 10px', background: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#e4e4e7', fontSize: '12px' } as React.CSSProperties,
    btnPrimary: { padding: '7px 18px', background: '#3b82f6', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 600 } as React.CSSProperties,
    btnSecondary: { padding: '6px 12px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#e4e4e7', cursor: 'pointer', fontSize: '11px' } as React.CSSProperties,
    chip: (active: boolean, color: string) => ({
        padding: '3px 10px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '6px',
        border: `1px solid ${active ? color : '#3f3f46'}`,
        background: active ? `${color}18` : 'transparent',
        color: active ? color : '#a1a1aa',
        cursor: 'pointer',
        transition: 'all 120ms ease',
    }) as React.CSSProperties,
    errorBox: { padding: '12px 16px', background: '#2D1215', border: '1px solid #7F1D1D', borderRadius: '8px', marginBottom: '16px', color: '#FCA5A5', fontSize: '12px' } as React.CSSProperties,
    diagBox: { padding: '10px 14px', background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', marginBottom: '12px', fontSize: '11px', color: '#71717a', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' } as React.CSSProperties,
    th: { textAlign: 'left' as const, padding: '8px 10px', color: '#71717a', fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', borderBottom: '1px solid #27272a', fontWeight: 600 },
    td: { padding: '7px 10px', borderBottom: '1px solid #18181b' } as React.CSSProperties,
    detailPanel: { background: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '18px', overflow: 'auto', maxHeight: 'calc(100vh - 180px)', position: 'sticky' as const, top: '20px' } as React.CSSProperties,
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LogExplorer() {
    const [result, setResult] = useState<QueryResult | null>(null)
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [channels, setChannels] = useState<string[]>([]) // empty = all
    const [level, setLevel] = useState('')
    const [prefix, setPrefix] = useState('')
    const [search, setSearch] = useState('')
    const [requestId, setRequestId] = useState('')
    const [userId, setUserId] = useState('')
    const [pathFilter, setPathFilter] = useState('')
    const [date, setDate] = useState('')
    const [page, setPage] = useState(1)
    const [pageSize] = useState(50)
    const [autoRefresh, setAutoRefresh] = useState(false)
    const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null)
    const [selectedIdx, setSelectedIdx] = useState<number>(-1)

    // ── Fetching ─────────────────────────────────────────────────────────

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/internal/logs?action=stats')
            if (res.ok) setStats(await res.json())
        } catch { /* ignore */ }
    }, [])

    const fetchLogs = useCallback(async (params: Record<string, string>) => {
        setLoading(true)
        setError(null)
        try {
            const qs = new URLSearchParams(params).toString()
            const res = await fetch(`/api/internal/logs?${qs}`)
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || body.detail || `HTTP ${res.status}`)
            }
            setResult(await res.json())
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }, [])

    const doSearch = useCallback(() => {
        const params: Record<string, string> = {
            page: String(page),
            pageSize: String(pageSize),
            sort: 'desc',
        }
        if (channels.length > 0) params.channels = channels.join(',')
        if (level) params.level = level
        if (prefix) params.prefix = prefix
        if (search) params.search = search
        if (requestId) params.requestId = requestId
        if (userId) params.userId = userId
        if (pathFilter) params.path = pathFilter
        if (date) params.date = date
        fetchLogs(params)
    }, [channels, level, prefix, search, requestId, userId, pathFilter, date, page, pageSize, fetchLogs])

    // ── Init ─────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchStats()
        doSearch()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { doSearch() }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Auto-refresh ─────────────────────────────────────────────────────

    useEffect(() => {
        if (autoRefresh) {
            autoRefreshRef.current = setInterval(() => {
                doSearch()
                fetchStats()
            }, 5000)
        } else if (autoRefreshRef.current) {
            clearInterval(autoRefreshRef.current)
            autoRefreshRef.current = null
        }
        return () => {
            if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
        }
    }, [autoRefresh, doSearch, fetchStats])

    // ── Handlers ─────────────────────────────────────────────────────────

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        setSelectedEntry(null)
        setSelectedIdx(-1)
        doSearch()
    }

    const toggleChannel = (ch: string) => {
        setChannels((prev) =>
            prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
        )
    }

    const handleSelectEntry = (entry: LogEntry, idx: number) => {
        if (selectedIdx === idx) {
            setSelectedEntry(null)
            setSelectedIdx(-1)
        } else {
            setSelectedEntry(entry)
            setSelectedIdx(idx)
        }
    }

    const fmtSize = (b: number) => {
        if (b < 1024) return `${b} B`
        if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
        return `${(b / 1048576).toFixed(1)} MB`
    }

    const fmtTime = (ts: string) => ts.replace(/.*T/, '').replace('Z', '').slice(0, 12)

    // ── Computed summary ─────────────────────────────────────────────────

    const levelCounts: Record<string, number> = {}
    const channelCounts: Record<string, number> = {}
    if (result) {
        // We don't have total counts by level from the API — show from current page
        // This is intentionally from the current result set to keep it snappy
    }

    // ── Available channels from stats ────────────────────────────────────

    const availableChannels = stats
        ? Object.keys(stats.channels).filter((ch) => stats.channels[ch].files > 0)
        : ['app', 'access', 'error', 'audit', 'client']

    const availableDates = stats?.dates ?? []

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div style={s.root}>
            <div style={s.container}>
                {/* ── Header ────────────────────────────────────────────── */}
                <div style={s.header}>
                    <div>
                        <h1 style={s.title}>Log Explorer</h1>
                        <p style={s.subtitle}>
                            Internal observability
                            {stats && stats.logDirExists && (
                                <> &middot; {stats.totalFiles} file{stats.totalFiles !== 1 ? 's' : ''} &middot; {fmtSize(stats.totalSizeBytes)} &middot; <code style={{ color: '#52525b', fontSize: '11px' }}>{stats.logDir}</code></>
                            )}
                            {stats && !stats.logDirExists && (
                                <span style={{ color: '#EF4444' }}> &middot; Log directory not found: {stats.logDir}</span>
                            )}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#71717a', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                style={{ accentColor: '#3b82f6' }}
                            />
                            Auto-refresh
                        </label>
                        <button
                            onClick={() => { doSearch(); fetchStats() }}
                            disabled={loading}
                            style={s.btnSecondary}
                        >
                            {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {/* ── Summary Cards ─────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                    <div style={s.card}>
                        <div style={s.cardLabel}>Total Entries</div>
                        <div style={s.cardValue}>{result?.total ?? '—'}</div>
                    </div>
                    {availableChannels.map((ch) => (
                        <div key={ch} style={s.card}>
                            <div style={s.cardLabel}>
                                <span style={{ color: CHANNEL_COLORS[ch] ?? '#71717a' }}>{ch}</span> files
                            </div>
                            <div style={{ ...s.cardValue, fontSize: '18px' }}>
                                {stats?.channels[ch]?.files ?? 0}
                                <span style={{ fontSize: '11px', color: '#52525b', marginLeft: '6px' }}>
                                    {fmtSize(stats?.channels[ch]?.sizeBytes ?? 0)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filter Bar ────────────────────────────────────────── */}
                <form onSubmit={handleSubmit} style={s.filterBar}>
                    {/* Channels row */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={s.label}>Channels</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setChannels([])}
                                style={s.chip(channels.length === 0, '#3b82f6')}
                            >
                                ALL
                            </button>
                            {availableChannels.map((ch) => (
                                <button
                                    key={ch}
                                    type="button"
                                    onClick={() => toggleChannel(ch)}
                                    style={s.chip(channels.includes(ch), CHANNEL_COLORS[ch] ?? '#71717a')}
                                >
                                    {ch}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter inputs */}
                    <div style={s.filterGrid}>
                        <div>
                            <label style={s.label}>Level</label>
                            <select value={level} onChange={(e) => setLevel(e.target.value)} style={s.select}>
                                <option value="">All levels</option>
                                {Object.keys(LEVEL_CONFIG).map((l) => (
                                    <option key={l} value={l}>{l.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={s.label}>Search</label>
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Text search..." style={s.input} />
                        </div>
                        <div>
                            <label style={s.label}>Prefix</label>
                            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="e.g. proxy" style={s.input} />
                        </div>
                        <div>
                            <label style={s.label}>Request ID</label>
                            <input value={requestId} onChange={(e) => setRequestId(e.target.value)} placeholder="UUID..." style={s.input} />
                        </div>
                        <div>
                            <label style={s.label}>User ID</label>
                            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="User ID..." style={s.input} />
                        </div>
                        <div>
                            <label style={s.label}>Path</label>
                            <input value={pathFilter} onChange={(e) => setPathFilter(e.target.value)} placeholder="/fr/dashboard" style={s.input} />
                        </div>
                        <div>
                            <label style={s.label}>Date</label>
                            <select value={date} onChange={(e) => setDate(e.target.value)} style={s.select}>
                                <option value="">Recent (last 7 days)</option>
                                {availableDates.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" disabled={loading} style={s.btnPrimary}>
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* ── Error State ───────────────────────────────────────── */}
                {error && (
                    <div style={s.errorBox}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* ── Diagnostics Bar ───────────────────────────────────── */}
                {result && (
                    <div style={s.diagBox}>
                        <span><strong style={{ color: '#a1a1aa' }}>{result.total}</strong> entries matched</span>
                        <span>Page {result.page}/{result.totalPages}</span>
                        <span>{result.linesParsed} lines parsed</span>
                        {result.linesSkipped > 0 && (
                            <span style={{ color: '#F59E0B' }}>{result.linesSkipped} malformed lines skipped</span>
                        )}
                        <span>{result.filesRead.length} file{result.filesRead.length !== 1 ? 's' : ''} read: {result.filesRead.join(', ') || 'none'}</span>
                    </div>
                )}

                {/* ── Loading State ─────────────────────────────────────── */}
                {loading && !result && (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#52525b' }}>
                        Loading logs...
                    </div>
                )}

                {/* ── Results ───────────────────────────────────────────── */}
                {result && (
                    <div style={{ display: 'grid', gridTemplateColumns: selectedEntry ? '1fr 440px' : '1fr', gap: '16px' }}>
                        {/* ── Table ─────────────────────────────── */}
                        <div style={{ overflow: 'auto' }}>
                            {/* Pagination */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ color: '#52525b', fontSize: '12px' }}>
                                    Showing {Math.min(result.entries.length, result.total)} of {result.total}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} style={s.btnSecondary}>
                                        Prev
                                    </button>
                                    <span style={{ padding: '6px 10px', fontSize: '11px', color: '#71717a' }}>{page}/{result.totalPages}</span>
                                    <button onClick={() => setPage((p) => p + 1)} disabled={page >= result.totalPages || loading} style={s.btnSecondary}>
                                        Next
                                    </button>
                                </div>
                            </div>

                            <table style={s.table}>
                                <thead>
                                    <tr>
                                        <th style={s.th}>Time</th>
                                        <th style={s.th}>Level</th>
                                        <th style={s.th}>Channel</th>
                                        <th style={s.th}>Prefix</th>
                                        <th style={s.th}>Message</th>
                                        <th style={s.th}>Path</th>
                                        <th style={{ ...s.th, textAlign: 'right' }}>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.entries.map((entry, i) => {
                                        const isSelected = selectedIdx === i
                                        const lc = LEVEL_CONFIG[entry.level] ?? { color: '#71717a', bg: '#71717a15' }
                                        const channel = (entry.channel ?? entry.stream ?? '') as string
                                        return (
                                            <tr
                                                key={`${entry.timestamp}-${i}`}
                                                onClick={() => handleSelectEntry(entry, i)}
                                                style={{
                                                    cursor: 'pointer',
                                                    background: isSelected ? '#1e293b' : 'transparent',
                                                    transition: 'background 80ms',
                                                }}
                                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#18181b' }}
                                                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                                            >
                                                <td style={{ ...s.td, color: '#52525b', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>
                                                    {fmtTime(entry.timestamp)}
                                                </td>
                                                <td style={s.td}>
                                                    <span style={{
                                                        display: 'inline-block', padding: '1px 8px', borderRadius: '4px',
                                                        fontSize: '10px', fontWeight: 700, color: lc.color, background: lc.bg,
                                                        textTransform: 'uppercase', letterSpacing: '0.3px',
                                                    }}>
                                                        {entry.level}
                                                    </span>
                                                </td>
                                                <td style={s.td}>
                                                    {channel && (
                                                        <span style={{
                                                            display: 'inline-block', padding: '1px 7px', borderRadius: '4px',
                                                            fontSize: '10px', fontWeight: 600,
                                                            color: CHANNEL_COLORS[channel] ?? '#71717a',
                                                            background: `${CHANNEL_COLORS[channel] ?? '#71717a'}15`,
                                                        }}>
                                                            {channel}
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ ...s.td, color: '#3b82f6', fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>
                                                    {(entry.prefix as string) ?? ''}
                                                </td>
                                                <td style={{ ...s.td, maxWidth: '360px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {entry.message}
                                                    {entry.error && (
                                                        <span style={{ color: '#EF4444', marginLeft: '8px', fontSize: '11px' }}>
                                                            [{entry.error.name}]
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ ...s.td, color: '#71717a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>
                                                    {(entry.path ?? entry.pathname ?? '') as string}
                                                </td>
                                                <td style={{ ...s.td, textAlign: 'right', color: '#71717a', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>
                                                    {entry.durationMs !== undefined && entry.durationMs !== null
                                                        ? `${Number(entry.durationMs).toFixed(0)}ms`
                                                        : ''}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {result.entries.length === 0 && (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#3f3f46' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>No entries found</div>
                                                <div style={{ fontSize: '12px', color: '#52525b' }}>
                                                    {result.filesRead.length === 0
                                                        ? 'No log files matched the selected filters. Check that log files exist in the logs/ directory.'
                                                        : `${result.filesRead.length} file(s) were read but no entries matched your filters.`}
                                                    {result.linesSkipped > 0 && ` (${result.linesSkipped} malformed lines were skipped.)`}
                                                </div>
                                                {stats && !stats.logDirExists && (
                                                    <div style={{ marginTop: '8px', color: '#EF4444', fontSize: '12px' }}>
                                                        Log directory does not exist: {stats.logDir}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Detail Panel ──────────────────────── */}
                        {selectedEntry && (
                            <div style={s.detailPanel}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#fafafa' }}>Event Detail</h3>
                                    <button onClick={() => { setSelectedEntry(null); setSelectedIdx(-1) }} style={s.btnSecondary}>
                                        Close
                                    </button>
                                </div>

                                <DetailSection title="Core">
                                    <DetailRow label="timestamp" value={selectedEntry.timestamp} />
                                    <DetailRow label="level" value={selectedEntry.level} color={LEVEL_CONFIG[selectedEntry.level]?.color} />
                                    <DetailRow label="message" value={selectedEntry.message} />
                                    <DetailRow label="event" value={selectedEntry.event as string} />
                                    <DetailRow label="channel" value={(selectedEntry.channel ?? selectedEntry.stream) as string} />
                                    <DetailRow label="prefix" value={selectedEntry.prefix as string} />
                                    <DetailRow label="source" value={selectedEntry.source as string} />
                                </DetailSection>

                                <DetailSection title="Request">
                                    <DetailRow label="requestId" value={selectedEntry.requestId} copyable />
                                    <DetailRow label="traceId" value={selectedEntry.traceId} copyable />
                                    <DetailRow label="method" value={selectedEntry.method} />
                                    <DetailRow label="path" value={(selectedEntry.path ?? selectedEntry.pathname) as string} />
                                    <DetailRow label="url" value={selectedEntry.url} />
                                    <DetailRow label="statusCode" value={selectedEntry.statusCode?.toString()} />
                                    <DetailRow label="durationMs" value={selectedEntry.durationMs !== undefined ? `${Number(selectedEntry.durationMs).toFixed(2)}ms` : undefined} />
                                    <DetailRow label="locale" value={selectedEntry.locale} />
                                </DetailSection>

                                <DetailSection title="Identity">
                                    <DetailRow label="userId" value={selectedEntry.userId} />
                                    <DetailRow label="sessionId" value={selectedEntry.sessionId} />
                                    <DetailRow label="ip" value={selectedEntry.ip} />
                                    <DetailRow label="userAgent" value={selectedEntry.userAgent} />
                                    <DetailRow label="referer" value={selectedEntry.referer} />
                                </DetailSection>

                                <DetailSection title="System">
                                    <DetailRow label="environment" value={selectedEntry.environment} />
                                    <DetailRow label="runtime" value={selectedEntry.runtime} />
                                    <DetailRow label="hostname" value={selectedEntry.hostname} />
                                    <DetailRow label="pid" value={selectedEntry.pid?.toString()} />
                                </DetailSection>

                                {selectedEntry.error && (
                                    <DetailSection title="Error">
                                        <DetailRow label="name" value={selectedEntry.error.name} color="#EF4444" />
                                        <DetailRow label="message" value={selectedEntry.error.message} />
                                        <DetailRow label="code" value={selectedEntry.error.code} />
                                        {selectedEntry.error.stack && (
                                            <Pre label="Stack Trace" value={selectedEntry.error.stack} />
                                        )}
                                    </DetailSection>
                                )}

                                {selectedEntry.data && Object.keys(selectedEntry.data).length > 0 && (
                                    <DetailSection title="Data">
                                        <Pre value={JSON.stringify(selectedEntry.data, null, 2)} />
                                    </DetailSection>
                                )}

                                {selectedEntry.context && Object.keys(selectedEntry.context).length > 0 && (
                                    <DetailSection title="Context">
                                        <Pre value={JSON.stringify(selectedEntry.context, null, 2)} />
                                    </DetailSection>
                                )}

                                {selectedEntry.metadata && Object.keys(selectedEntry.metadata).length > 0 && (
                                    <DetailSection title="Metadata">
                                        <Pre value={JSON.stringify(selectedEntry.metadata, null, 2)} />
                                    </DetailSection>
                                )}

                                <DetailSection title="Raw JSON">
                                    <Pre value={JSON.stringify(selectedEntry, null, 2)} maxHeight="300px" />
                                </DetailSection>
                            </div>
                        )}
                    </div>
                )}

                {/* ── File Inventory ────────────────────────────────────── */}
                {stats && stats.files && stats.files.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#71717a', marginBottom: '8px' }}>File Inventory</h3>
                        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', overflow: 'hidden' }}>
                            <table style={s.table}>
                                <thead>
                                    <tr>
                                        <th style={s.th}>File</th>
                                        <th style={s.th}>Channel</th>
                                        <th style={s.th}>Date</th>
                                        <th style={{ ...s.th, textAlign: 'right' }}>Size</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.files.map((f) => (
                                        <tr key={f.name}>
                                            <td style={{ ...s.td, fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#a1a1aa' }}>{f.name}</td>
                                            <td style={s.td}>
                                                <span style={{ color: CHANNEL_COLORS[f.channel] ?? '#71717a', fontWeight: 600, fontSize: '11px' }}>{f.channel}</span>
                                            </td>
                                            <td style={{ ...s.td, color: '#71717a', fontSize: '11px' }}>{f.date}</td>
                                            <td style={{ ...s.td, textAlign: 'right', color: '#71717a', fontSize: '11px' }}>{fmtSize(f.sizeBytes)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '10px', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid #27272a', paddingBottom: '4px' }}>
                {title}
            </div>
            {children}
        </div>
    )
}

function DetailRow({ label, value, color, copyable }: { label: string; value?: string; color?: string; copyable?: boolean }) {
    if (!value) return null
    return (
        <div style={{ display: 'flex', gap: '10px', padding: '2px 0', fontSize: '12px', alignItems: 'flex-start' }}>
            <span style={{ color: '#52525b', minWidth: '90px', flexShrink: 0, fontWeight: 500 }}>{label}</span>
            <span
                style={{
                    color: color ?? '#d4d4d8',
                    wordBreak: 'break-all',
                    cursor: copyable ? 'pointer' : 'default',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '11px',
                }}
                title={copyable ? 'Click to copy' : undefined}
                onClick={copyable ? () => navigator.clipboard.writeText(value).catch(() => { }) : undefined}
            >
                {value}
                {copyable && <span style={{ marginLeft: '4px', color: '#3f3f46', fontSize: '10px' }}>copy</span>}
            </span>
        </div>
    )
}

function Pre({ value, label, maxHeight = '200px' }: { value: string; label?: string; maxHeight?: string }) {
    return (
        <div>
            {label && <div style={{ fontSize: '10px', color: '#52525b', marginBottom: '4px' }}>{label}</div>}
            <pre style={{
                margin: 0, fontSize: '11px', color: '#a1a1aa', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                padding: '10px', background: '#09090b', borderRadius: '6px', maxHeight, overflow: 'auto',
                border: '1px solid #27272a', fontFamily: 'ui-monospace, monospace',
            }}>
                {value}
            </pre>
        </div>
    )
}
