'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Ban,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  Wallet,
  Loader2,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetPanel,
  SheetFooter,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updateUserAccountStatus, manualCreditAdjustment } from '@/app/actions/admin-actions'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAdminUsers } from '@/hooks/use-admin'

interface User {
  id: string
  name: string
  email: string | null
  phoneNumber: string | null
  image: string | null
  createdAt: string
  isBanned: boolean
  baseBalance: number
  bonusBalance: number
  promoBalance: number
}

function getInitials(name: string) {
  return name.substring(0, 2).toUpperCase()
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search])

  const { data, isLoading, error: queryError } = useAdminUsers(page, 25, debouncedSearch)
  const users = (data?.users ?? []) as User[]
  const pagination = data?.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 }
  const error = queryError ? (queryError as Error).message : null

  // Sheet State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Adjustment Form State
  const [adjusting, setAdjusting] = useState(false)
  const [adjustType, setAdjustType] = useState<'base' | 'bonus' | 'promotional'>('base')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  const handleToggleBan = async () => {
    if (!selectedUserId) return
    const user = users.find((u) => u.id === selectedUserId)
    if (!user) return

    try {
      await updateUserAccountStatus(user.id, !user.isBanned)
      toast.success(`Utilisateur ${!user.isBanned ? 'banni' : 'débanni'} avec succès`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !adjustAmount || !adjustReason) return

    setAdjusting(true)
    try {
      await manualCreditAdjustment(selectedUserId, Number(adjustAmount), adjustType, adjustReason)
      toast.success('Crédits ajustés avec succès')
      setAdjustAmount('')
      setAdjustReason('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setAdjusting(false)
    }
  }

  const openUserSheet = (user: User) => {
    setSelectedUserId(user.id)
    setSheetOpen(true)
    setAdjustAmount('')
    setAdjustReason('')
    setAdjustType('base')
  }

  const selectedUser = users.find((u) => u.id === selectedUserId) || null

  return (
    <AdminPageShell title='Utilisateurs' subtitle={`${pagination.total} utilisateur(s) au total`}>
      <div className='flex items-center gap-3'>
        <div className='relative max-w-sm flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Rechercher par nom, email, téléphone…'
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

      <div className='rounded-xl border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className='text-right'>Solde</TableHead>
              <TableHead className='text-right'>Inscrit le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className='h-4 w-20 animate-pulse rounded bg-muted' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='h-24 text-center text-muted-foreground'>
                  Aucun utilisateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow
                  key={u.id}
                  onClick={() => openUserSheet(u)}
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                >
                  <TableCell className='font-medium'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-8 w-8 rounded-lg'>
                        <AvatarImage src={u.image || undefined} alt={u.name} />
                        <AvatarFallback className='rounded-lg bg-primary/10 text-primary text-xs'>
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      {u.name}
                    </div>
                  </TableCell>
                  <TableCell className='text-muted-foreground'>{u.email ?? '—'}</TableCell>
                  <TableCell className='text-muted-foreground'>{u.phoneNumber ?? '—'}</TableCell>
                  <TableCell>
                    {u.isBanned ? (
                      <span className='inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive ring-1 ring-inset ring-destructive/20'>
                        Banni
                      </span>
                    ) : (
                      <span className='inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-500/20'>
                        Actif
                      </span>
                    )}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {(u.baseBalance + u.bonusBalance + u.promoBalance).toLocaleString()}
                    <span className='ml-1 text-xs text-muted-foreground'>cr</span>
                  </TableCell>
                  <TableCell className='text-right text-muted-foreground'>
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <div className='flex items-center justify-between'>
          <p className='text-sm text-muted-foreground'>
            Page {pagination.page} sur {pagination.totalPages}
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

      {/* User Details & Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='flex flex-col gap-0 p-0 sm:max-w-md w-full'>
          {selectedUser && (
            <>
              <SheetHeader className='px-6 py-6 border-b'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <Avatar className='h-12 w-12 rounded-xl'>
                      <AvatarImage src={selectedUser.image || undefined} alt={selectedUser.name} />
                      <AvatarFallback className='rounded-xl bg-primary/10 text-primary text-lg font-medium'>
                        {getInitials(selectedUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className='text-xl'>{selectedUser.name}</SheetTitle>
                      <SheetDescription className='flex items-center gap-1.5 mt-1'>
                        <span
                          className={`inline-flex rounded-full h-2 w-2 ${selectedUser.isBanned ? 'bg-destructive' : 'bg-green-500'}`}
                        />
                        {selectedUser.isBanned ? 'Compte Banni' : 'Compte Actif'}
                      </SheetDescription>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <SheetPanel className='flex-1 p-6 flex flex-col gap-8'>
                {/* Info Section */}
                <div className='flex flex-col gap-4'>
                  <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                    Informations
                  </h3>
                  <div className='grid gap-3 text-sm'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Mail className='h-4 w-4' /> Email
                      </div>
                      <span className='font-medium'>{selectedUser.email || '—'}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Phone className='h-4 w-4' /> Téléphone
                      </div>
                      <span className='font-medium'>{selectedUser.phoneNumber || '—'}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Calendar className='h-4 w-4' /> Inscription
                      </div>
                      <span className='font-medium'>
                        {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Wallet Section */}
                <div className='flex flex-col gap-4'>
                  <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                    <Wallet className='h-4 w-4' /> Portefeuille
                  </h3>
                  <div className='grid gap-3 text-sm'>
                    <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
                      <span className='text-muted-foreground'>Crédits de Base</span>
                      <span className='font-mono font-medium'>
                        {selectedUser.baseBalance.toLocaleString()} cr
                      </span>
                    </div>
                    <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
                      <span className='text-muted-foreground'>Crédits Bonus</span>
                      <span className='font-mono font-medium'>
                        {selectedUser.bonusBalance.toLocaleString()} cr
                      </span>
                    </div>
                    <div className='flex items-center justify-between p-3 rounded-lg border bg-muted/20'>
                      <span className='text-muted-foreground'>Crédits Promotionnels</span>
                      <span className='font-mono font-medium'>
                        {selectedUser.promoBalance.toLocaleString()} cr
                      </span>
                    </div>
                  </div>

                  {/* Adjustment Form */}
                  <div className='mt-2 p-4 rounded-xl border bg-card shadow-sm'>
                    <form onSubmit={handleCreditAdjustment} className='space-y-4'>
                      <div>
                        <h4 className='font-medium text-sm mb-1'>Ajustement Manuel</h4>
                        <p className='text-xs text-muted-foreground mb-4'>
                          Ajoutez ou retirez des crédits. Utilisez un montant négatif pour retirer.
                        </p>
                      </div>

                      <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Type</Label>
                          <Select value={adjustType} onValueChange={(v: any) => setAdjustType(v)}>
                            <SelectTrigger className='h-9'>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='base'>Base</SelectItem>
                              <SelectItem value='bonus'>Bonus</SelectItem>
                              <SelectItem value='promotional'>Promo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='space-y-1.5'>
                          <Label className='text-xs'>Montant</Label>
                          <Input
                            type='number'
                            required
                            className='h-9'
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            placeholder='Ex: 500 ou -200'
                          />
                        </div>
                      </div>

                      <div className='space-y-1.5'>
                        <Label className='text-xs'>Justification Obligatoire</Label>
                        <Textarea
                          required
                          className='min-h-[80px] text-sm resize-none'
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          placeholder='Saisissez le motif de cette opération...'
                        />
                      </div>

                      <Button type='submit' className='w-full' disabled={adjusting}>
                        {adjusting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                        Confirmer l'ajustement
                      </Button>
                    </form>
                  </div>
                </div>
              </SheetPanel>

              <SheetFooter className='px-6 py-4 border-t mt-auto'>
                <Button
                  variant={selectedUser.isBanned ? 'default' : 'destructive'}
                  className='w-full'
                  onClick={handleToggleBan}
                >
                  {selectedUser.isBanned ? (
                    <>
                      <ShieldCheck className='mr-2 h-4 w-4' /> Réactiver le compte
                    </>
                  ) : (
                    <>
                      <Ban className='mr-2 h-4 w-4' /> Bannir l'utilisateur
                    </>
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  )
}
