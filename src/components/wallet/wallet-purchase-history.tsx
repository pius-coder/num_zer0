'use client'

import { usePurchases } from '@/components/purchases/hooks'
import { memo } from 'react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  payment_pending: { label: 'En attente', color: 'text-amber-600' },
  confirmed: { label: 'Confirmé', color: 'text-green-600' },
  failed: { label: 'Échoué', color: 'text-red-600' },
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatXaf(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

export const WalletPurchaseHistory = memo(function WalletPurchaseHistory() {
  const { data: purchases, isLoading } = usePurchases()

  if (isLoading) return null

  const items = (purchases ?? []).filter((p: any) => p.status !== 'payment_pending')

  if (items.length === 0) return null

  return (
    <div className="space-y-3 mt-8">
      <div className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider px-1">
        Historique des recharges
      </div>

      <div className="space-y-1">
        {items.map((p: any) => {
          const status = STATUS_LABELS[p.status] ?? { label: p.status, color: 'text-gray-500' }
          return (
            <div
              key={p._id}
              className="flex items-center justify-between px-3 py-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="font-figtree text-[var(--sea-ink)] text-[15px] font-medium truncate">
                    {formatXaf(p.priceXaf)}
                  </p>
                  <p className="font-figtree text-[var(--sea-ink-soft)] text-[13px]">
                    {formatDate(p.createdAt)}
                  </p>
                </div>
              </div>
              <span className={`font-figtree text-[13px] font-semibold shrink-0 ${status.color}`}>
                {status.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
})
