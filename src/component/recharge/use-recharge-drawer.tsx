'use client'

import { createContext, useContext } from 'react'

interface RechargeDrawerContextValue {
  openRecharge: (packageId?: string) => void
  closeRecharge: () => void
}

export const RechargeDrawerContext = createContext<RechargeDrawerContextValue | null>(null)

export function useRechargeDrawer() {
  const ctx = useContext(RechargeDrawerContext)
  if (!ctx) throw new Error('useRechargeDrawer must be used within RechargeDrawerProvider')
  return ctx
}
