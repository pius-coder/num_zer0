'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseInfiniteQueryResult,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import type { ServiceItem, CountryItem } from '@/type/service'
import type { ActivationInfo, RequestActivationInput } from '@/type/activation'
import {
  requestActivationAction,
  cancelActivationAction,
  retryActivationAction,
} from '@/actions/activation.action'

// ─── Keys ──────────────────────────────────────────────────────────────────

export const numbersKeys = {
  all: ['numbers'] as const,
  services: () => [...numbersKeys.all, 'services'] as const,
  servicesList: (q?: string, cat?: string) => [...numbersKeys.services(), q, cat] as const,
  countries: (slug: string) => [...numbersKeys.all, 'countries', slug] as const,
  activations: () => [...numbersKeys.all, 'activations'] as const,
  activationsList: () => [...numbersKeys.activations(), 'list'] as const,
  activation: (id: string) => [...numbersKeys.activations(), id] as const,
}

// ─── Types ─────────────────────────────────────────────────────────────────

type ServicesPage = {
  items: ServiceItem[]
  total: number
  nextCursor: string | null
}

type CountriesPage = {
  items: CountryItem[]
  nextCursor: string | null
}

type ActivationsListResponse = {
  items: ActivationInfo[]
}

// ─── Queries ───────────────────────────────────────────────────────────────

export function useInfiniteServices(params?: {
  q?: string
  category?: string
}): UseInfiniteQueryResult<ServicesPage, Error> {
  return useInfiniteQuery({
    queryKey: numbersKeys.servicesList(params?.q, params?.category),
    queryFn: async ({ pageParam }): Promise<ServicesPage> => {
      const url = new URL('/api/client/services', window.location.origin)
      if (pageParam) url.searchParams.set('cursor', pageParam)
      if (params?.q) url.searchParams.set('q', params.q)
      if (params?.category) url.searchParams.set('category', params.category)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to fetch services')
      return res.json()
    },
    getNextPageParam: (last: ServicesPage) => last.nextCursor,
    initialPageParam: null as string | null,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

export function useInfiniteCountries(
  serviceSlug: string
): UseInfiniteQueryResult<CountriesPage, Error> {
  return useInfiniteQuery({
    queryKey: numbersKeys.countries(serviceSlug),
    queryFn: async ({ pageParam }): Promise<CountriesPage> => {
      const url = new URL(`/api/client/services/${serviceSlug}/countries`, window.location.origin)
      if (pageParam) url.searchParams.set('cursor', pageParam)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed to fetch countries')
      return res.json()
    },
    getNextPageParam: (last: CountriesPage) => last.nextCursor,
    initialPageParam: null as string | null,
    enabled: serviceSlug.length > 0,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: (prev) => prev,
  })
}

export function usePrefetchCountries() {
  const qc = useQueryClient()
  return (slug: string) => {
    const key = numbersKeys.countries(slug)
    if (!qc.getQueryData(key)) {
      qc.prefetchInfiniteQuery({
        queryKey: key,
        queryFn: async (): Promise<CountriesPage> => {
          const url = new URL(`/api/client/services/${slug}/countries`, window.location.origin)
          const res = await fetch(url.toString())
          if (!res.ok) throw new Error('Failed to fetch countries')
          return res.json()
        },
        initialPageParam: null as string | null,
        staleTime: 1 * 60_000,
      })
    }
  }
}

export function useActivationsList(): UseQueryResult<ActivationsListResponse, Error> {
  return useQuery({
    queryKey: numbersKeys.activationsList(),
    queryFn: async (): Promise<ActivationsListResponse> => {
      const res = await fetch('/api/client/activations/history')
      if (!res.ok) throw new Error('Failed to fetch activations')
      return res.json()
    },
    staleTime: 5_000,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.items?.every((a) => ['completed', 'cancelled', 'expired'].includes(a.state))) {
        return false
      }
      return 5_000
    },
    refetchIntervalInBackground: false,
  })
}

export function useActivation(
  id: string | null,
  enabled = true
): UseQueryResult<ActivationInfo, Error> {
  return useQuery({
    queryKey: numbersKeys.activation(id ?? ''),
    queryFn: async (): Promise<ActivationInfo> => {
      const res = await fetch(`/api/client/activations/${id}`)
      if (!res.ok) throw new Error('Failed to fetch activation')
      return res.json()
    },
    enabled: enabled && !!id,
    staleTime: 0,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || data.smsCode || ['completed', 'cancelled', 'expired'].includes(data.state)) {
        return false
      }
      return 2_000
    },
  })
}

// ─── Mutations (Server Actions) ────────────────────────────────────────────

export function useRequestActivation(): UseMutationResult<
  Awaited<ReturnType<typeof requestActivationAction>>,
  Error,
  RequestActivationInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: RequestActivationInput
    ): Promise<Awaited<ReturnType<typeof requestActivationAction>>> => {
      const result = await requestActivationAction(input)
      if (!result.success) {
        throw new Error(result.error ?? 'request_failed')
      }
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: numbersKeys.activations() })
    },
  })
}

export function useCancelActivation(): UseMutationResult<
  Awaited<ReturnType<typeof cancelActivationAction>>,
  Error,
  string
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<Awaited<ReturnType<typeof cancelActivationAction>>> => {
      const result = await cancelActivationAction(id)
      if (!result.success) {
        throw new Error(result.error ?? 'cancel_failed')
      }
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: numbersKeys.activations() })
    },
  })
}

export function useRetryActivation(): UseMutationResult<
  Awaited<ReturnType<typeof retryActivationAction>>,
  Error,
  RequestActivationInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: RequestActivationInput
    ): Promise<Awaited<ReturnType<typeof retryActivationAction>>> => {
      const result = await retryActivationAction(input)
      if (!result.success) {
        throw new Error(result.error ?? 'retry_failed')
      }
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: numbersKeys.activations() })
    },
  })
}
