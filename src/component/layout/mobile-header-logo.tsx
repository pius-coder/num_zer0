'use client'

import { Link } from 'react-router-dom'
import { PixelHeading } from '@/component/ui/pixel-heading'
import { RechargeTriggerButton } from '@/component/recharge/recharge-trigger-button'

interface MobileHeaderLogoProps {
  isWallet: boolean
  credits: number
}

/**
 * Renders the mobile header logo with a link to the user's space and a recharge control.
 *
 * @param isWallet - Whether the current page is the wallet page; when true the recharge button hides itself.
 * @param credits - Number of credits to pass to the recharge button.
 * @returns The header element containing the "NumZero" heading linked to "/my-space" and the recharge UI.
 */
export function MobileHeaderLogo({ isWallet, credits }: MobileHeaderLogoProps) {
  return (
    <div className='flex h-14 mx-7 mt-6.5 items-center justify-between bg-transparent'>
      <Link to='/my-space' className='flex items-center gap-2.5'>
        <PixelHeading
          as='h1'
          initialFont='line'
          hoverFont='circle'
          className='text-5xl md:text-7xl tracking-tight'
        >
          NumZero
        </PixelHeading>
      </Link>
      <div className='ml-auto inline-flex flex-col justify-end shrink-0 items-end gap-2 rounded-full px-2 py-1 text-sm font-semibold text-primary'>
        <RechargeTriggerButton notShowOnWalletPage={isWallet} credits={credits} />
        <p className='text-xs text-end leading-none font-thin font-cursive'>buy</p>
      </div>
    </div>
  )
}
