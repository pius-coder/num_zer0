'use client'

import { useEffect, useState } from 'react'
import { useBottomNav } from './bottom-nav-store'
import { RechargeDrawer } from '@/components/recharge'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export function DesktopDrawerProxy() {
  const { isOpen, activePanel, panelProps, closePanel } = useBottomNav()
  const isDesktop = useIsDesktop()

  if (!isDesktop) return null

  if (activePanel === 'recharge' || activePanel === 'topup') {
    return (
      <RechargeDrawer
        open={isOpen}
        onOpenChange={(open) => { if (!open) closePanel() }}
        topUpAmount={panelProps.amount as number | undefined}
      />
    )
  }

  return null
}
