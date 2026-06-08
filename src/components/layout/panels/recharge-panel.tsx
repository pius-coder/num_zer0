'use client'

import { useCallback } from 'react'
import { useCreatePaymentIntent } from '@/components/wallet/hooks'
import { StepTopUp } from '@/components/recharge/step-topup'
import type { PaymentMethod } from '@/components/recharge/step-method'
import { authClient } from '#/lib/auth-client'

export function RechargePanel({ topUpAmount }: { topUpAmount?: number | null }) {
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
    <div className="px-5 pt-4 pb-3">
      <StepTopUp
        initialAmount={Math.max(1500, topUpAmount ?? 1500)}
        onPay={handlePay}
        isPending={createPayment.isPending}
      />
    </div>
  )
}
