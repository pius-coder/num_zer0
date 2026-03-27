import Link from 'next/link'
import { Coins, Home, Smartphone, Wallet } from 'lucide-react'

import { SearchBar } from './search-bar'
import { RechargeTriggerButton } from '@/components/features/recharge'

interface DesktopHeaderProps {
  locale: string
}

export function DesktopHeader({ locale }: DesktopHeaderProps) {
  return (
    <header className='hidden h-16 shrink-0 items-center gap-6 border-b bg-background px-6 md:flex'>
      <Link href={`/${locale}/my-space`} className='shrink-0 text-xl font-bold tracking-tight'>
        N0 NumZero
      </Link>

      <nav className='flex items-center gap-1'>
        <Link
          href={`/${locale}/my-space`}
          className='inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <Home className='h-4 w-4' />
          Home
        </Link>
        <Link
          href={`/${locale}/numbers`}
          className='inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <Smartphone className='h-4 w-4' />
          Numbers
        </Link>
        <Link
          href={`/${locale}/wallet`}
          className='inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
        >
          <Wallet className='h-4 w-4' />
          Wallet
        </Link>
      </nav>

      <SearchBar className='ml-auto w-full max-w-md' placeholder='Search service, country...' />

      <div className='inline-flex shrink-0 items-center gap-2 rounded-full bg-primary/10 px-2 py-1 text-sm font-semibold text-primary'>
        <Coins className='h-4 w-4' />
        <span>5 Credits</span>
        <RechargeTriggerButton credits={5} className='border-primary/40 p-1.5' />
      </div>
    </header>
  )
}

