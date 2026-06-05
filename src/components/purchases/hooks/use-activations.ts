import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { convexQuery, useConvexAction, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

export const activationKeys = {
  all: ['activations'] as const,
  activation: (id: string) => [...activationKeys.all, 'activation', id] as const,
  myActivations: () => [...activationKeys.all, 'my'] as const,
  numberQuantity: (country: string) => [...activationKeys.all, 'quantity', country] as const,
  topCountries: (service: string) => [...activationKeys.all, 'top', service] as const,
  operators: (country: string) => [...activationKeys.all, 'operators', country] as const,
  prices: (country: string, service?: string) => [...activationKeys.all, 'prices', country, service] as const,
}

export function useActivation(activationId: Id<'activations'> | null) {
  return useQuery({
    ...convexQuery(api.sms_provider.getActivation, { activationId: activationId! }),
    enabled: !!activationId,
  })
}

export function useMyActivations() {
  return useQuery(convexQuery(api.sms_provider.getMyActivations, {}))
}

export function useInitiateActivation() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.sms_provider.initiateActivation)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activationKeys.myActivations() })
    },
  })
}

export function useCompleteActivation() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.sms_provider.completeActivation)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activationKeys.all })
    },
  })
}

export function useCancelActivation() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.sms_provider.cancelActivation)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activationKeys.all })
    },
  })
}

export function useRequestAnotherSms() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.sms_provider.requestAnotherSms)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activationKeys.all })
    },
  })
}

export function useNumberQuantity(country: string) {
  const actionFn = useConvexAction(api.sms_provider.getNumberQuantity)
  return useQuery({
    queryKey: activationKeys.numberQuantity(country),
    queryFn: () => actionFn({ country }),
    enabled: country.length > 0,
    staleTime: 30_000,
  })
}

export function useTopCountries(service: string) {
  const actionFn = useConvexAction(api.sms_provider.getTopCountries)
  return useQuery({
    queryKey: activationKeys.topCountries(service),
    queryFn: () => actionFn({ service }),
    enabled: service.length > 0,
    staleTime: 60_000,
  })
}

export function useOperators(country: string) {
  const actionFn = useConvexAction(api.sms_provider.getOperators)
  return useQuery({
    queryKey: activationKeys.operators(country),
    queryFn: () => actionFn({ country }),
    enabled: country.length > 0,
    staleTime: 30_000,
  })
}

export function usePrices(country: string, service?: string) {
  const actionFn = useConvexAction(api.sms_provider.getPrices)
  return useQuery({
    queryKey: activationKeys.prices(country, service),
    queryFn: () => actionFn({ country, service }),
    enabled: country.length > 0,
    staleTime: 30_000,
  })
}

export function useRentPriceList(country: string, service: string) {
  const actionFn = useConvexAction(api.sms_provider.getRentPriceList)
  return useQuery({
    queryKey: [...activationKeys.all, 'rent', country, service],
    queryFn: () => actionFn({ country, service }),
    enabled: country.length > 0 && service.length > 0,
    staleTime: 30_000,
  })
}

export function useFreePrices(country: string, service: string) {
  const actionFn = useConvexAction(api.sms_provider.getFreePrices)
  return useQuery({
    queryKey: [...activationKeys.all, 'freePrices', country, service],
    queryFn: () => actionFn({ country, service }),
    enabled: country.length > 0 && service.length > 0,
    staleTime: 30_000,
  })
}

export function useInitiateRentalActivation() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.sms_provider.initiateRentalActivation)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activationKeys.myActivations() })
    },
  })
}

