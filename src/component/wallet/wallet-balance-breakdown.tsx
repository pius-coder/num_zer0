'use client'

import { memo } from 'react'

interface WalletBalanceBreakdownProps {
  base: number
  bonus: number
  promotional: number
  loading?: boolean
  onRecharge?: () => void
}

export const WalletBalanceBreakdown = memo(function WalletBalanceBreakdown({
  base,
  bonus,
  promotional,
  loading,
  onRecharge,
}: WalletBalanceBreakdownProps) {
  if (loading) return null

  return (
    <div className='space-y-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='grid grid-cols-3 gap-2 text-xs'>
          <div className='rounded-lg px-2 py-1.5'>
            <p className='text-muted-foreground'>Base</p>
            <p className='font-semibold text-foreground'>{base}</p>
          </div>
          <div className='rounded-lg px-2 py-1.5'>
            <p className='text-muted-foreground'>Bonus</p>
            <p className='font-semibold text-foreground'>{bonus}</p>
          </div>
          <div className='rounded-lg px-2 py-1.5'>
            <p className='text-muted-foreground'>Promo</p>
            <p className='font-semibold text-foreground'>{promotional}</p>
          </div>
        </div>
        {onRecharge && (
          <button
            type='button'
            onClick={onRecharge}
            className='shrink-0 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
          >
            + Recharger
          </button>
        )}
      </div>
    </div>
  )
})
