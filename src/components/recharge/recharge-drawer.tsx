'use client'

import { useCallback } from 'react'
import { useInitiateDirectPay } from '@/components/purchases/hooks'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetPanel,
} from '#/common/ui/sheet'
import { StepTopUp } from './step-topup'
import type { PaymentMethod } from './step-method'
import { authClient } from '#/lib/auth-client'

interface RechargeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topUpAmount?: number | null
}

export function RechargeDrawer({ open, onOpenChange, topUpAmount }: RechargeDrawerProps) {
  const directPayMutation = useInitiateDirectPay()

  const handlePay = useCallback(
    async (amount: number, phone: string, method: PaymentMethod, promoCode?: string) => {
      const session = await authClient.getSession()
      if (!session?.data) {
        await authClient.signIn.anonymous()
      }

      const data = await directPayMutation.mutateAsync({
        amount,
        phone,
        medium: method === 'mtn_momo' ? 'MTN Mobile Money' : 'Orange Money',
        promoCode,
      })
      if (data.link) window.location.href = data.link
    },
    [directPayMutation]
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='bottom' className='h-[90vh] max-w-none rounded-t-2xl'>
        <SheetHeader>
          <SheetTitle>Recharger</SheetTitle>
          <p className='font-figtree text-[var(--sea-ink-soft)] text-[15px] font-semibold uppercase tracking-wider'>
            Saisissez le montant à recharger
          </p>
        </SheetHeader>
        <SheetPanel className='py-4'>
          <StepTopUp
            initialAmount={Math.max(1500, topUpAmount ?? 1500)}
            onPay={handlePay}
            isPending={directPayMutation.isPending}
          />
        </SheetPanel>
      </SheetContent>
    </Sheet>
  )
}
