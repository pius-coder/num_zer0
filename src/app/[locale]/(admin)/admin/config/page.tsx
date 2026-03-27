'use client'

import { useMemo, useState } from 'react'
import { Save, Settings2, FileText, Database } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminConfig, useAdminUpdateConfig } from '@/hooks/use-admin'

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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetPanel,
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface ConfigEntry {
  key: string
  value: string
  valueType: string
  category: string
  descriptionFr: string | null
  descriptionEn: string | null
}

export default function AdminConfigPage() {
  const { data, isLoading: loading, error: queryError } = useAdminConfig()
  const settings = (data?.settings ?? []) as ConfigEntry[]
  const error = queryError ? (queryError as Error).message : null
  const updateMutation = useAdminUpdateConfig()

  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Sheet State
  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editValue, setEditValue] = useState('')

  const selectedEntry = useMemo(() => {
    return settings.find((s) => s.key === selectedEntryKey) ?? null
  }, [settings, selectedEntryKey])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEntry) return

    try {
      await updateMutation.mutateAsync({ key: selectedEntry.key, value: editValue })
      toast.success('Paramètre mis à jour')
      setSheetOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const openSheet = (entry: ConfigEntry) => {
    setSelectedEntryKey(entry.key)
    setEditValue(entry.value)
    setSheetOpen(true)
  }

  const categories = ['all', ...Array.from(new Set(settings.map((s) => s.category)))]
  const filtered =
    filterCategory === 'all' ? settings : settings.filter((s) => s.category === filterCategory)

  return (
    <AdminPageShell
      title='Platform Config'
      subtitle='DB-driven economics settings — editable key-value pairs.'
    >
      {error && (
        <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          {error}
        </div>
      )}

      <div className='flex flex-wrap gap-1'>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className='rounded-xl border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clé</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <div className='h-4 w-20 animate-pulse rounded bg-muted' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                  Aucun paramètre.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => (
                <TableRow
                  key={entry.key}
                  onClick={() => openSheet(entry)}
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                >
                  <TableCell className='font-mono text-xs'>{entry.key}</TableCell>
                  <TableCell>
                    <span className='rounded-full bg-muted px-2 py-0.5 text-xs'>
                      {entry.category}
                    </span>
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>{entry.valueType}</TableCell>
                  <TableCell>
                    <span className='rounded px-1.5 py-0.5 font-mono text-xs bg-muted/50 border'>
                      {entry.value}
                    </span>
                  </TableCell>
                  <TableCell className='max-w-[200px] truncate text-xs text-muted-foreground'>
                    {entry.descriptionFr ?? entry.descriptionEn ?? '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='flex flex-col gap-0 p-0 sm:max-w-md w-full'>
          {selectedEntry && (
            <>
              <SheetHeader className='px-6 py-6 border-b'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center justify-center rounded-xl bg-primary/10 p-3'>
                    <Settings2 className='h-6 w-6 text-primary' />
                  </div>
                  <div className='flex-1'>
                    <SheetTitle className='text-xl'>Paramètre Système</SheetTitle>
                    <SheetDescription className='flex items-center gap-1.5 mt-1'>
                      <span className='font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground'>
                        {selectedEntry.key}
                      </span>
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <SheetPanel className='flex-1 p-6 flex flex-col gap-8'>
                <div className='flex flex-col gap-4'>
                  <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                    Métadonnées
                  </h3>
                  <div className='grid gap-3 text-sm'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Database className='h-4 w-4' /> Catégorie
                      </div>
                      <span className='font-medium bg-muted px-2 py-0.5 rounded-full text-xs'>
                        {selectedEntry.category}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        Type de valeur
                      </div>
                      <span className='font-mono text-xs text-muted-foreground'>
                        {selectedEntry.valueType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='flex flex-col gap-3'>
                  <h3 className='text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2'>
                    <FileText className='h-4 w-4' /> Description
                  </h3>
                  <p className='text-sm border-l-2 border-primary/20 pl-3 py-1 text-muted-foreground'>
                    {selectedEntry.descriptionFr ??
                      selectedEntry.descriptionEn ??
                      'Aucune description disponible pour ce paramètre.'}
                  </p>
                </div>

                <Separator />

                <div className='flex flex-col gap-4 mt-2'>
                  <form id='config-form' onSubmit={handleSave} className='space-y-4'>
                    <div className='space-y-2'>
                      <Label className='text-sm font-medium'>Modifier la valeur</Label>
                      <Input
                        className='font-mono'
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <p className='text-xs text-muted-foreground'>
                        Assurez-vous que la nouvelle valeur correspond au type (
                        {selectedEntry.valueType}).
                      </p>
                    </div>
                  </form>
                </div>
              </SheetPanel>

              <SheetFooter className='px-6 py-4 border-t mt-auto flex-row justify-end'>
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setSheetOpen(false)}
                    disabled={updateMutation.isPending}
                  >
                    Annuler
                  </Button>
                  <Button type='submit' form='config-form' disabled={updateMutation.isPending}>
                    <Save className='mr-2 h-4 w-4' />
                    Enregistrer les modifications
                  </Button>
                </div>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminPageShell>
  )
}
