'use client'

import Link from 'next/link'
import { Home, Smartphone, UserCircle, Wallet } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  locale: string
}

const NAV_ITEMS = [
  { segment: 'my-space', label: 'Home', icon: Home },
  { segment: 'numbers', label: 'Numbers', icon: Smartphone },
  { segment: 'wallet', label: 'Wallet', icon: Wallet },
  { segment: 'account', label: 'Account', icon: UserCircle },
] as const

export function MobileBottomNav({ locale }: MobileBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className='fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:hidden'
      aria-label='Mobile navigation'
    >
      <ul className='flex h-16 items-stretch justify-around pb-[env(safe-area-inset-bottom)]'>
        {NAV_ITEMS.map(({ segment, label, icon: Icon }) => {
          const href = `/${locale}/${segment}`
          const isActive = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <li key={segment} className='relative flex-1'>
              <Link
                href={href}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                <span className='leading-none'>{label}</span>
                {isActive && <span className='absolute top-1.5 h-1 w-1 rounded-full bg-primary' />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

