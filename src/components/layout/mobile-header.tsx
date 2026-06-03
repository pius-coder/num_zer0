'use client'

import { useState } from 'react'
import { useLocation } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { getRouteTitleFromPathname } from './route-titles'
import { MobileHeaderLogo } from './mobile-header-logo'
import { MobileHeaderTitleBar } from './mobile-header-title-bar'

export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const currentTitle = getRouteTitleFromPathname(pathname)

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = '/'
        },
      },
    })
  }

  return (
    <header className="flex flex-col bg-transparent md:hidden sticky top-0 z-50">
      <MobileHeaderLogo />
      <MobileHeaderTitleBar
        title={currentTitle}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        onSignOut={handleSignOut}
      />
    </header>
  )
}
