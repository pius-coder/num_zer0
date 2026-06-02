'use client'

import { useCallback, useState, type ReactNode } from 'react'
import { RechargeDrawerContext } from './use-recharge-drawer'
import { RechargeDrawer } from './recharge-drawer'

export function RechargeDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [preselectedPackageId, setPreselectedPackageId] = useState<string | null>(null)

  const openRecharge = useCallback((packageId?: string) => {
    setPreselectedPackageId(packageId ?? null)
    setOpen(true)
  }, [])

  const closeRecharge = useCallback(() => {
    setOpen(false)
    setPreselectedPackageId(null)
  }, [])

  return (
    <RechargeDrawerContext.Provider value={{ openRecharge, closeRecharge }}>
      {children}
      <RechargeDrawer
        open={open}
        onOpenChange={setOpen}
        preselectedPackageId={preselectedPackageId}
      />
    </RechargeDrawerContext.Provider>
  )
}
