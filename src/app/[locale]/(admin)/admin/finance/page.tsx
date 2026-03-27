'use client'

import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Receipt,
  CreditCard,
  Activity,
  Calendar,
  Globe,
  AlertCircle,
  Ban,
  Undo2,
  RefreshCcw,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminPurchases, useAdminActivations } from '@/hooks/use-admin'

import { AdminPageShell } from '../_components/admin-page-shell'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetPanel,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { refundPurchase, cancelActivation, syncPurchaseWithFapshi } from '@/app/actions/admin-actions'

type Tab = 'purchases' | 'activations'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    credited: 'bg-green-500/10 text-green-500',
    completed: 'bg-green-500/10 text-green-500',
    confirmed: 'bg-blue-500/10 text-blue-500',
    initiated: 'bg-muted text-muted-foreground',
    payment_pending: 'bg-yellow-500/10 text-yellow-500',
    waiting: 'bg-yellow-500/10 text-yellow-500',
    assigned: 'bg-blue-500/10 text-blue-500',
    failed: 'bg-destructive/10 text-destructive',
    cancelled: 'bg-muted text-muted-foreground',
    expired: 'bg-muted text-muted-foreground',
    requested: 'bg-muted text-muted-foreground',
    received: 'bg-blue-500/10 text-blue-500',
    refunded: 'bg-yellow-500/10 text-yellow-500',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function DataTable({
  tab,
  page,
  onPageChange,
}: {
  tab: Tab
  page: number
  onPageChange: (p: number) => void
}) {
  const queryClient = useQueryClient()
  const {
    data: qData,
    isLoading: loading,
    error: queryError,
  } = tab === 'purchases' ? useAdminPurchases(page) : useAdminActivations(page)

  const data = (tab === 'purchases' ? qData?.purchases : qData?.activations) ?? []
  const pagination = qData?.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 }
  const error = queryError ? (queryError as Error).message : null

  // Sheet State
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const selectedItem = useMemo(() => {
    return data.find((i: any) => i.id === selectedItemId) ?? null
  }, [data, selectedItemId])

  const handleRefundPurchase = async () => {
    if (!selectedItem || !confirm('Êtes-vous sûr de vouloir rembourser cet achat ?')) return
    setActionLoading(true)
    try {
      await refundPurchase(selectedItem.id)
      toast.success('Achat remboursé')
      queryClient.invalidateQueries({ queryKey: ['admin', 'purchases'] })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelActivation = async () => {
    if (!selectedItem || !confirm('Êtes-vous sûr de vouloir annuler cette activation ?')) return
    setActionLoading(true)
    try {
      await cancelActivation(selectedItem.id)
      toast.success('Activation annulée')
      queryClient.invalidateQueries({ queryKey: ['admin', 'activations'] })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSyncFapshi = async () => {
    if (!selectedItem) return
    setActionLoading(true)
    try {
      await syncPurchaseWithFapshi(selectedItem.id)
      toast.success('Données synchronisées avec Fapshi')
      queryClient.invalidateQueries({ queryKey: ['admin', 'purchases'] })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const openSheet = (item: any) => {
    setSelectedItemId(item.id)
    setSheetOpen(true)
  }

  if (error) {
    return (
      <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
        {error}
      </div>
    )
  }

  return (
    <>
      <div className='rounded-xl border'>
        <Table>
          <TableHeader>
            <TableRow>
              {tab === 'purchases' ? (
                <>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className='text-right'>Crédits</TableHead>
                  <TableHead className='text-right'>Prix XAF</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className='text-right'>Date</TableHead>
                </>
              ) : (
                <>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead className='text-right'>Crédits</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead className='text-right'>Date</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className='h-4 w-16 animate-pulse rounded bg-muted' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-24 text-center text-muted-foreground'>
                  Aucune donnée.
                </TableCell>
              </TableRow>
            ) : tab === 'purchases' ? (
              data.map((p: any) => (
                <TableRow
                  key={p.id}
                  onClick={() => openSheet(p)}
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                >
                  <TableCell className='max-w-[80px] truncate font-mono text-xs'>{p.id}</TableCell>
                  <TableCell className='max-w-[100px] truncate font-mono text-xs text-muted-foreground'>
                    {p.userId}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {p.totalCredits?.toLocaleString()}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {p.priceXaf?.toLocaleString()}
                  </TableCell>
                  <TableCell className='text-xs'>{p.paymentMethod?.replace(/_/g, ' ')}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className='text-right text-muted-foreground text-xs'>
                    {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              data.map((a: any) => (
                <TableRow
                  key={a.id}
                  onClick={() => openSheet(a)}
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                >
                  <TableCell className='max-w-[80px] truncate font-mono text-xs'>{a.id}</TableCell>
                  <TableCell className='max-w-[100px] truncate font-mono text-xs text-muted-foreground'>
                    {a.userId}
                  </TableCell>
                  <TableCell>{a.countryCode}</TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {a.creditsCharged?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={a.state} />
                  </TableCell>
                  <TableCell className='font-mono text-xs'>{a.phoneNumber ?? '—'}</TableCell>
                  <TableCell className='text-right text-muted-foreground text-xs'>
                    {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className='flex items-center justify-between mt-4'>
          <p className='text-sm text-muted-foreground'>
            Page {pagination.page} sur {pagination.totalPages}
          </p>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={page >= pagination.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Item Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='flex flex-col gap-0 p-0 sm:max-w-md w-full'>
          {selectedItem && (
            <>
              <SheetHeader className='px-6 py-6 border-b'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center justify-center rounded-xl bg-primary/10 p-3'>
                    {tab === 'purchases' ? (
                      <Receipt className='h-6 w-6 text-primary' />
                    ) : (
                      <Activity className='h-6 w-6 text-primary' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <SheetTitle className='text-xl'>
                      Détails de {tab === 'purchases' ? "l'Achat" : "l'Activation"}
                    </SheetTitle>
                    <SheetDescription className='flex items-center gap-1.5 mt-1'>
                      <StatusBadge
                        status={tab === 'purchases' ? selectedItem.status : selectedItem.state}
                      />
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <SheetPanel className='flex-1 p-6 flex flex-col gap-8'>
                <div className='flex flex-col gap-4'>
                  <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                    Informations Générales
                  </h3>
                  <div className='grid gap-3 text-sm'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <AlertCircle className='h-4 w-4' /> ID Transaction
                      </div>
                      <span className='font-mono text-xs bg-muted px-2 py-1 rounded-md'>
                        {selectedItem.id}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Calendar className='h-4 w-4' /> Créé le
                      </div>
                      <span className='font-medium'>
                        {new Date(selectedItem.createdAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(selectedItem.createdAt).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>
                    {selectedItem.userId && (
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-muted-foreground'>User ID</div>
                        <span className='font-mono text-xs'>{selectedItem.userId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {tab === 'purchases' ? (
                  <div className='flex flex-col gap-4'>
                    <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                      Détails de paiement
                    </h3>
                    <div className='grid gap-3 text-sm'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-muted-foreground'>
                          <CreditCard className='h-4 w-4' /> Méthode
                        </div>
                        <span className='font-medium capitalize'>
                          {selectedItem.paymentMethod?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-muted-foreground'>
                          Montant XAF
                        </div>
                        <span className='font-medium'>
                          {selectedItem.priceXaf?.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-muted-foreground'>
                          Crédits Totaux
                        </div>
                        <span className='font-medium font-mono text-primary'>
                          {selectedItem.totalCredits?.toLocaleString()} cr
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='flex flex-col gap-4'>
                    <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                      Détails d'activation
                    </h3>
                    <div className='grid gap-3 text-sm'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-muted-foreground'>
                          <Globe className='h-4 w-4' /> Pays
                        </div>
                        <span className='font-medium uppercase'>{selectedItem.countryCode}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-muted-foreground'>Service</div>
                        <span className='font-medium'>{selectedItem.serviceCode}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-muted-foreground'>Numéro</div>
                        <span className='font-medium font-mono'>
                          {selectedItem.phoneNumber || '—'}
                        </span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-muted-foreground'>
                          Fournisseur
                        </div>
                        <span className='font-medium'>{selectedItem.providerId}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-muted-foreground'>Coût</div>
                        <span className='font-medium font-mono text-primary'>
                          {selectedItem.creditsCharged?.toLocaleString()} cr
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </SheetPanel>

              <SheetFooter className='px-6 py-4 border-t mt-auto'>
                {tab === 'purchases' ? (
                  <>
                    <Button
                      className='w-full'
                      variant='outline'
                      disabled={selectedItem.status !== 'credited' || actionLoading}
                      onClick={handleRefundPurchase}
                    >
                      <Undo2 className='mr-2 h-4 w-4' />
                      Marquer comme remboursé
                    </Button>
                    {selectedItem.status !== 'credited' && selectedItem.status !== 'failed' && (
                      <Button
                        className='w-full mt-2'
                        variant='secondary'
                        disabled={actionLoading}
                        onClick={handleSyncFapshi}
                      >
                        <RefreshCcw className={`mr-2 h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
                        Synchroniser avec Fapshi
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    className='w-full'
                    variant='destructive'
                    disabled={
                      !['waiting', 'assigned'].includes(selectedItem.state) || actionLoading
                    }
                    onClick={handleCancelActivation}
                  >
                    <Ban className='mr-2 h-4 w-4' />
                    Forcer l'annulation
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet >
    </>
  )
}

export default function AdminFinancePage() {
  const [tab, setTab] = useState<Tab>('purchases')
  const [purchasesPage, setPurchasesPage] = useState(1)
  const [activationsPage, setActivationsPage] = useState(1)

  return (
    <AdminPageShell title='Finance' subtitle='Achats crédits et activations SMS.'>
      <div className='flex gap-1 rounded-lg bg-muted/50 p-1 mb-4 w-fit'>
        {(['purchases', 'activations'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === t
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {t === 'purchases' ? 'Achats' : 'Activations'}
          </button>
        ))}
      </div>

      {tab === 'purchases' ? (
        <DataTable tab='purchases' page={purchasesPage} onPageChange={setPurchasesPage} />
      ) : (
        <DataTable tab='activations' page={activationsPage} onPageChange={setActivationsPage} />
      )}
    </AdminPageShell>
  )
}
