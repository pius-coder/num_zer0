'use client'

import { Link, useLocation } from 'react-router-dom'
import { Home, Wallet } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/my-space', label: 'Home', icon: Home },
  { path: '/wallet', label: 'Wallet', icon: Wallet },
]

/**
 * Render the desktop header navigation with primary nav links and active-state styling.
 *
 * The link whose path matches the current location (or is a subpath) is styled as active.
 *
 * @returns A <nav> element containing links for the primary navigation items; the active link is visually highlighted.
 */
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
