'use client'

import { useMemo, useState } from 'react'
import { ShieldAlert, MapPin, Calendar, Fingerprint, Activity } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import { AdminPageShell } from '../_components/admin-page-shell'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetPanel,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { resolveFraudEvent } from '@/app/actions/admin-actions'
import { useAdminFraud } from '@/hooks/use-admin'

interface FraudEvent {
  id: string
  userId: string
  signalType: string
  decision: string
  isResolved: boolean
  createdAt: string
  ipAddress: string | null
}

export default function AdminFraudPage() {
  const queryClient = useQueryClient()
  const { data, isLoading: loading, error: queryError } = useAdminFraud()
  const events = (data?.events ?? []) as FraudEvent[]
  const error = queryError ? (queryError as Error).message : null

  // Sheet State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) ?? null
  }, [events, selectedEventId])

  const handleToggleResolve = async () => {
    if (!selectedEvent) return
    try {
      await resolveFraudEvent(selectedEvent.id, !selectedEvent.isResolved)
      toast.success(`Événement ${!selectedEvent.isResolved ? 'résolu' : 'marqué comme non résolu'}`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'fraud'] })
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const openSheet = (event: FraudEvent) => {
    setSelectedEventId(event.id)
    setSheetOpen(true)
  }

  return (
    <AdminPageShell
      title='Fraud Monitor'
      subtitle='Review detected anomalies and resolution statuses.'
    >
      {error && (
        <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          {error}
        </div>
      )}

      <div className='rounded-xl border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Signal</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Decision</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Résolu</TableHead>
              <TableHead className='text-right'>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className='h-4 w-16 animate-pulse rounded bg-muted' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                  Aucun événement de fraude détecté.
                </TableCell>
              </TableRow>
            ) : (
              events.map((e) => (
                <TableRow
                  key={e.id}
                  onClick={() => openSheet(e)}
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                >
                  <TableCell>
                    <span className='rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive-foreground'>
                      {e.signalType?.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className='max-w-[100px] truncate font-mono text-xs text-muted-foreground'>
                    {e.userId}
                  </TableCell>
                  <TableCell>
                    <span className='rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning-foreground'>
                      {e.decision?.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    {e.ipAddress ?? '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${e.isResolved ? 'bg-green-500' : 'bg-destructive'}`}
                    />
                  </TableCell>
                  <TableCell className='text-right text-xs text-muted-foreground'>
                    {new Date(e.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='flex flex-col gap-0 p-0 sm:max-w-md w-full'>
          {selectedEvent && (
            <>
              <SheetHeader className='px-6 py-6 border-b'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center justify-center rounded-xl bg-destructive/10 p-3'>
                    <ShieldAlert className='h-6 w-6 text-destructive' />
                  </div>
                  <div className='flex-1'>
                    <SheetTitle className='text-xl'>Détails de l'Alerte</SheetTitle>
                    <SheetDescription className='flex items-center gap-1.5 mt-1'>
                      <span
                        className={`inline-flex rounded-full h-2 w-2 ${selectedEvent.isResolved ? 'bg-green-500' : 'bg-warning'}`}
                      />
                      {selectedEvent.isResolved ? 'Alerte Résolue' : 'En Attente de Résolution'}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <SheetPanel className='flex-1 p-6 flex flex-col gap-8'>
                <div className='flex flex-col gap-4'>
                  <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                    Métadonnées de l'Alerte
                  </h3>
                  <div className='grid gap-3 text-sm'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Activity className='h-4 w-4' /> Type de Signal
                      </div>
                      <span className='font-medium rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive-foreground'>
                        {selectedEvent.signalType?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Fingerprint className='h-4 w-4' /> Décision IA
                      </div>
                      <span className='font-medium rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning-foreground'>
                        {selectedEvent.decision?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Calendar className='h-4 w-4' /> Date Détection
                      </div>
                      <span className='font-medium'>
                        {new Date(selectedEvent.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className='flex flex-col gap-4'>
                  <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                    Informations Utilisateur
                  </h3>
                  <div className='grid gap-3 text-sm'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Fingerprint className='h-4 w-4' /> ID Utilisateur
                      </div>
                      <span className='font-mono text-xs'>{selectedEvent.userId}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <MapPin className='h-4 w-4' /> Adresse IP
                      </div>
                      <span className='font-mono'>{selectedEvent.ipAddress || '—'}</span>
                    </div>
                  </div>
                </div>
              </SheetPanel>

              <SheetFooter className='px-6 py-4 border-t mt-auto'>
                <Button
                  className='w-full'
                  variant={selectedEvent.isResolved ? 'outline' : 'default'}
                  onClick={handleToggleResolve}
                >
                  {selectedEvent.isResolved ? 'Marquer comme non résolu' : 'Marquer comme résolu'}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  )
}
