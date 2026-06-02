'use client'

import { Wallet, RefreshCw } from 'lucide-react'
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
    <div className='space-y-3'>
      <div className='text-sm font-semibold text-foreground flex items-center gap-2 px-1'>
        <Wallet className='h-4 w-4' />
        Solde
      </div>
      <div className='p-1'>
        {showLoading ? (
          <p className='text-sm text-muted-foreground'>Chargement du solde...</p>
        ) : (
          <div className='space-y-3'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-3xl font-bold tracking-tight text-foreground'>
                  {balance?.toLocaleString('fr-FR') ?? 0}
                </p>
                <p className='text-xs text-muted-foreground'>FCFA disponibles</p>
              </div>
              <div className='flex items-center gap-2'>
                {onSync && (
                  <button
                    type='button'
                    onClick={handleSync}
                    disabled={syncing}
                    className='rounded-full p-2 transition-colors'
                    title="Synchroniser"
                  >
                    <RefreshCw className={`h-4 w-4 text-muted-foreground ${syncing ? 'animate-spin' : ''}`} />
                  </button>
                )}
                {onRecharge && (
                  <button
                    type='button'
                    onClick={onRecharge}
                    className='rounded-full px-3 py-1.5 text-sm font-medium transition-colors'
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
