#!/usr/bin/env bun
/**
 * Internal CLI for Logs
 * Uses the existing logger infrastructure.
 */

import { parseArgs } from 'util'
import * as fs from 'node:fs'
import * as path from 'node:path'

import {
    discoverLogFiles,
    getLogStats,
    queryLogs,
    listLogDates,
    listAvailableChannels
} from '../src/lib/logger/log-reader.server'

// ─── Colors ──────────────────────────────────────────────────────────────────

const colors = {
    reset: '\x1b[0m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
}

function colorize(level: string, text: string) {
    switch (level.toLowerCase()) {
        case 'trace': return colors.dim + text + colors.reset
        case 'debug': return colors.cyan + text + colors.reset
        case 'info': return colors.green + text + colors.reset
        case 'warn': return colors.yellow + text + colors.reset
        case 'error': return colors.red + text + colors.reset
        case 'fatal': return colors.bgRed + colors.white + text + colors.reset
        default: return text
    }
}

// ─── Formatting ──────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
}

function prettyPrintEntry(entry: any, showJson = false) {
    if (showJson) {
        console.log(JSON.stringify(entry))
        return
    }

    const ts = new Date(entry.timestamp).toISOString().replace('T', ' ').replace('Z', '')
    const lvl = entry.level.toUpperCase().padEnd(5)
    const channel = (entry.channel || entry.stream || '').padEnd(6)

    let header = `${colors.dim}${ts}${colors.reset} | ${colorize(entry.level, lvl)} | `
    if (channel.trim()) {
        header += `${colors.magenta}${channel}${colors.reset} | `
    }
    if (entry.prefix) {
        header += `${colors.blue}[${entry.prefix}]${colors.reset} `
    }
    header += entry.message

    if (entry.durationMs !== undefined) {
        header += ` ${colors.dim}(${Math.round(entry.durationMs)}ms)${colors.reset}`
    }

    console.log(header)

    if (entry.error) {
        console.log(`  ${colors.red}${entry.error.name}: ${entry.error.message}${colors.reset}`)
        if (entry.error.stack) {
            console.log(`  ${colors.dim}${entry.error.stack.split('\n').slice(1).join('\n')}${colors.reset}`)
        }
    }
    if (entry.path || entry.requestId) {
        let ctx = '  '
        if (entry.method && entry.path) ctx += `${colors.cyan}${entry.method} ${entry.path}${colors.reset} `
        if (entry.requestId) ctx += `${colors.dim}req: ${entry.requestId}${colors.reset} `
        if (entry.userId) ctx += `${colors.dim}user: ${entry.userId}${colors.reset} `
        if (ctx.trim()) console.log(ctx)
    }
}

// ─── Commands ────────────────────────────────────────────────────────────────

async function handleList(args: ReturnType<typeof parseArgs>) {
    const stats = getLogStats()
    console.log(`\n${colors.cyan}Log Directory:${colors.reset} ${stats.logDir}`)
    console.log(`${colors.cyan}Total Size:${colors.reset} ${formatSize(stats.totalSizeBytes)} in ${stats.totalFiles} files\n`)

    if (stats.files.length === 0) {
        console.log(`  ${colors.dim}No log files found.${colors.reset}\n`)
        return
    }

    let filtered = stats.files

    const chFilter = args.values.channel as string
    if (chFilter) {
        filtered = filtered.filter(f => f.channel === chFilter)
    }

    const dateFilter = args.values.date as string
    if (dateFilter) {
        filtered = filtered.filter(f => f.date === dateFilter)
    }

    console.log('File'.padEnd(30, ' ') + 'Channel'.padEnd(10, ' ') + 'Date'.padEnd(15, ' ') + 'Size')
    console.log(''.padEnd(65, '-'))

    for (const f of filtered) {
        console.log(
            `${colors.white}${f.name.padEnd(30, ' ')}${colors.reset}` +
            `${colors.magenta}${f.channel.padEnd(10, ' ')}${colors.reset}` +
            `${colors.dim}${f.date.padEnd(15, ' ')}${colors.reset}` +
            `${formatSize(f.sizeBytes)}`
        )
    }
    console.log()
}

async function handleQuery(args: ReturnType<typeof parseArgs>) {
    const channels = args.values.channel ? [args.values.channel as any] : undefined
    const level = args.values.level as string
    const prefix = args.values.prefix as string
    const search = args.values.search as string
    const requestId = args.values.requestId as string
    const userId = args.values.userId as string
    const path = args.values.path as string
    const date = args.values.date as string
    const from = args.values.from as string
    const to = args.values.to as string
    const limit = Number(args.values.limit) || 50
    const isJson = Boolean(args.values.json)

    const result = queryLogs({
        channels, level, prefix, search, requestId, userId, path, date, from, to, pageSize: limit, sort: 'desc'
    })

    if (!isJson) {
        console.log(`\n${colors.dim}Found ${result.entries.length} entries (parsed ${result.linesParsed} lines from ${result.filesRead.length} files)${colors.reset}\n`)
    }

    // Descending sort from queryLogs means newest first, we reverse it for console output if reading sequentially,
    // but often we want newest at bottom when tailing, or highest at top when querying.
    for (const entry of result.entries.reverse()) {
        prettyPrintEntry(entry, isJson)
    }
}

async function handleStats(args: ReturnType<typeof parseArgs>) {
    const stats = getLogStats()
    console.log(`\n${colors.cyan}Log Statistics${colors.reset}\n`)
    console.log(`Directory:   ${stats.logDir}`)
    console.log(`Total size:  ${formatSize(stats.totalSizeBytes)}`)
    console.log(`Total files: ${stats.totalFiles}\n`)

    console.log(`${colors.cyan}By Channel:${colors.reset}`)
    for (const [ch, info] of Object.entries(stats.channels)) {
        console.log(`  ${ch.padEnd(10, ' ')} : ${String(info.files).padEnd(4, ' ')} files, ${formatSize(info.sizeBytes)}`)
    }

    console.log(`\n${colors.cyan}Available Dates:${colors.reset}`)
    console.log(`  ${stats.dates.join(', ')}\n`)
}

async function handleTail(args: ReturnType<typeof parseArgs>) {
    // Simple tail implementation by repeatedly querying the end of modern files
    const channels = args.values.channel ? [args.values.channel as any] : undefined
    const level = args.values.level as string
    const requestId = args.values.requestId as string
    const search = args.values.search as string
    const pathF = args.values.path as string
    const isJson = Boolean(args.values.json)

    if (!isJson) {
        console.log(`\n${colors.cyan}Tailing logs... (Ctrl+C to stop)${colors.reset}\n`)
    }

    let lastTimestamp = new Date().toISOString()

    // First query: print some context history
    const history = queryLogs({
        channels, level, requestId, search, path: pathF, pageSize: 20, sort: 'desc'
    })

    if (history.entries.length > 0) {
        for (const entry of history.entries.reverse()) {
            prettyPrintEntry(entry, isJson)
        }
    }

    setInterval(() => {
        const recent = queryLogs({
            channels, level, requestId, search, path: pathF, from: lastTimestamp, pageSize: 200, sort: 'asc'
        })

        if (recent.entries.length > 0) {
            // Filter out exact matches of lastTimestamp because 'from' query is usually >= 
            const newEntries = recent.entries.filter(e => e.timestamp > lastTimestamp)
            for (const entry of newEntries) {
                prettyPrintEntry(entry, isJson)
            }
            if (newEntries.length > 0) {
                lastTimestamp = newEntries[newEntries.length - 1].timestamp
            }
        }
    }, 2000)
}

function printHelp() {
    console.log(`
${colors.cyan}ShipFree Logs CLI${colors.reset}

Usage:
  bun run logs <command> [options]

Commands:
  ${colors.white}list${colors.reset}      List discovered log files
  ${colors.white}tail${colors.reset}      Tail logs in near real-time
  ${colors.white}query${colors.reset}     Query historical logs
  ${colors.white}stats${colors.reset}     Show aggregated statistics
  
Options:
  --channel <name>      Filter by channel (app, error, access, client)
  --level <level>       Filter by log level (info, warn, error)
  --prefix <namespace>  Filter by prefix/namespace
  --search <text>       Text search in messages, paths, errors
  --requestId <id>      Filter by request ID
  --userId <id>         Filter by user ID
  --path <path>         Filter by requested path
  --date <YYYY-MM-DD>   Filter by exact date
  --limit <num>         Number of entries to show (default: 50)
  --json                Output raw JSON entries instead of pretty-printed

Examples:
  bun run logs -- list
  bun run logs -- query --level error
  bun run logs -- query --requestId <uuid>
  bun run logs -- tail --channel access
  bun run logs -- tail --search "/api/payments"
`)
    process.exit(0)
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    const args = process.argv.slice(2)

    // Handle `bun run logs -- list` (the `--` pass-through often leaves `--` in args or strips args)
    // Ensure we find the command
    const rawCommand = args.find(a => !a.startsWith('-'))
    const command = rawCommand || 'help'

    const parsed = parseArgs({
        args,
        options: {
            channel: { type: 'string' },
            level: { type: 'string' },
            prefix: { type: 'string' },
            search: { type: 'string' },
            requestId: { type: 'string' },
            userId: { type: 'string' },
            path: { type: 'string' },
            date: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' },
            limit: { type: 'string' },
            json: { type: 'boolean' },
            help: { type: 'boolean', short: 'h' },
        },
        strict: false,
        allowPositionals: true
    })

    if (parsed.values.help) {
        printHelp()
    }

    switch (command) {
        case 'list': return handleList(parsed)
        case 'query': return handleQuery(parsed)
        case 'stats': return handleStats(parsed)
        case 'tail': return handleTail(parsed)
        case 'help': return printHelp()
        default:
            console.log(`${colors.red}Unknown command: ${command}${colors.reset}`)
            printHelp()
    }
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
