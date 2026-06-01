'use client'

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { signOut } from '@/common/auth/auth-client'
import { getRouteTitleFromPathname } from './route-titles'
import { MobileHeaderLogo } from './mobile-header-logo'
import { MobileHeaderTitleBar } from './mobile-header-title-bar'

interface MobileHeaderProps {
  isWallet?: boolean
  credits?: number
}

export function MobileHeader({ isWallet = false, credits = 0 }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const currentTitle = getRouteTitleFromPathname(pathname)

  const handleSignOut = () => {
    signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = `/${pathname.split('/')[1]}/login`
        },
      },
    })
  }

  return (
    <header className='flex flex-col bg-transparent md:hidden sticky top-0 z-50'>
      <MobileHeaderLogo isWallet={isWallet} credits={credits} />
      <MobileHeaderTitleBar
        title={currentTitle}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        onSignOut={handleSignOut}
      />
    </header>
  )
}
