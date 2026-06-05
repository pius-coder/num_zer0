'use client'

import { useCallback } from 'react'
import { useInitiateDirectPay } from '@/components/purchases/hooks'
import { StepTopUp } from '@/components/recharge/step-topup'
import type { PaymentMethod } from '@/components/recharge/step-method'
import { authClient } from '#/lib/auth-client'

export function RechargePanel({ topUpAmount }: { topUpAmount?: number | null }) {
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
    [directPayMutation],
  )

  return (
    <div className="px-5 pt-4 pb-3">
      <StepTopUp
        initialAmount={Math.max(1500, topUpAmount ?? 1500)}
        onPay={handlePay}
        isPending={directPayMutation.isPending}
      />
    </div>
  )
}
