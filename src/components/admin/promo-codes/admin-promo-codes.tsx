import { useState } from 'react'
import {
  useAdminPromoCodes,
  useCreatePromoCode,
  useUpdatePromoCode,
  useDeletePromoCode,
} from '../hooks/use-admin-queries'
import { Badge } from '#/common/ui/badge'
import { Button } from '#/common/ui/button'
import { Input } from '#/common/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/common/ui/table'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PromoForm({ edit, onDone }: { edit?: any; onDone: () => void }) {
  const [code, setCode] = useState(edit?.code ?? '')
  const [discountPercent, setDiscountPercent] = useState(edit?.discountPercent ?? 0)
  const [discountFlat, setDiscountFlat] = useState(edit?.discountFlat ?? 0)
  const [maxUses, setMaxUses] = useState(edit?.maxUses ?? 0)
  const [expiresAt, setExpiresAt] = useState(edit?.expiresAt ? formatDate(edit.expiresAt) : '')
  const [isActive, setIsActive] = useState(edit?.isActive ?? true)

  const create = useCreatePromoCode()
  const update = useUpdatePromoCode()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (edit) {
      await update.mutateAsync({ promoId: edit._id, code, discountPercent, discountFlat, maxUses, expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined, isActive })
    } else {
      await create.mutateAsync({ code, discountPercent, discountFlat, maxUses, expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined, isActive })
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end p-4 bg-[var(--line)]/5 rounded-xl mb-4">
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Code</label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="PROMO10" className="h-8 w-28" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">%</label>
        <Input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className="h-8 w-20" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Montant</label>
        <Input type="number" value={discountFlat} onChange={(e) => setDiscountFlat(Number(e.target.value))} className="h-8 w-24" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Max</label>
        <Input type="number" value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} className="h-8 w-20" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Expire</label>
        <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-8 w-36" />
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

export function AdminPromoCodes() {
  const { data: codes, isLoading } = useAdminPromoCodes()
  const deletePromo = useDeletePromoCode()
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

  if (!codes) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
      </div>
    )
  }

  const editItem = editId ? codes.find((c: any) => c._id === editId) : null

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setShowForm(!showForm); setEditId(null) }} size="sm" className="bg-[#F97316] text-white hover:brightness-110">
          {showForm ? 'Annuler' : '+ Ajouter'}
        </Button>
      </div>

      {(showForm || editItem) && (
        <PromoForm edit={editItem} onDone={() => { setShowForm(false); setEditId(null) }} />
      )}

      {codes.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Réduction</TableHead>
              <TableHead>Actif</TableHead>
              <TableHead>Max</TableHead>
              <TableHead>Utilisé</TableHead>
              <TableHead>Expire</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((c: any) => (
              <TableRow key={c._id}>
                <TableCell className="font-figtree font-medium">{c.code}</TableCell>
                <TableCell className="font-figtree">
                  {c.discountPercent ? `${c.discountPercent}%` : ''}
                  {c.discountPercent && c.discountFlat ? ' + ' : ''}
                  {c.discountFlat ? `${c.discountFlat.toLocaleString()} XAF` : ''}
                </TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? 'success' : 'secondary'}>
                    {c.isActive ? 'Oui' : 'Non'}
                  </Badge>
                </TableCell>
                <TableCell className="font-figtree">{c.maxUses ?? '∞'}</TableCell>
                <TableCell className="font-figtree">{c.usedCount ?? 0}</TableCell>
                <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">
                  {c.expiresAt ? formatDate(c.expiresAt) : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="xs" onClick={() => { setEditId(c._id); setShowForm(true) }}>
                      Éditer
                    </Button>
                    <Button variant="destructive" size="xs" onClick={() => {
                      if (window.confirm(`Supprimer le code "${c.code}" ?`)) deletePromo.mutate({ promoId: c._id })
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
