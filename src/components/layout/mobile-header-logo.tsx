'use client'

import { Link } from '@tanstack/react-router'
import { PixelHeading } from '#/common/ui/pixel-heading'
import { ThemeSwitcher } from '#/common/ui/theme-switcher'

export function MobileHeaderLogo() {
  return (
    <div className="flex h-14 mx-7 mt-6.5 items-center justify-between bg-transparent">
      <Link to="/my-space" className="flex items-center gap-2.5">
        <PixelHeading
          as="h1"
          initialFont="line"
          hoverFont="circle"
          className="text-5xl md:text-7xl text-[#25D366] tracking-tight"
          style={{ fontFamily: 'KUBO, sans-serif' }}
        >
          N0
        </PixelHeading>
      </Link>
      <ThemeSwitcher />
    </div>
  )
}
