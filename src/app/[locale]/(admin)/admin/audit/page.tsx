'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, Info, Terminal, Globe, Monitor } from 'lucide-react'
import { useAdminAudit } from '@/hooks/use-admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

import { AdminPageShell } from '../_components/admin-page-shell'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AuditLog {
  id: string
  adminId: string
  adminName: string | null
  adminEmail: string | null
  adminImage: string | null
  action: string
  targetType: string | null
  targetId: string | null
  beforeData: any | null
  afterData: any | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

function ActionBadge({ action }: { action: string }) {
  const isRed = action.includes('delete') || action.includes('ban')
  const isBlue = action.includes('update') || action.includes('sync')
  const isGreen = action.includes('create') || action.includes('resolve')

  let colorClass = 'bg-muted text-muted-foreground ring-muted'
  if (isRed) colorClass = 'bg-destructive/10 text-destructive ring-destructive/20'
  if (isBlue) colorClass = 'bg-primary/10 text-primary ring-primary/20'
  if (isGreen) colorClass = 'bg-green-500/10 text-green-500 ring-green-500/20'

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium ring-1 ring-inset ${colorClass}`}>
      {action}
    </span>
  )
}

export default function AdminAuditPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search])

  const { data, isLoading: loading, error: queryError } = useAdminAudit(page, 25, debouncedSearch)
  const logs = (data?.logs ?? []) as AuditLog[]
  const pagination = data?.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 }
  const error = queryError ? (queryError as Error).message : null

  const openLogSheet = (log: AuditLog) => {
    setSelectedLog(log)
    setSheetOpen(true)
  }

  return (
    <AdminPageShell
      title='Journal d’audit'
      subtitle='Flux immuable des actions administratives pour la traçabilité et la conformité.'
    >
      <div className='flex items-center gap-3'>
        <div className='relative max-w-sm flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Rechercher par action, cible ou administrateur…'
            className='pl-9'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          {error}
        </div>
      )}

      <div className='rounded-xl border bg-card shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Administrateur</TableHead>
              <TableHead>Cible</TableHead>
              <TableHead className='text-right'>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className='h-4 w-20 animate-pulse rounded bg-muted' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='h-24 text-center text-muted-foreground'>
                  Aucune entrée trouvée.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                  onClick={() => openLogSheet(log)}
                >
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-5 w-5 rounded-sm'>
                        <AvatarImage src={log.adminImage || undefined} />
                        <AvatarFallback className='rounded-sm bg-primary/10 text-[10px] text-primary'>
                          {log.adminName?.substring(0, 1) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-xs font-medium'>{log.adminName || log.adminEmail || 'Admin'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className='text-xs text-muted-foreground'>
                      {log.targetType ? `${log.targetType}:${log.targetId ?? ''}` : '—'}
                    </span>
                  </TableCell>
                  <TableCell className='text-right text-xs text-muted-foreground tabular-nums'>
                    {new Date(log.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className='mt-4 flex items-center justify-between'>
          <p className='text-xs text-muted-foreground'>
            Affichage de {logs.length} sur {pagination.total} entrées
          </p>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={pagination.page <= 1}
              onClick={() => setPage(pagination.page - 1)}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage(pagination.page + 1)}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='flex flex-col gap-0 p-0 sm:max-w-xl w-full'>
          {selectedLog && (
            <>
              <SheetHeader className='px-6 py-6 border-b bg-muted/10'>
                <div className='flex flex-col gap-1'>
                  <ActionBadge action={selectedLog.action} />
                  <SheetTitle className='text-lg mt-2 font-mono truncate'>{selectedLog.id}</SheetTitle>
                  <SheetDescription>
                    Exécuté par {selectedLog.adminName || selectedLog.adminEmail}
                  </SheetDescription>
                </div>
              </SheetHeader>

              <div className='flex-1 overflow-y-auto p-6 space-y-8'>
                {/* Info Grid */}
                <div className='grid grid-cols-2 gap-6'>
                  <div className='space-y-1.5'>
                    <Label className='text-[10px] uppercase text-muted-foreground flex items-center gap-1.5'>
                      <Terminal className='h-3 w-3' /> Source IP
                    </Label>
                    <p className='text-sm font-mono'>{selectedLog.ipAddress || '—'}</p>
                  </div>
                  <div className='space-y-1.5'>
                    <Label className='text-[10px] uppercase text-muted-foreground flex items-center gap-1.5'>
                      <Globe className='h-3 w-3' /> Date & Heure
                    </Label>
                    <p className='text-sm'>{new Date(selectedLog.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-[10px] uppercase text-muted-foreground flex items-center gap-1.5'>
                    <Monitor className='h-3 w-3' /> Agent Utilisateur
                  </Label>
                  <p className='text-xs text-muted-foreground break-all bg-muted/30 p-2 rounded border'>
                    {selectedLog.userAgent || '—'}
                  </p>
                </div>

                <Separator />

                {/* Data Diff */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <Info className='h-4 w-4 text-primary' />
                    <h3 className='text-sm font-medium'>Détails des données</h3>
                  </div>

                  {(selectedLog.beforeData || selectedLog.afterData) ? (
                    <div className='grid gap-4'>
                      {selectedLog.beforeData && (
                        <div className='space-y-1.5'>
                          <Label className='text-[10px] uppercase text-red-500'>Avant modification</Label>
                          <pre className='text-[11px] p-3 rounded-lg bg-destructive/5 border border-destructive/10 overflow-x-auto font-mono'>
                            {JSON.stringify(selectedLog.beforeData, null, 2)}
                          </pre>
                        </div>
                      )}
                      {selectedLog.afterData && (
                        <div className='space-y-1.5'>
                          <Label className='text-[10px] uppercase text-green-500'>Après modification</Label>
                          <pre className='text-[11px] p-3 rounded-lg bg-green-500/5 border border-green-500/10 overflow-x-auto font-mono'>
                            {JSON.stringify(selectedLog.afterData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground italic'>Aucune donnée supplémentaire disponible.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  )
}

function Label({ className, children }: { className?: string, children: React.ReactNode }) {
  return <span className={`font-medium block ${className}`}>{children}</span>
}
