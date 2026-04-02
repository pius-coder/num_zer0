'use client'

import { Wallet } from 'lucide-react'
import { memo, useEffect, useState } from 'react'

interface WalletBalanceCardProps {
  balance: {
    base: number
    bonus: number
    promotional: number
    available: number
  } | null
  loading?: boolean
  onRecharge?: () => void
}

export const WalletBalanceCard = memo(function WalletBalanceCard({
  balance,
  loading,
  onRecharge,
}: WalletBalanceCardProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showLoading = !mounted || loading

  return (
    <div className='space-y-3'>
      <div className='text-sm font-semibold text-foreground flex items-center gap-2 px-1'>
        <Wallet className='h-4 w-4' />
        Solde Wallet
      </div>
      <div className='p-1'>
        {showLoading ? (
          <p className='text-sm text-muted-foreground'>Chargement du solde...</p>
        ) : (
          <div className='space-y-3'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-3xl font-bold tracking-tight text-foreground'>
                  {balance?.available ?? 0}
                </p>
                <p className='text-xs text-muted-foreground'>credits disponibles</p>
              </div>
              {onRecharge && (
                <button
                  type='button'
                  onClick={onRecharge}
                  className='rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
                >
                  + Recharger
                </button>
              )}
            </div>
            <div className='grid grid-cols-3 gap-2 text-xs'>
              <div className='rounded-lg px-2 py-1.5'>
                <p className='text-muted-foreground'>Base</p>
                <p className='font-semibold text-foreground'>{balance?.base ?? 0}</p>
              </div>
              <div className='rounded-lg px-2 py-1.5'>
                <p className='text-muted-foreground'>Bonus</p>
                <p className='font-semibold text-foreground'>{balance?.bonus ?? 0}</p>
              </div>
              <div className='rounded-lg px-2 py-1.5'>
                <p className='text-muted-foreground'>Promo</p>
                <p className='font-semibold text-foreground'>{balance?.promotional ?? 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
