'use client'

import { memo } from 'react'

interface WalletBalanceBreakdownProps {
  loading?: boolean
  onRecharge?: () => void
}

export const WalletBalanceBreakdown = memo(function WalletBalanceBreakdown({
  loading,
  onRecharge,
}: WalletBalanceBreakdownProps) {
  if (loading) return null

  return (
    <div className='space-y-3'>
      <div className='flex items-start justify-between gap-3'>
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
