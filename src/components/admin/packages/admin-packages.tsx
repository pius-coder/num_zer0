import { useState } from 'react'
import {
  useAdminPackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
} from '../hooks/use-admin-queries'
import { Badge } from '#/common/ui/badge'
import { Button } from '#/common/ui/button'
import { Input } from '#/common/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/common/ui/table'

function PackageForm({ edit, onDone }: { edit?: any; onDone: () => void }) {
  const [slug, setSlug] = useState(edit?.slug ?? '')
  const [name, setName] = useState(edit?.name ?? '')
  const [priceXaf, setPriceXaf] = useState(edit?.priceXaf ?? 0)
  const [description, setDescription] = useState(edit?.description ?? '')
  const [isActive, setIsActive] = useState(edit?.isActive ?? true)

  const create = useCreatePackage()
  const update = useUpdatePackage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (edit) {
      await update.mutateAsync({ packageId: edit._id, slug, name, priceXaf, description, isActive })
    } else {
      await create.mutateAsync({ slug, name, priceXaf, description, isActive })
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end p-4 bg-[var(--line)]/5 rounded-xl mb-4">
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Slug</label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} required placeholder="basic" className="h-8 w-28" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Nom</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Pack Basic" className="h-8 w-36" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Prix XAF</label>
        <Input type="number" value={priceXaf} onChange={(e) => setPriceXaf(Number(e.target.value))} required className="h-8 w-28" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." className="h-8 w-48" />
      </div>
      <div className="flex items-center gap-2 pb-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Actif</label>
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[#25D366]" />
      </div>
      <div className="flex gap-2 pb-1">
        <Button type="submit" size="sm" className="bg-[#25D366] text-white hover:brightness-110">
          {edit ? 'Mettre à jour' : 'Créer'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Annuler</Button>
      </div>
    </form>
  )
}

export function AdminPackages() {
  const { data: packages, isLoading } = useAdminPackages()
  const deletePackage = useDeletePackage()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-[var(--line)]/20" />
        ))}
      </div>
    )
  }

  if (!packages) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
      </div>
    )
  }

  const editItem = editId ? packages.find((p: any) => p._id === editId) : null

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setShowForm(!showForm); setEditId(null) }} size="sm" className="bg-[#F97316] text-white hover:brightness-110">
          {showForm ? 'Annuler' : '+ Ajouter'}
        </Button>
      </div>

      {(showForm || editItem) && (
        <PackageForm edit={editItem} onDone={() => { setShowForm(false); setEditId(null) }} />
      )}

      {packages.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prix XAF</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((p: any) => (
              <TableRow key={p._id}>
                <TableCell className="font-figtree font-medium">{p.slug}</TableCell>
                <TableCell className="font-figtree">{p.name}</TableCell>
                <TableCell className="font-figtree font-medium">{p.priceXaf?.toLocaleString()} XAF</TableCell>
                <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)] max-w-[200px] truncate">
                  {p.description ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={p.isActive ? 'success' : 'secondary'}>
                    {p.isActive ? 'Oui' : 'Non'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="xs" onClick={() => { setEditId(p._id); setShowForm(true) }}>
                      Éditer
                    </Button>
                    <Button variant="destructive" size="xs" onClick={() => {
                      if (window.confirm(`Supprimer le package "${p.name}" ?`)) deletePackage.mutate({ packageId: p._id })
                    }}>
                      Suppr.
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
