'use client'

import { Link } from '@tanstack/react-router'

interface MobileHeaderMenuProps {
  onSignOut: () => void
}

export function MobileHeaderMenu({ onSignOut }: MobileHeaderMenuProps) {
  return (
    <>
      <Link
        to="/wallet"
        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.04] text-zinc-300 hover:text-white transition-colors"
      >
        <span className="text-[14px] font-semibold">Recharge</span>
      </Link>
      <Link
        to="/support"
        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.04] text-zinc-300 hover:text-white transition-colors"
      >
        <span className="text-[14px] font-semibold">Support</span>
      </Link>
      <button
        onClick={onSignOut}
        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
      >
        <span className="text-[14px] font-semibold">Logout</span>
      </button>
    </>
  )
}
