import { useAdminComptes, useAdminPieces } from '../hooks/use-admin-queries'
import { Badge } from '#/common/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/common/ui/table'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ComptesSection() {
  const { data: comptes, isLoading } = useAdminComptes()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-[var(--line)]/20" />
        ))}
      </div>
    )
  }

  if (!comptes || comptes.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Libellé</TableHead>
          <TableHead>Solde</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {comptes.map((c: any) => (
          <TableRow key={c._id}>
            <TableCell className="font-figtree font-medium">{c.code ?? '—'}</TableCell>
            <TableCell className="font-figtree">{c.libelle ?? '—'}</TableCell>
            <TableCell className={`font-figtree font-medium ${(c.solde ?? 0) >= 0 ? 'text-[#25D366]' : 'text-red-500'}`}>
              {c.solde != null ? `${c.solde.toLocaleString()} XAF` : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PiecesSection() {
  const { data: pieces, isLoading } = useAdminPieces()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-[var(--line)]/20" />
        ))}
      </div>
    )
  }

  if (!pieces || pieces.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Libellé</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Référence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pieces.map((p: any) => (
          <TableRow key={p._id}>
            <TableCell className="font-figtree">{p.date ? formatDate(p.date) : '—'}</TableCell>
            <TableCell className="font-figtree">{p.libelle ?? '—'}</TableCell>
            <TableCell>
              <Badge variant={p.statut === 'validé' ? 'success' : p.statut === 'rejeté' ? 'destructive' : 'warning'}>
                {p.statut ?? '—'}
              </Badge>
            </TableCell>
            <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">{p.reference ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function AdminAccounting() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
        <h3 className="font-figtree text-[15px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)] mb-4">
          Comptes
        </h3>
        <ComptesSection />
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
        <h3 className="font-figtree text-[15px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)] mb-4">
          Écritures
        </h3>
        <PiecesSection />
      </div>
    </div>
  )
}
