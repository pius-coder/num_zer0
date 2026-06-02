import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { convexQuery, useConvexAction, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../../convex/_generated/api'

export const purchaseKeys = {
  all: ['purchases'] as const,
  purchases: () => [...purchaseKeys.all, 'purchases'] as const,
  balance: () => ['balance'] as const,
  mouvements: () => ['mouvements'] as const,
}

export function useBalance() {
  return useQuery(convexQuery(api.users.getUserBalance, {}))
}

export function useMouvements() {
  return useQuery(convexQuery(api.comptabilite.getMyMouvements, {}))
}

export function usePurchases() {
  return useQuery(convexQuery(api.purchases.getPurchases, {}))
}

export function useValidatePromoCode(code: string) {
  return useQuery({
    ...convexQuery(api.purchases.validatePromoCode, { code }),
    enabled: code.length >= 3,
  })
}

export function useInitiateDirectPay() {
  const qc = useQueryClient()
  const actionFn = useConvexAction(api.purchases.initiateDirectPay)
  return useMutation({
    mutationFn: actionFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: purchaseKeys.all })
      qc.invalidateQueries({ queryKey: purchaseKeys.balance() })
      qc.invalidateQueries({ queryKey: purchaseKeys.mouvements() })
    },
  })
}

export function useVerifyPurchase() {
  const qc = useQueryClient()
  const actionFn = useConvexAction(api.purchases.verifyPurchase)
  return useMutation({
    mutationFn: actionFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: purchaseKeys.all })
      qc.invalidateQueries({ queryKey: purchaseKeys.balance() })
      qc.invalidateQueries({ queryKey: purchaseKeys.mouvements() })
    },
  })
}

export function useCancelPurchase() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.purchases.cancelPurchase)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: purchaseKeys.all })
      qc.invalidateQueries({ queryKey: purchaseKeys.balance() })
      qc.invalidateQueries({ queryKey: purchaseKeys.mouvements() })
    },
  })
}
