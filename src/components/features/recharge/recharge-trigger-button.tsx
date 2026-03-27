'use client'

import { PlusCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
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
        'flex items-center justify-center rounded-4xl border border-[#adfa1b] gap-2 p-2 transition-colors hover:bg-[#adfa1b]/5',
        className
      )}
    >
      <span className='ml-2 text-[#adfa1b]/80 text-[14px] font-bold tabular-nums tracking-tight'>
        {credits}
      </span>
      <PlusCircle className='text-[#adfa1b]/80 bg-background rounded-full' />
    </button>
  )
}

