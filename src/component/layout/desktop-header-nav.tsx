'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wallet } from 'lucide-react'

interface DesktopHeaderNavProps {
  locale: string
}

const NAV_ITEMS = [
  { href: '/my-space', label: 'Home', icon: Home },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
]

export function DesktopHeaderNav({ locale }: DesktopHeaderNavProps) {
  const pathname = usePathname()

  return (
    <nav className='flex items-center gap-1'>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const fullHref = `/${locale}${href}`
        const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`)

        return (
          <Link
            key={href}
            href={fullHref}
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
