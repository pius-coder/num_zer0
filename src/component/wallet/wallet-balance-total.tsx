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
    <div className='flex items-start justify-between gap-3'>
      {loading ? (
        <div className='flex items-center gap-2'>
          <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
          <p className='text-sm text-muted-foreground'>Chargement...</p>
        </div>
      ) : (
        <div>
          <p className='text-3xl font-bold tracking-tight text-foreground'>{total}</p>
          <p className='text-xs text-muted-foreground'>credits disponibles</p>
        </div>
      )}
    </div>
  )
})
