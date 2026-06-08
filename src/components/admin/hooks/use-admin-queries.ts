import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

export const adminKeys = {
  all: ['admin'] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  purchases: () => [...adminKeys.all, 'purchases'] as const,
  activations: () => [...adminKeys.all, 'activations'] as const,
  accounting: () => [...adminKeys.all, 'accounting'] as const,
  promo_codes: () => [...adminKeys.all, 'promo_codes'] as const,
  margins: () => [...adminKeys.all, 'margins'] as const,
  packages: () => [...adminKeys.all, 'packages'] as const,
  wallets: () => [...adminKeys.all, 'wallets'] as const,
  payment_intents: () => [...adminKeys.all, 'payment_intents'] as const,
  ledger: () => [...adminKeys.all, 'ledger'] as const,
  orders: () => [...adminKeys.all, 'orders'] as const,
}

export function useAdminAnalytics() {
  return useQuery(convexQuery(api.analytics.getAnalyticsSummary, {}))
}

export function useAdminUsers() {
  return useQuery(convexQuery(api.users.getAllUsers, {}))
}

export function useAdminPurchases() {
  return useQuery(convexQuery(api.purchases.getAllPurchases, {}))
}

export function useAdminActivations() {
  return useQuery(convexQuery(api.sms_provider.getAllActivations, {}))
}

export function useAdminComptes() {
  return useQuery(convexQuery(api.comptabilite.getAllComptes, {}))
}

export function useAdminPieces() {
  return useQuery(convexQuery(api.comptabilite.getAllPieces, {}))
}

export function useAdminPromoCodes() {
  return useQuery(convexQuery(api.promo_codes.list, {}))
}

export function useAdminMargins() {
  return useQuery(convexQuery(api.margins.list, {}))
}

export function useAdminPackages() {
  return useQuery(convexQuery(api.packages.list, {}))
}

export function useDeleteUser() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.users.deleteUser)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}

export function useCreatePromoCode() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.promo_codes.create)
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.promo_codes() }),
  })
}

export function useUpdatePromoCode() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.promo_codes.update)
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.promo_codes() }),
  })
}

export function useDeletePromoCode() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.promo_codes.delete_)
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.promo_codes() }),
  })
}

export function useCreateMargin() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.margins.create)
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.margins() }),
  })
}

export function useUpdateMargin() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.margins.update)
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.margins() }),
  })
}

export function useDeleteMargin() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.margins.delete_)
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.margins() }),
  })
}

export function useCreatePackage() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.packages.create)
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.packages() }),
  })
}

export function useUpdatePackage() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.packages.update)
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.packages() }),
  })
}

export function useDeletePackage() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.packages.delete_)
  return useMutation({
    mutationFn,
    onSettled: () => qc.invalidateQueries({ queryKey: adminKeys.packages() }),
  })
}

export function useAdminWallets() {
  return useQuery(convexQuery(api.wallet.getAllWallets, {}))
}

export function useAdminPaymentIntents() {
  return useQuery(convexQuery(api.payment_intents.listAllPaymentIntents, {}))
}
