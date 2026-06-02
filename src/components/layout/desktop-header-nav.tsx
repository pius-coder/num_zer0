'use client'

import { Link, useLocation } from '@tanstack/react-router'
import { Home, Wallet } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/my-space', label: 'Home', icon: Home },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
]

export function DesktopHeaderNav() {
  const { pathname } = useLocation()

  return (
    <nav className='flex items-center gap-1'>
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
        const isActive = pathname === path || pathname.startsWith(path + '/')
        return (
          <Link
            key={path}
            to={path}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className='h-4 w-4' />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
