'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAdminPackages } from '@/hooks/use-admin'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Loader2, Play, Pause, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createCreditPackage,
  updateCreditPackage,
  deleteCreditPackage,
} from '@/app/actions/admin-actions'

interface CreditPackage {
  id: string
  slug: string
  nameFr: string
  nameEn: string
  credits: number
  priceXaf: number
  bonusPct: number
  label: string | null
  sortOrder: number
  isActive: boolean
}

export default function AdminCreditsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading: loading, error: queryError } = useAdminPackages()
  const packages = (data?.packages ?? []) as CreditPackage[]
  const error = queryError ? (queryError as Error).message : null

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingPkg, setEditingPkg] = useState<CreditPackage | null>(null)
  const [formData, setFormData] = useState<Partial<CreditPackage>>({})

  const handleOpenCreate = () => {
    setEditingPkg(null)
    setFormData({
      slug: '',
      nameFr: '',
      nameEn: '',
      credits: 100,
      priceXaf: 1000,
      bonusPct: 0,
      label: null,
      sortOrder: 0,
      isActive: true,
    })
    setSheetOpen(true)
  }

  const handleOpenEdit = (pkg: CreditPackage) => {
    setEditingPkg(pkg)
    setFormData(pkg)
    setSheetOpen(true)
  }

  const handleToggleActive = async () => {
    if (!editingPkg) return
    try {
      await updateCreditPackage(editingPkg.id, { isActive: !editingPkg.isActive })
      toast.success(`Forfait ${!editingPkg.isActive ? 'activé' : 'désactivé'} avec succès`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] })
      setSheetOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleDelete = async () => {
    if (!editingPkg) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce forfait ?')) return
    try {
      await deleteCreditPackage(editingPkg.id)
      toast.success('Forfait supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] })
      setSheetOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingPkg) {
        await updateCreditPackage(editingPkg.id, formData)
        toast.success('Forfait mis à jour avec succès')
      } else {
        await createCreditPackage(formData)
        toast.success('Forfait créé avec succès')
      }
      setSheetOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPageShell
      title='Credits'
      subtitle='Manage credit packages and monitor credit health.'
      actions={
        <Button onClick={handleOpenCreate}>
          <Plus className='mr-2 h-4 w-4' />
          Nouveau forfait
        </Button>
      }
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
              <TableHead>Forfait</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className='text-right'>Crédits</TableHead>
              <TableHead className='text-right'>Prix XAF</TableHead>
              <TableHead className='text-right'>Bonus %</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Actif</TableHead>
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
            ) : packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-24 text-center text-muted-foreground'>
                  Aucun forfait configuré.
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow
                  key={pkg.id}
                  onClick={() => handleOpenEdit(pkg)}
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                >
                  <TableCell className='font-medium'>{pkg.nameFr}</TableCell>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    {pkg.slug}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {pkg.credits.toLocaleString()}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {pkg.priceXaf.toLocaleString()}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>{pkg.bonusPct}%</TableCell>
                  <TableCell>
                    {pkg.label ? (
                      <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
                        {pkg.label.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        pkg.isActive ? 'bg-green-500' : 'bg-muted-foreground/30'
                      }`}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='flex flex-col gap-0 p-0 sm:max-w-md w-full'>
          <SheetHeader className='px-6 py-6 border-b'>
            <SheetTitle>{editingPkg ? 'Modifier le forfait' : 'Nouveau forfait'}</SheetTitle>
            <SheetDescription>Configurez les détails du forfait de crédits.</SheetDescription>
          </SheetHeader>

          <SheetPanel className='flex-1 p-6'>
            <form id='pkg-form' onSubmit={handleSubmit} className='space-y-6'>
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Nom (Français)</Label>
                    <Input
                      required
                      value={formData.nameFr || ''}
                      onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Nom (Anglais)</Label>
                    <Input
                      required
                      value={formData.nameEn || ''}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Slug (identifiant unique)</Label>
                  <Input
                    required
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Crédits de base</Label>
                    <Input
                      type='number'
                      required
                      value={formData.credits || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, credits: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Prix (XAF)</Label>
                    <Input
                      type='number'
                      required
                      value={formData.priceXaf || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, priceXaf: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Bonus (%)</Label>
                    <Input
                      type='number'
                      required
                      value={formData.bonusPct || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, bonusPct: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Ordre d'affichage</Label>
                    <Input
                      type='number'
                      required
                      value={formData.sortOrder || 0}
                      onChange={(e) =>
                        setFormData({ ...formData, sortOrder: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Label (ex: BEST_VALUE)</Label>
                  <Input
                    value={formData.label || ''}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value || null })}
                  />
                </div>
              </div>
            </form>
          </SheetPanel>

          <SheetFooter className='px-6 py-4 border-t mt-auto flex-row justify-between'>
            {editingPkg ? (
              <div className='flex gap-2'>
                <Button type='button' variant='outline' size='icon' onClick={handleToggleActive}>
                  {editingPkg.isActive ? (
                    <Pause className='h-4 w-4' />
                  ) : (
                    <Play className='h-4 w-4' />
                  )}
                </Button>
                <Button type='button' variant='destructive' size='icon' onClick={handleDelete}>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <div />
            )}

            <div className='flex gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setSheetOpen(false)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type='submit' form='pkg-form' disabled={saving}>
                {saving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {editingPkg ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  )
}
