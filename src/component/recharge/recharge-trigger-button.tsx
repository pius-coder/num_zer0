'use client'

import { Coins } from 'lucide-react'
import { cn } from '@/common/css'
import { useRechargeDrawer } from './use-recharge-drawer'

interface RechargeTriggerButtonProps {
  className?: string
  credits?: number
  packageId?: string
  notShowOnWalletPage?: boolean
}

export function RechargeTriggerButton({
  className,
  credits = 0,
  packageId,
  notShowOnWalletPage = false,
}: RechargeTriggerButtonProps) {
  const { openRecharge } = useRechargeDrawer()

  if (notShowOnWalletPage) return null

  return (
    <button
      type='button'
      onClick={() => openRecharge(packageId)}
      className={cn(
        'flex items-center justify-center rounded-4xl border border-primary gap-2 p-2 transition-colors hover:bg-primary/5',
        className
      )}
    >
      <span className='ml-2 text-primary/80 text-[14px] font-bold tabular-nums tracking-tight'>
        {credits}
      </span>
      <div>
        <Coins className='h-4 w-4' />
      </div>
    </button>
  )
}
