'use client'

import { RefreshCw } from 'lucide-react'
import { memo, useEffect, useState } from 'react'

interface WalletBalanceCardProps {
  balance: number | null
  loading?: boolean
  onRecharge?: () => void
  onSync?: () => void
}

export const WalletBalanceCard = memo(function WalletBalanceCard({
  balance,
  loading,
  onRecharge,
  onSync,
}: WalletBalanceCardProps) {
  const [mounted, setMounted] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showLoading = !mounted || loading

  const handleSync = async () => {
    setSyncing(true)
    await onSync?.()
    setSyncing(false)
  }

  return (
    <div className="space-y-3">
      <div className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider px-1">
        Solde
      </div>
      <div className="p-1">
        {showLoading ? (
          <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
            Chargement du solde...
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-figtree text-[var(--sea-ink)] text-[30px] font-medium tracking-[-0.04em] leading-[1.25]">
                  $
                  {balance?.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) ?? '0.00'}
                </p>
                <p className="font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider">
                  USD disponibles
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onSync && (
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="p-2 cursor-pointer"
                    title="Synchroniser"
                  >
                    <RefreshCw
                      className={`h-4 w-4 text-[var(--sea-ink-soft)] ${syncing ? 'animate-spin' : ''}`}
                    />
                  </button>
                )}
                {onRecharge && (
                  <button
                    type="button"
                    onClick={onRecharge}
                    className="font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] px-3 py-1.5 cursor-pointer"
                  >
                    + Recharger
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
