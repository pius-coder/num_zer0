'use client'

import { PixelHeading } from '@/component/ui/pixel-heading'
import { RechargeTriggerButton } from '@/component/recharge/recharge-trigger-button'
import Link from 'next/link'

interface MobileHeaderLogoProps {
  locale: string
  isWallet: boolean
  credits: number
}

export function MobileHeaderLogo({ locale, isWallet, credits }: MobileHeaderLogoProps) {
  return (
    <div className='flex h-14 mx-7 mt-6.5 items-center justify-between bg-transparent'>
      <Link href={`/${locale}/my-space`} className='flex items-center gap-2.5'>
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
