import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
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
  return useQuery({
    ...convexQuery(api.sms_provider.getNumberQuantity, { country }),
    enabled: country.length > 0,
  })
}

export function useTopCountries(service: string) {
  return useQuery({
    ...convexQuery(api.sms_provider.getTopCountries, { service }),
    enabled: service.length > 0,
  })
}

export function useOperators(country: string) {
  return useQuery({
    ...convexQuery(api.sms_provider.getOperators, { country }),
    enabled: country.length > 0,
  })
}

export function usePrices(country: string, service?: string) {
  return useQuery({
    ...convexQuery(api.sms_provider.getPrices, { country, service }),
    enabled: country.length > 0,
  })
}

