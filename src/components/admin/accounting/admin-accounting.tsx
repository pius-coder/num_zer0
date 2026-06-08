import { useAdminWallets, useAdminPurchases } from '../hooks/use-admin-queries'
import { Badge } from '#/common/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/common/ui/table'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_BADGE: Record<string, 'success' | 'destructive' | 'warning' | 'default'> = {
  succeeded: 'success',
  failed: 'destructive',
  pending: 'warning',
  processing: 'warning',
  cancelled: 'default',
  expired: 'destructive',
}

const STATUS_LABELS: Record<string, string> = {
  succeeded: 'Réussi',
  failed: 'Échoué',
  pending: 'En attente',
  processing: 'En cours',
  cancelled: 'Annulé',
  expired: 'Expiré',
}

function WalletsSection() {
  const { data: wallets, isLoading } = useAdminWallets()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-[var(--line)]/20" />
        ))}
      </div>
    )
  }

  if (!wallets || wallets.length === 0) {
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
          <TableHead>Utilisateur</TableHead>
          <TableHead>Solde (cents)</TableHead>
          <TableHead>Solde (USD)</TableHead>
          <TableHead>Devise</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {wallets.map((w: any) => (
          <TableRow key={w._id}>
            <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">{w.userId}</TableCell>
            <TableCell className="font-figtree font-medium">{w.balanceCents}</TableCell>
            <TableCell className={`font-figtree font-medium ${(w.balanceCents ?? 0) >= 0 ? 'text-[#25D366]' : 'text-red-500'}`}>
              ${(w.balanceCents / 100).toFixed(2)}
            </TableCell>
            <TableCell className="font-figtree">{w.currency ?? 'USD'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PaymentsSection() {
  const { data: payments, isLoading } = useAdminPurchases()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-[var(--line)]/20" />
        ))}
      </div>
    )
  }

  if (!payments || payments.length === 0) {
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
          <TableHead>Utilisateur</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Réf. passerelle</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p: any) => (
          <TableRow key={p._id}>
            <TableCell className="font-figtree">{p._creationTime ? formatDate(p._creationTime) : '—'}</TableCell>
            <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">{p.userId}</TableCell>
            <TableCell className="font-figtree font-medium">
              ${(p.amountCents / 100).toFixed(2)} {p.xafAmount ? `/ ${p.xafAmount.toLocaleString()} XAF` : ''}
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_BADGE[p.status] ?? 'default'}>
                {STATUS_LABELS[p.status] ?? p.status}
              </Badge>
            </TableCell>
            <TableCell className="font-figtree text-[13px] text-[var(--sea-ink-soft)]">{p.gatewayTransactionId ?? '—'}</TableCell>
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
          Portefeuilles
        </h3>
        <WalletsSection />
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--line)]/50 p-5">
        <h3 className="font-figtree text-[15px] font-semibold uppercase tracking-wider text-[var(--sea-ink-soft)] mb-4">
          Paiements
        </h3>
        <PaymentsSection />
      </div>
    </div>
  )
}
