import { useAdminActivations } from '../hooks/use-admin-queries'
import { Badge } from '#/common/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/common/ui/table'

const STATUS_VARIANTS: Record<string, 'success' | 'info' | 'destructive' | 'secondary' | 'warning'> = {
  completed: 'success',
  awaiting_sms: 'info',
  cancelled: 'destructive',
  expired: 'secondary',
  pending: 'warning',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Complété',
  awaiting_sms: 'En attente SMS',
  cancelled: 'Annulé',
  expired: 'Expiré',
  pending: 'En cours',
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AdminActivations() {
  const { data: activations, isLoading } = useAdminActivations()

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-[var(--line)]/20" />
        ))}
      </div>
    )
  }

  if (!activations || activations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-figtree text-[var(--sea-ink-soft)] text-[18px]">Aucune donnée</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Pays</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Créé le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activations.map((a: any) => (
            <TableRow key={a._id}>
              <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">{a.userId}</TableCell>
              <TableCell className="font-figtree">{a.service ?? '—'}</TableCell>
              <TableCell className="font-figtree">{a.country ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[a.status] ?? 'default'}>
                  {STATUS_LABELS[a.status] ?? a.status}
                </Badge>
              </TableCell>
              <TableCell className="font-figtree">{a.phoneNumber ?? '—'}</TableCell>
              <TableCell className="font-figtree font-medium">
                {a.priceCharged != null ? `${a.priceCharged.toLocaleString()} XAF` : '—'}
              </TableCell>
              <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">
                {a._creationTime ? formatDate(a._creationTime) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
