'use client'

import { Link } from 'react-router-dom'

interface MobileHeaderMenuProps {
  onSignOut: () => void
}

/**
 * Render a mobile header menu with navigation links and a logout button.
 *
 * @param onSignOut - Callback invoked when the "Logout" button is clicked
 * @returns A JSX fragment containing links to `/recharge` and `/support` and a "Logout" button that triggers `onSignOut`
 */
export function MobileHeaderMenu({ onSignOut }: MobileHeaderMenuProps) {
  return (
    <>
      <Link
        to='/recharge'
        className='flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/[0.04] text-zinc-300 hover:text-white transition-colors'
      >
        <span className='text-[14px] font-semibold'>Recharge</span>
      </Link>
      <Link
        to='/support'
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
