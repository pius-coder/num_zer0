'use client'

import { Coins } from 'lucide-react'
import { cn } from '@/common/css'
import { useBottomNav } from '@/components/layout/bottom-nav-store'

interface RechargeTriggerButtonProps {
  className?: string
  balance?: number
  packageId?: string
  notShowOnWalletPage?: boolean
}

export function RechargeTriggerButton({
  className,
  balance = 0,
  packageId,
  notShowOnWalletPage = false,
}: RechargeTriggerButtonProps) {
  const { openPanel } = useBottomNav()

  if (notShowOnWalletPage) return null

  return (
    <button
      type="button"
      onClick={() => openPanel('recharge', { packageId })}
      className={cn('flex items-center justify-center gap-2 p-2 cursor-pointer', className)}
    >
      <span className="font-figtree text-[var(--sea-ink)] text-[18px] font-thin tabular-nums tracking-tight">
        ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <div>
        <Coins className="h-4 w-4 text-[var(--sea-ink-soft)]" />
      </div>
    </button>
  )
}
