import { useAdminPaymentIntents } from '../hooks'

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-500',
  processing: 'text-blue-500',
  succeeded: 'text-green-500',
  failed: 'text-red-500',
  expired: 'text-gray-500',
  cancelled: 'text-gray-500',
}

export function AdminPaymentIntents() {
  const { data: intents, isLoading } = useAdminPaymentIntents()

  if (isLoading) return <div className="text-[var(--sea-ink-soft)]">Chargement...</div>

  return (
    <div className="space-y-4">
      <p className="text-[var(--sea-ink-soft)] text-sm">
        {(intents as any)?.length ?? 0} transactions
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]/50 text-[var(--sea-ink-soft)] text-left">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">User ID</th>
              <th className="py-2 px-3">Montant</th>
              <th className="py-2 px-3">XAF</th>
              <th className="py-2 px-3">Statut</th>
              <th className="py-2 px-3">Gateway</th>
              <th className="py-2 px-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {((intents as any) ?? []).map((pi: any) => (
              <tr key={pi._id} className="border-b border-[var(--line)]/20 hover:bg-[var(--line)]/5">
                <td className="py-2 px-3 font-mono text-[11px] truncate max-w-[80px]">{pi._id}</td>
                <td className="py-2 px-3 font-mono text-[11px] truncate max-w-[100px]">{pi.userId}</td>
                <td className="py-2 px-3 tabular-nums">{(pi.amountCents / 100).toFixed(2)} USD</td>
                <td className="py-2 px-3 tabular-nums">{pi.xafAmount?.toLocaleString('fr-FR')} F</td>
                <td className={`py-2 px-3 font-semibold ${STATUS_COLORS[pi.status] ?? 'text-gray-500'}`}>
                  {pi.status}
                </td>
                <td className="py-2 px-3 font-mono text-[11px]">{pi.gatewayTransactionId ?? '-'}</td>
                <td className="py-2 px-3">{new Date(pi.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
