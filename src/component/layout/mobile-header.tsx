'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from '@/common/auth/auth-client'
import { getRouteTitleFromPathname } from './route-titles'
import { MobileHeaderLogo } from './mobile-header-logo'
import { MobileHeaderTitleBar } from './mobile-header-title-bar'

interface MobileHeaderProps {
  locale?: string
  isWallet?: boolean
  credits?: number
}

export function MobileHeader({ locale = 'fr', isWallet = false, credits = 0 }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const currentTitle = getRouteTitleFromPathname(pathname)

  const handleSignOut = () => {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = `/${locale}/login`
        },
      },
    })
  }

  return (
    <header className='flex flex-col bg-transparent md:hidden sticky top-0 z-50'>
      <MobileHeaderLogo locale={locale} isWallet={isWallet} credits={credits} />
      <MobileHeaderTitleBar
        title={currentTitle}
        locale={locale}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        onSignOut={handleSignOut}
      />
    </header>
  )
}
