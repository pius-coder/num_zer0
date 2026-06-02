import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../../convex/_generated/api'

export const purchaseKeys = {
  all: ['purchases'] as const,
  packages: () => [...purchaseKeys.all, 'packages'] as const,
  purchases: () => [...purchaseKeys.all, 'purchases'] as const,
}

export function usePackages() {
  return useQuery({
    ...convexQuery(api.purchases.getPackages, {}),
    select: (data) => data.map((p) => ({ ...p, id: p._id })),
  })
}

export function usePurchases() {
  return useQuery(convexQuery(api.purchases.getPurchases, {}))
}

export function useCreatePurchase() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.purchases.createPurchase)
    .withOptimisticUpdate((localStore, args) => {
      const existing = localStore.getQuery(api.purchases.getPurchases, {})
      if (!existing) return
      localStore.setQuery(api.purchases.getPurchases, {}, [
        {
          _id: `temp_${Date.now()}` as any,
          _creationTime: Date.now(),
          userId: '',
          packageId: args.packageId,
          priceXaf: 0,
          paymentMethod: args.paymentMethod,
          status: 'payment_pending',
          idempotencyKey: args.idempotencyKey,
          createdAt: Date.now(),
        },
        ...existing,
      ])
    })
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export function useVerifyPurchase() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.purchases.verifyPurchase)
    .withOptimisticUpdate((localStore, args) => {
      const existing = localStore.getQuery(api.purchases.getPurchases, {})
      if (!existing) return
      localStore.setQuery(api.purchases.getPurchases, {}, existing.map((p: any) =>
        p.paymentGatewayId === args.transId
          ? { ...p, status: 'confirmed' }
          : p,
      ))
    })
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export function useCancelPurchase() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.purchases.cancelPurchase)
    .withOptimisticUpdate((localStore, args) => {
      const existing = localStore.getQuery(api.purchases.getPurchases, {})
      if (!existing) return
      localStore.setQuery(api.purchases.getPurchases, {}, existing.map((p: any) =>
        p._id === args.purchaseId
          ? { ...p, status: 'failed' }
          : p,
      ))
    })
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}
