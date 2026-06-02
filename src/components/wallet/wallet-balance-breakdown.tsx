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
            className='font-figtree text-[var(--sea-ink)] text-[18px] font-medium tracking-[-0.04em] leading-[1.25] cursor-pointer'
          >
            + Recharger
          </button>
        )}
      </div>
    </div>
  )
})
