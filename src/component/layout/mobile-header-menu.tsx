'use client'

import Link from 'next/link'

interface MobileHeaderMenuProps {
  locale: string
  onSignOut: () => void
}

export function MobileHeaderMenu({ locale, onSignOut }: MobileHeaderMenuProps) {
  return (
    <>
      <Link
        href={`/${locale}/recharge`}
        className='flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.04] text-zinc-300 hover:text-white transition-colors'
      >
        <span className='text-[14px] font-semibold'>Recharge</span>
      </Link>
      <Link
        href={`/${locale}/support`}
        className='flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.04] text-zinc-300 hover:text-white transition-colors'
      >
        <span className='text-[14px] font-semibold'>Support</span>
      </Link>
      <button
        onClick={onSignOut}
        className='flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors'
      >
        <span className='text-[14px] font-semibold'>Logout</span>
      </button>
    </>
  )
}
