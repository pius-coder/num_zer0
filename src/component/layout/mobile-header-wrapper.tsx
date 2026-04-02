'use client'

import { usePathname } from 'next/navigation'
import { useBalance } from '@/hooks/use-credits'
import { MobileHeader as MobileHeaderBase } from './mobile-header'

interface MobileHeaderWrapperProps {
  locale: string
}

export function MobileHeader({ locale }: MobileHeaderWrapperProps) {
  const pathname = usePathname()
  const { data: balance } = useBalance()

  const isWallet = pathname.includes('/wallet')
  const credits = balance?.available ?? 0

  return <MobileHeaderBase locale={locale} isWallet={isWallet} credits={credits} />
}
