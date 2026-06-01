'use client'

import { Link, useLocation } from 'react-router-dom'
import { Home, Wallet, UserCircle } from 'lucide-react'
import { cn } from '@/common/css'

const NAV_ITEMS = [
  { path: '/my-space', label: 'Home', icon: Home },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
  { path: '/account', label: 'Account', icon: UserCircle },
] as const

export function MobileBottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className='fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:hidden'>
      <ul className='flex h-16 items-stretch justify-around pb-[env(safe-area-inset-bottom)]'>
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = pathname === path || pathname.startsWith(path + '/')

          return (
            <li key={path} className='relative flex-1'>
              <Link
                to={path}
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
