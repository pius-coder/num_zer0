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

/**
 * Render the mobile header containing the logo and title bar for small screens.
 *
 * The header derives its title from the current React Router pathname, manages a local
 * menu open state, and triggers sign-out which redirects the browser to "/{locale}/login"
 * where `{locale}` is the first segment of the current pathname.
 *
 * @param isWallet - When true, render wallet-specific logo state
 * @param credits - Numeric credit value to display in the logo area
 * @returns The JSX element for the mobile header (visible on screens below `md`)
 */
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
