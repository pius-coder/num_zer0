import { useState } from 'react'
import {
  useAdminMargins,
  useCreateMargin,
  useUpdateMargin,
  useDeleteMargin,
} from '../hooks/use-admin-queries'
import { Button } from '#/common/ui/button'
import { Input } from '#/common/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/common/ui/table'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function MarginForm({ edit, onDone }: { edit?: any; onDone: () => void }) {
  const [countryIso, setCountryIso] = useState(edit?.countryIso ?? '')
  const [serviceId, setServiceId] = useState(edit?.serviceId ?? '')
  const [marginXaf, setMarginXaf] = useState(edit?.marginXaf ?? 0)

  const create = useCreateMargin()
  const update = useUpdateMargin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (edit) {
      await update.mutateAsync({ marginId: edit._id, countryIso, serviceId, marginXaf })
    } else {
      await create.mutateAsync({ countryIso, serviceId, marginXaf })
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end p-4 bg-[var(--line)]/5 rounded-xl mb-4">
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Pays ISO</label>
        <Input value={countryIso} onChange={(e) => setCountryIso(e.target.value)} required placeholder="CM" className="h-8 w-24" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Service ID</label>
        <Input value={serviceId} onChange={(e) => setServiceId(e.target.value)} required placeholder="sms_otp" className="h-8 w-32" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="font-figtree text-[12px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)]">Marge XAF</label>
        <Input type="number" value={marginXaf} onChange={(e) => setMarginXaf(Number(e.target.value))} required className="h-8 w-28" />
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

export function AdminMargins() {
  const { data: margins, isLoading } = useAdminMargins()
  const deleteMargin = useDeleteMargin()
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

  if (!margins) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
      </div>
    )
  }

  const editItem = editId ? margins.find((m: any) => m._id === editId) : null

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setShowForm(!showForm); setEditId(null) }} size="sm" className="bg-[#F97316] text-white hover:brightness-110">
          {showForm ? 'Annuler' : '+ Ajouter'}
        </Button>
      </div>

      {(showForm || editItem) && (
        <MarginForm edit={editItem} onDone={() => { setShowForm(false); setEditId(null) }} />
      )}

      {margins.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pays ISO</TableHead>
              <TableHead>Service ID</TableHead>
              <TableHead>Marge XAF</TableHead>
              <TableHead>Mis à jour par</TableHead>
              <TableHead>Mis à jour le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {margins.map((m: any) => (
              <TableRow key={m._id}>
                <TableCell className="font-figtree font-medium">{m.countryIso}</TableCell>
                <TableCell className="font-figtree">{m.serviceId}</TableCell>
                <TableCell className="font-figtree font-medium">{m.marginXaf?.toLocaleString()} XAF</TableCell>
                <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">{m.updatedBy ?? '—'}</TableCell>
                <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">
                  {m.updatedAt ? formatDate(m.updatedAt) : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="xs" onClick={() => { setEditId(m._id); setShowForm(true) }}>
                      Éditer
                    </Button>
                    <Button variant="destructive" size="xs" onClick={() => {
                      if (window.confirm(`Supprimer la marge "${m.countryIso}/${m.serviceId}" ?`)) deleteMargin.mutate({ marginId: m._id })
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
