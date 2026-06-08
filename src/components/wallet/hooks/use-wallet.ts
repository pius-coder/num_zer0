import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { convexQuery, useConvexAction } from '@convex-dev/react-query'
import { api } from '../../../../convex/_generated/api'

export const walletKeys = {
  all: ['wallet'] as const,
  balance: () => [...walletKeys.all, 'balance'] as const,
  transactions: () => [...walletKeys.all, 'transactions'] as const,
  orders: () => [...walletKeys.all, 'orders'] as const,
}

export function useWalletBalance() {
  return useQuery(convexQuery(api.wallet.getBalance, {}))
}

export function useWalletLedger(numItems?: number) {
  return useQuery(convexQuery(api.wallet.getLedger, { numItems }))
}

export function useOrders() {
  return useQuery(convexQuery(api.orders.getUserOrders, {}))
}

export function useXafUsdRate() {
  return useQuery(convexQuery(api.rates.getXafUsdRate, {}))
}

export function useCreatePaymentIntent() {
  const qc = useQueryClient()
  const actionFn = useConvexAction(api.payment_intents.initiatePayment)
  return useMutation({
    mutationFn: actionFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: walletKeys.all })
    },
  })
}

export function useVerifyPaymentIntent() {
  const qc = useQueryClient()
  const actionFn = useConvexAction(api.payment_intents.verifyPaymentIntent)
  return useMutation({
    mutationFn: actionFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: walletKeys.balance() })
      qc.invalidateQueries({ queryKey: walletKeys.transactions() })
    },
  })
}
