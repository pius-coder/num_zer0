import { useAdminPurchases } from '../hooks/use-admin-queries'
import { Badge } from '#/common/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/common/ui/table'

const STATUS_VARIANTS: Record<string, 'success' | 'destructive' | 'warning' | 'default'> = {
  confirmed: 'success',
  failed: 'destructive',
  payment_pending: 'warning',
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmé',
  failed: 'Échoué',
  payment_pending: 'En attente',
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AdminPurchases() {
  const { data: purchases, isLoading } = useAdminPurchases()

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-[var(--line)]/20" />
        ))}
      </div>
    )
  }

  if (!purchases || purchases.length === 0) {
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
            <TableHead>Prix XAF</TableHead>
            <TableHead>Méthode</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Code Promo</TableHead>
            <TableHead>Créé le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((p: any) => (
            <TableRow key={p._id}>
              <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">{p.userId}</TableCell>
              <TableCell className="font-figtree font-medium">{p.priceXaf?.toLocaleString()} XAF</TableCell>
              <TableCell className="font-figtree">{p.paymentMethod ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[p.status] ?? 'default'}>
                  {STATUS_LABELS[p.status] ?? p.status}
                </Badge>
              </TableCell>
              <TableCell className="font-figtree">{p.promoCode ?? '—'}</TableCell>
              <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">
                {p._creationTime ? formatDate(p._creationTime) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
