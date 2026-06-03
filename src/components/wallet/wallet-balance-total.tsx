'use client'

import { Loader2 } from 'lucide-react'
import { memo } from 'react'

interface WalletBalanceTotalProps {
  total: number
  loading?: boolean
}

export const WalletBalanceTotal = memo(function WalletBalanceTotal({
  total,
  loading,
}: WalletBalanceTotalProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--sea-ink-soft)]" />
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
            Chargement...
          </p>
        </div>
      ) : (
        <div>
          <p className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
            USD disponibles
          </p>
        </div>
      )}
    </div>
  )
})
