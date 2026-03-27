'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  RefreshCcw,
  Activity,
  AlertCircle,
  Info,
  Terminal,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Calendar,
  Zap,
  Clock,
  ExternalLink,
  Laptop,
  ShieldCheck,
  Globe
} from 'lucide-react'
import { useAdminLogs, useAdminLogStats } from '@/hooks/use-admin'
import { AdminPageShell } from '@/app/[locale]/(admin)/admin/_components/admin-page-shell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

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

interface FileInfo {
  name: string
  channel: string
  date: string
  sizeBytes: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<string, { variant: 'default' | 'error' | 'warning' | 'outline' | 'secondary' | 'success', color: string }> = {
  trace: { variant: 'outline', color: 'text-zinc-500' },
  debug: { variant: 'secondary', color: 'text-blue-500' },
  info: { variant: 'success', color: 'text-emerald-500' },
  warn: { variant: 'warning', color: 'text-amber-500' },
  error: { variant: 'error', color: 'text-red-500' },
  fatal: { variant: 'default', color: 'text-red-600' },
}

const CHANNEL_COLORS: Record<string, string> = {
  app: 'text-purple-500 ring-purple-500/20 bg-purple-500/10',
  access: 'text-cyan-500 ring-cyan-500/20 bg-cyan-500/10',
  error: 'text-red-500 ring-red-500/20 bg-red-500/10',
  audit: 'text-amber-500 ring-amber-500/20 bg-amber-500/10',
  client: 'text-pink-500 ring-pink-500/20 bg-pink-500/10',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtSize = (b: number) => {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

const fmtTime = (ts: string) => {
  try {
    return new Date(ts).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return ts.slice(11, 19)
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LogExplorer() {
  // Basic filters
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [channels, setChannels] = useState<string[]>([])
  const [level, setLevel] = useState('')
  const [prefix, setPrefix] = useState('')
  const [search, setSearch] = useState('')
  const [requestId, setRequestId] = useState('')
  const [userId, setUserId] = useState('')
  const [pathFilter, setPathFilter] = useState('')
  const [date, setDate] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Selection
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Build memoized query params
  const queryParams = useMemo(() => {
    const p: Record<string, string> = {
      page: String(page),
      pageSize: String(pageSize),
      sort: 'desc',
    }
    if (channels.length > 0) p.channels = channels.join(',')
    if (level) p.level = level
    if (prefix) p.prefix = prefix
    if (search) p.search = search
    if (requestId) p.requestId = requestId
    if (userId) p.userId = userId
    if (pathFilter) p.path = pathFilter
    if (date) p.date = date
    return p
  }, [channels, level, prefix, search, requestId, userId, pathFilter, date, page, pageSize])

  // React Query Hooks
  const {
    data: result,
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs,
  } = useAdminLogs(queryParams)

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminLogStats()

  // Handle auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return
    const timer = setInterval(() => {
      refetchLogs()
      refetchStats()
    }, 5000)
    return () => clearInterval(timer)
  }, [autoRefresh, refetchLogs, refetchStats])

  const loading = logsLoading || statsLoading
  const error = logsError ? (logsError as Error).message : null

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    setPage(1)
    setSelectedEntry(null)
    refetchLogs()
    refetchStats()
  }

  const toggleChannel = (ch: string) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]))
  }

  const handleOpenEntry = (entry: LogEntry) => {
    setSelectedEntry(entry)
    setSheetOpen(true)
  }

  const availableChannels = stats
    ? Object.keys(stats.channels).filter((ch) => stats.channels[ch].files > 0)
    : ['app', 'access', 'error', 'audit', 'client']

  const availableDates = stats?.dates ?? []

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <AdminPageShell
      title='Log Explorer'
      subtitle={
        <div className='flex items-center gap-2 mt-1'>
          <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
            <Terminal className='h-3 w-3' />
            {stats?.logDir || '/logs'}
          </span>
          {stats && (
            <span className='text-xs text-muted-foreground'>
              &middot; {stats.totalFiles} fichiers &middot; {fmtSize(stats.totalSizeBytes)}
            </span>
          )}
        </div>
      }
    >
      {/* ── Summary Stats ─────────────────────────────────────── */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6'>
        <Card className='bg-card/50 shadow-sm border-muted/20'>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between'>
              Total Match
              <Activity className='h-3 w-3 text-primary opacity-50' />
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='text-2xl font-bold tracking-tight'>
              {result?.total?.toLocaleString() ?? '—'}
            </div>
            <p className='text-[10px] text-muted-foreground mt-1'>Entrées filtrées</p>
          </CardContent>
        </Card>

        {availableChannels.map((ch) => (
          <Card key={ch} className='bg-card/50 shadow-sm border-muted/20'>
            <CardHeader className='pb-2 pt-4 px-4'>
              <CardTitle className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between'>
                {ch} channel
                <Layers className='h-3 w-3 opacity-50' />
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-4'>
              <div className={cn("text-2xl font-bold tracking-tight", CHANNEL_COLORS[ch]?.split(' ')[0])}>
                {stats?.channels[ch]?.files ?? 0}
              </div>
              <p className='text-[10px] text-muted-foreground mt-1 truncate'>
                {fmtSize(stats?.channels[ch]?.sizeBytes ?? 0)} &middot; local
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter Engine ─────────────────────────────────────── */}
      <Card className='mb-6 border-muted/20 bg-card shadow-sm'>
        <CardContent className='pt-6 space-y-6'>
          {/* Channels Toggle */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Filter className='h-3 w-3 text-muted-foreground' />
              <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Canaux</span>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Button
                variant={channels.length === 0 ? 'default' : 'outline'}
                size='sm'
                className='h-7 text-xs px-3 rounded-full'
                onClick={() => setChannels([])}
              >
                TOUS
              </Button>
              {availableChannels.map((ch) => (
                <Button
                  key={ch}
                  variant={channels.includes(ch) ? 'secondary' : 'outline'}
                  size='sm'
                  className={cn(
                    'h-7 text-xs px-3 rounded-full transition-all capitalize',
                    channels.includes(ch) && (CHANNEL_COLORS[ch] || 'bg-secondary')
                  )}
                  onClick={() => toggleChannel(ch)}
                >
                  {ch}
                </Button>
              ))}
            </div>
          </div>

          <Separator className='opacity-50' />

          {/* Search Grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
            <div className='space-y-2'>
              <label className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                <Zap className='h-3 w-3' /> Niveau
              </label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className='h-9 text-xs bg-muted/20'>
                  <SelectValue placeholder='Tous niveaux' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tous niveaux</SelectItem>
                  {Object.keys(LEVEL_CONFIG).map((l) => (
                    <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2 xl:col-span-2'>
              <label className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                <Search className='h-3 w-3' /> Recherche
              </label>
              <div className='relative'>
                <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Message, erreur, données...'
                  className='pl-9 h-9 text-xs bg-muted/20'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                <Calendar className='h-3 w-3' /> Date
              </label>
              <Select value={date} onValueChange={setDate}>
                <SelectTrigger className='h-9 text-xs bg-muted/20'>
                  <SelectValue placeholder='7 derniers jours' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Récents (7j)</SelectItem>
                  {availableDates.map((d: string) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                <FileText className='h-3 w-3' /> Path / Prefix
              </label>
              <Input
                value={pathFilter || prefix}
                onChange={(e) => {
                  setPathFilter(e.target.value)
                  setPrefix(e.target.value)
                }}
                placeholder='/api/...'
                className='h-9 text-xs bg-muted/20'
              />
            </div>

            <div className='flex items-end gap-2'>
              <Button onClick={() => handleSubmit()} className='h-9 flex-1 shadow-sm' disabled={loading}>
                {loading ? <RefreshCcw className='h-3.5 w-3.5 animate-spin' /> : 'Appliquer'}
              </Button>
              <Button
                variant='outline'
                size='icon'
                className={cn('h-9 w-9 bg-muted/20', autoRefresh && 'text-primary border-primary bg-primary/5')}
                onClick={() => setAutoRefresh(!autoRefresh)}
                title={autoRefresh ? 'Désactiver auto-refresh' : 'Activer auto-refresh (5s)'}
              >
                <RefreshCcw className={cn('h-3.5 w-3.5', autoRefresh && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Table Container ──────────────────────────────────── */}
      {error && (
        <div className='mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2'>
          <AlertCircle className='h-4 w-4' />
          <span>Une erreur est survenue lors de la récupération des logs: {error}</span>
          <Button variant='ghost' size='sm' className='ml-auto' onClick={() => refetchLogs()}>Réessayer</Button>
        </div>
      )}

      {result && (
        <div className='mb-4 flex items-center justify-between px-1'>
          <div className='flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground'>
            <span className='flex items-center gap-1.5'><Clock className='h-3 w-3' /> {result.linesParsed.toLocaleString()} lignes analysées</span>
            {result.linesSkipped > 0 && <span className='text-amber-500 font-bold'>⚠️ {result.linesSkipped} corrompues</span>}
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-[11px] text-muted-foreground mr-2 font-medium'>
              Page {result.page} sur {result.totalPages}
            </span>
            <div className='flex gap-1'>
              <Button
                variant='outline'
                size='icon'
                className='h-7 w-7'
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className='h-3.5 w-3.5' />
              </Button>
              <Button
                variant='outline'
                size='icon'
                className='h-7 w-7'
                disabled={page >= result.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className='rounded-xl border bg-card shadow-sm overflow-hidden'>
        <Table>
          <TableHeader className='bg-muted/30'>
            <TableRow className='hover:bg-transparent border-muted/20'>
              <TableHead className='w-[100px] h-10 text-[10px] uppercase font-bold'>Temps</TableHead>
              <TableHead className='w-[80px] h-10 text-[10px] uppercase font-bold'>Niveau</TableHead>
              <TableHead className='w-[100px] h-10 text-[10px] uppercase font-bold text-center'>Canal</TableHead>
              <TableHead className='h-10 text-[10px] uppercase font-bold'>Message</TableHead>
              <TableHead className='w-[180px] h-10 text-[10px] uppercase font-bold'>Chemin</TableHead>
              <TableHead className='w-[60px] h-10 text-[10px] uppercase font-bold text-right'>Durée</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !result ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className='border-muted/10'>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j} className='py-3'>
                      <div className='h-4 w-full animate-pulse rounded bg-muted/40' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : result?.entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-32 text-center text-muted-foreground'>
                  <div className='flex flex-col items-center gap-2'>
                    <Terminal className='h-8 w-8 opacity-20 mb-1' />
                    <p className='font-medium'>Aucune entrée trouvée</p>
                    <p className='text-xs opacity-70'>Vérifiez vos filtres ou lancez la recherche sur une autre date.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              result?.entries.map((entry, i) => {
                const lc = LEVEL_CONFIG[entry.level] || { variant: 'outline', color: 'text-zinc-500' }
                const channel = (entry.channel || entry.stream || '') as string
                return (
                  <TableRow
                    key={`${entry.timestamp}-${i}`}
                    className='cursor-pointer group border-muted/10 hover:bg-muted/30 transition-colors'
                    onClick={() => handleOpenEntry(entry)}
                  >
                    <TableCell className='py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap'>
                      {fmtTime(entry.timestamp)}
                    </TableCell>
                    <TableCell className='py-2.5'>
                      <Badge variant={lc.variant as any} className={cn("text-[8px] h-4.5 py-0 px-1.5 uppercase font-bold tracking-tight shadow-none ring-1 ring-inset border-none", lc.variant === 'success' && 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20')}>
                        {entry.level}
                      </Badge>
                    </TableCell>
                    <TableCell className='py-2.5 text-center'>
                      {channel && (
                        <span className={cn(
                          'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                          CHANNEL_COLORS[channel] || 'text-zinc-500 bg-zinc-500/10 ring-zinc-500/20'
                        )}>
                          {channel}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='py-2.5 max-w-[400px]'>
                      <div className='flex flex-col gap-0.5'>
                        <span className='text-[13px] font-medium leading-tight truncate group-hover:text-primary transition-colors'>
                          {entry.message}
                        </span>
                        {entry.error && (
                          <span className='text-[10px] text-red-500 font-mono font-medium flex items-center gap-1 mt-0.5'>
                            <AlertCircle className='h-2.5 w-2.5' /> [{entry.error.name}] {entry.error.message.substring(0, 100)}...
                          </span>
                        )}
                        {entry.prefix && (
                          <span className='text-[10px] text-blue-500/80 font-mono'>via {entry.prefix}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='py-2.5 font-mono text-[10px] text-muted-foreground whitespace-nowrap truncate overflow-hidden'>
                      {(entry.path || entry.pathname || '') as string}
                      {entry.requestId && (
                        <span className='block opacity-50 text-[9px] mt-0.5'>req:{entry.requestId.slice(0, 8)}</span>
                      )}
                    </TableCell>
                    <TableCell className='py-2.5 text-right font-mono text-[10px] text-muted-foreground'>
                      {entry.durationMs !== undefined && entry.durationMs !== null
                        ? `${Math.round(entry.durationMs)}ms`
                        : '—'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='flex flex-col gap-0 p-0 sm:max-w-xl w-full'>
          {selectedEntry && (
            <>
              <SheetHeader className='px-6 py-6 border-b bg-muted/10'>
                <div className='flex flex-col gap-1'>
                  <div className='flex items-center gap-2'>
                    <Badge variant={LEVEL_CONFIG[selectedEntry.level]?.variant as any}>
                      {selectedEntry.level.toUpperCase()}
                    </Badge>
                    {selectedEntry.channel && (
                      <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border', CHANNEL_COLORS[selectedEntry.channel])}>
                        {selectedEntry.channel}
                      </span>
                    )}
                  </div>
                  <SheetTitle className='text-lg mt-3 font-semibold leading-relaxed'>{selectedEntry.message}</SheetTitle>
                  <SheetDescription className='font-mono text-xs'>
                    {selectedEntry.timestamp}
                  </SheetDescription>
                </div>
              </SheetHeader>

              <ScrollArea className='flex-1'>
                <div className='p-6 space-y-8'>
                  {/* Diagnostic Context */}
                  <div className='grid grid-cols-2 gap-4'>
                    <DetailItem label='Request ID' icon={Terminal} value={selectedEntry.requestId} mono />
                    <DetailItem label='Trace ID' icon={Activity} value={selectedEntry.traceId} mono />
                    <DetailItem label='Méthode' icon={Zap} value={selectedEntry.method} />
                    <DetailItem label='Code Statut' icon={Info} value={selectedEntry.statusCode} />
                    <DetailItem label='Utilisateur' icon={Layers} value={selectedEntry.userId || selectedEntry.sessionId} mono />
                    <DetailItem label='Locale' icon={Globe} value={selectedEntry.locale || selectedEntry.language} />
                  </div>

                  <DetailItem label='URL / Chemin' icon={ExternalLink} value={(selectedEntry.url || selectedEntry.path || selectedEntry.pathname) as string} long />
                  <DetailItem label='Agent Utilisateur' icon={Laptop} value={selectedEntry.userAgent} long />

                  <Separator className='opacity-50' />

                  {/* Error Stack */}
                  {selectedEntry.error && (
                    <div className='space-y-4'>
                      <div className='flex items-center gap-2 text-red-500'>
                        <AlertCircle className='h-4 w-4' />
                        <h3 className='text-sm font-bold uppercase tracking-wider'>Informations d'erreur</h3>
                      </div>
                      <div className='bg-red-500/5 border border-red-500/10 rounded-lg p-4 space-y-3 font-mono'>
                        <div className='flex items-center gap-2 text-xs'>
                          <span className='font-bold'>{selectedEntry.error.name}:</span>
                          <span>{selectedEntry.error.message}</span>
                        </div>
                        {selectedEntry.error.stack && (
                          <div className='text-[10px] leading-relaxed text-red-700/80 whitespace-pre overflow-x-auto pb-2'>
                            {selectedEntry.error.stack}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata Explorer */}
                  <div className='space-y-4 pb-4'>
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4 text-primary' />
                      <h3 className='text-sm font-bold uppercase tracking-wider'>Données & Contexte</h3>
                    </div>
                    <div className='rounded-lg bg-zinc-950 p-4 border border-zinc-900 shadow-inner group relative'>
                      <div className='absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <Button size='icon' variant='ghost' className='h-6 w-6' onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedEntry, null, 2))
                        }}>
                          <FileText className='h-3 w-3' />
                        </Button>
                      </div>
                      <pre className='text-[11px] leading-relaxed font-mono text-emerald-500/90 overflow-x-auto'>
                        {JSON.stringify(selectedEntry, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  )
}

function DetailItem({
  label,
  value,
  icon: Icon,
  mono = false,
  long = false
}: {
  label: string,
  value?: string | number | null,
  icon: any,
  mono?: boolean,
  long?: boolean
}) {
  if (!value) return null
  return (
    <div className={cn('space-y-1', long && 'col-span-2')}>
      <label className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5'>
        <Icon className='h-3 w-3 opacity-50' /> {label}
      </label>
      <p className={cn(
        'text-sm bg-muted/30 px-2 py-1.5 rounded border border-muted/20 break-all',
        mono && 'font-mono text-xs',
        long ? 'min-h-[2.5rem]' : 'truncate'
      )}>
        {value}
      </p>
    </div>
  )
}
