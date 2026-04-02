'use client'

import { memo } from 'react'
import type { SubProviderDetail } from '@/type/service'

interface SubProviderRowProps {
  subProvider: SubProviderDetail
  index: number
  onBuy: () => void
}

export const SubProviderRow = memo(function SubProviderRow({
  subProvider,
  index,
  onBuy,
}: SubProviderRowProps) {
  return (
    <div className='flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs'>
      <span className='text-muted-foreground w-20'>Provider {index + 1}</span>
      <span className='flex-1 text-right font-mono font-semibold'>
        {subProvider.priceCredits} cr
      </span>
      <span className='text-muted-foreground w-16 text-right'>{subProvider.count} avail.</span>
      <button
        onClick={onBuy}
        disabled={!subProvider.priceCredits || subProvider.count === 0}
        className='rounded-md bg-primary/90 px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
      >
        Buy
      </button>
    </div>
  )
})
