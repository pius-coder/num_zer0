'use client'

import Link from 'next/link'
import { Coins } from 'lucide-react'
import { useBalance } from '@/hooks/use-credits'
import { RechargeTriggerButton } from '@/component/recharge/recharge-trigger-button'
import { LogoApp } from './logo-app'
import { DesktopHeaderNav } from './desktop-header-nav'

interface DesktopHeaderProps {
  locale: string
}

export function DesktopHeader({ locale }: DesktopHeaderProps) {
  const { data: balance } = useBalance()
  const credits = balance?.available ?? 0

  return (
    <header className='relative isolate overflow-hidden hidden h-32 shrink-0 items-center gap-32 border-b justify-between bg-background mx-auto px-6 md:flex'>
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-accent-hex)]/30 to-transparent' />
      <Link href={`/${locale}/my-space`} className='shrink-0'>
        <LogoApp className='text-6xl' />
      </Link>

      <DesktopHeaderNav locale={locale} />

      <div className='ml-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-2 py-1 text-sm font-semibold text-primary'>
        <Coins className='h-4 w-4' />
        <RechargeTriggerButton credits={credits} className='border-primary/40 p-1.5' />
      </div>
    </header>
  )
}
