'use client'

import { Link } from '@tanstack/react-router'
import { Coins } from 'lucide-react'
import { ThemeSwitcher } from '#/common/ui/theme-switcher'
import { RechargeTriggerButton } from '@/components/recharge/recharge-trigger-button'
import { LogoApp } from './logo-app'
import { DesktopHeaderNav } from './desktop-header-nav'
import { useBalance } from '@/components/purchases/hooks'

export function DesktopHeader() {
  const { data: balanceData } = useBalance()
  const balanceUsd = balanceData?.balanceUsd ?? 0
  return (
    <header className='relative isolate overflow-hidden hidden h-32 shrink-0 items-center gap-32 border-b justify-between bg-background mx-auto px-6 md:flex'>
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent-hex)]/30 to-transparent' />
      <Link to='/my-space' className='shrink-0'>
        <LogoApp className='text-6xl' />
      </Link>

      <DesktopHeaderNav />

      <div className='ml-auto inline-flex shrink-0 items-center gap-2'>
        <ThemeSwitcher />
      </div>
      <div className='inline-flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-2 py-1 text-sm font-semibold text-primary'>
        <Coins className='h-4 w-4' />
        <RechargeTriggerButton balance={balanceUsd} className='border-primary/40 p-1.5' />
      </div>
    </header>
  )
}
