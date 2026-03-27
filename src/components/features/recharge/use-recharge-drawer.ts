'use client'

import { createContext, useContext } from 'react'

type RechargeDrawerContextValue = {
  openRecharge: (preselectedPackageId?: string) => void
  closeRecharge: () => void
  hasSeenTransaction: (txId: string) => boolean
  markTransactionSeen: (txId: string) => void
}

export const RechargeDrawerContext = createContext<RechargeDrawerContextValue | null>(null)

export const useRechargeDrawer = () => {
  const value = useContext(RechargeDrawerContext)
  if (!value) {
    throw new Error('useRechargeDrawer must be used inside RechargeDrawerProvider')
  }
  return value
}

