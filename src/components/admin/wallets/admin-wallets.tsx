import { useAdminWallets } from '../hooks'

export function AdminWallets() {
  const { data: wallets, isLoading } = useAdminWallets()

  if (isLoading) return <div className="text-[var(--sea-ink-soft)]">Chargement...</div>

  return (
    <div className="space-y-4">
      <p className="text-[var(--sea-ink-soft)] text-sm">
        {wallets?.length ?? 0} portefeuilles
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]/50 text-[var(--sea-ink-soft)] text-left">
              <th className="py-2 px-3">User ID</th>
              <th className="py-2 px-3 text-right">Solde (cents)</th>
              <th className="py-2 px-3 text-right">Solde (USD)</th>
              <th className="py-2 px-3">Devise</th>
              <th className="py-2 px-3">Créé</th>
            </tr>
          </thead>
          <tbody>
            {(wallets ?? []).map((w: any) => (
              <tr key={w._id} className="border-b border-[var(--line)]/20 hover:bg-[var(--line)]/5">
                <td className="py-2 px-3 font-mono text-[11px] truncate max-w-[120px]">{w.userId}</td>
                <td className="py-2 px-3 text-right tabular-nums">{w.balanceCents}</td>
                <td className="py-2 px-3 text-right tabular-nums">${(w.balanceCents / 100).toFixed(2)}</td>
                <td className="py-2 px-3">{w.currency}</td>
                <td className="py-2 px-3">{new Date(w.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
