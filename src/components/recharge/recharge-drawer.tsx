'use client'

import { useCallback } from 'react'
import { useCreatePaymentIntent } from '@/components/wallet/hooks'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetPanel } from '#/common/ui/sheet'
import { StepTopUp } from './step-topup'
import type { PaymentMethod } from './step-method'
import { authClient } from '#/lib/auth-client'

interface RechargeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topUpAmount?: number | null
}

export function RechargeDrawer({ open, onOpenChange, topUpAmount }: RechargeDrawerProps) {
  const createPayment = useCreatePaymentIntent()

  const handlePay = useCallback(
    async (amountXaf: number, phone: string, method: PaymentMethod, promoCode?: string) => {
      const session = await authClient.getSession()
      if (!session?.data) {
        await authClient.signIn.anonymous()
      }
      const userId = session.data.user.id

      const data = await createPayment.mutateAsync({
        amountCents: Math.round(amountXaf / 600 * 100),
        xafAmount: amountXaf,
        idempotencyKey: `${userId}_topup_${Date.now()}`,
        metadata: { phone, paymentMethod: method, promoCode },
      })
      if (data.checkoutUrl) window.location.href = data.checkoutUrl
    },
    [createPayment],
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] max-w-none rounded-t-2xl bg-[#121212]">
        <SheetHeader>
          <SheetTitle>Recharger</SheetTitle>
          <p className="font-figtree text-white/65 text-[15px] font-semibold uppercase tracking-wider">
            Saisissez le montant à recharger
          </p>
        </SheetHeader>
        <SheetPanel className="py-4">
          <StepTopUp
            initialAmount={Math.max(1500, topUpAmount ?? 1500)}
            onPay={handlePay}
            isPending={createPayment.isPending}
          />
        </SheetPanel>
      </SheetContent>
    </Sheet>
  )
}
