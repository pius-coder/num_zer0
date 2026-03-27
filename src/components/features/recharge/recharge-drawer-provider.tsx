'use client'

import { useMemo, useRef, useState } from 'react'

import { RechargeDrawerContext } from './use-recharge-drawer'
import { RechargeDrawer } from './recharge-drawer'

export function RechargeDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [preselectedPackageId, setPreselectedPackageId] = useState<string | null>(null)
  const seenTransactionsRef = useRef<Set<string>>(new Set())

  const value = useMemo(
    () => ({
      openRecharge: (packageId?: string) => {
        setPreselectedPackageId(packageId ?? null)
        setOpen(true)
      },
      closeRecharge: () => setOpen(false),
      hasSeenTransaction: (txId: string) => seenTransactionsRef.current.has(txId),
      markTransactionSeen: (txId: string) => {
        seenTransactionsRef.current.add(txId)
      },
    }),
    []
  )

  return (
    <RechargeDrawerContext.Provider value={value}>
      {children}
      <RechargeDrawer
        open={open}
        onOpenChange={setOpen}
        preselectedPackageId={preselectedPackageId}
      />
    </RechargeDrawerContext.Provider>
  )
}

