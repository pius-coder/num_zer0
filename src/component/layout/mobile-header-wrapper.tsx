'use client'

import { useLocation } from 'react-router-dom'
import { useBalance } from '@/hooks/use-credits'
import { MobileHeader as MobileHeaderBase } from './mobile-header'

/**
 * Renders a mobile header configured from the current route and the user's credits balance.
 *
 * The header receives `isWallet` set to `true` when the current pathname includes "/wallet", and `credits` taken from the balance's `available` value (defaults to `0` when unavailable).
 *
 * @returns A React element of `MobileHeaderBase` configured with `isWallet` and `credits`.
 */
export function MobileHeader() {
  const { pathname } = useLocation()
  const { data: balance } = useBalance()

  const isWallet = pathname.includes('/wallet')
  const credits = balance?.available ?? 0

  return <MobileHeaderBase isWallet={isWallet} credits={credits} />
}
