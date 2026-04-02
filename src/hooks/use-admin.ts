'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ── Query Key Factory ────────────────────────────────────────────────────────

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  users: (params?: object) => [...adminKeys.all, 'users', params ?? {}] as const,
  user: (id: string) => [...adminKeys.all, 'users', id] as const,
  services: (params?: object) => [...adminKeys.all, 'services', params ?? {}] as const,
  priceRules: (params?: object) => [...adminKeys.all, 'price-rules', params ?? {}] as const,
  providers: () => [...adminKeys.all, 'providers'] as const,
  config: () => [...adminKeys.all, 'config'] as const,
  fraud: (params?: object) => [...adminKeys.all, 'fraud', params ?? {}] as const,
  audit: (params?: object) => [...adminKeys.all, 'audit', params ?? {}] as const,
  packages: () => [...adminKeys.all, 'packages'] as const,
  activations: (params?: object) => [...adminKeys.all, 'activations', params ?? {}] as const,
  purchases: (params?: object) => [...adminKeys.all, 'purchases', params ?? {}] as const,
}

type FetchParams = Record<string, string | number | undefined>

async function adminFetch<T>(path: string, params?: FetchParams): Promise<T> {
  const url = new URL(`/api/admin${path}`, window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`)
  return res.json() as Promise<T>
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => adminFetch('/dashboard'),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

// ── Users ────────────────────────────────────────────────────────────────────

export function useAdminUsers(params?: { page?: number; search?: string; limit?: number }) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminFetch('/users', params),
    staleTime: 15_000,
  })
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () => adminFetch(`/users/${id}`),
    enabled: !!id,
    staleTime: 10_000,
  })
}

// ── Services ─────────────────────────────────────────────────────────────────

export function useAdminServices(params?: { page?: number; search?: string }) {
  return useQuery({
    queryKey: adminKeys.services(params),
    queryFn: () => adminFetch('/services', params),
    staleTime: 60_000,
  })
}

// ── Price Rules ──────────────────────────────────────────────────────────────

export function useAdminPriceRules(params?: {
  page?: number
  serviceSlug?: string
  countryIso?: string
}) {
  return useQuery({
    queryKey: adminKeys.priceRules(params),
    queryFn: () => adminFetch('/price-rules', params),
    staleTime: 30_000,
  })
}

// ── Providers ────────────────────────────────────────────────────────────────

export function useAdminProviders() {
  return useQuery({
    queryKey: adminKeys.providers(),
    queryFn: () => adminFetch('/providers'),
    staleTime: 30_000,
    refetchInterval: 120_000,
  })
}

// ── Config ───────────────────────────────────────────────────────────────────

export function useAdminConfig() {
  return useQuery({
    queryKey: adminKeys.config(),
    queryFn: () => adminFetch('/config'),
    staleTime: 60_000,
  })
}

// ── Fraud ────────────────────────────────────────────────────────────────────

export function useAdminFraudEvents(params?: { page?: number; resolved?: boolean }) {
  return useQuery({
    queryKey: adminKeys.fraud(params),
    queryFn: () =>
      adminFetch('/fraud/events', {
        ...params,
        resolved: params?.resolved !== undefined ? Number(params.resolved) : undefined,
      }),
    staleTime: 10_000,
  })
}

// ── Audit Logs ───────────────────────────────────────────────────────────────

export function useAdminAuditLogs(params?: { page?: number; userId?: string; action?: string }) {
  return useQuery({
    queryKey: adminKeys.audit(params),
    queryFn: () => adminFetch('/audit/logs', params),
    staleTime: 10_000,
  })
}

// ── Credit Packages ──────────────────────────────────────────────────────────

export function useAdminPackages() {
  return useQuery({
    queryKey: adminKeys.packages(),
    queryFn: () => adminFetch('/credits/packages'),
    staleTime: 60_000,
  })
}

// ── Activations ──────────────────────────────────────────────────────────────

export function useAdminActivations(params?: { page?: number; userId?: string; status?: string }) {
  return useQuery({
    queryKey: adminKeys.activations(params),
    queryFn: () => adminFetch('/activations', params),
    staleTime: 10_000,
  })
}

// ── Purchases ────────────────────────────────────────────────────────────────

export function useAdminPurchases(params?: { page?: number; userId?: string; status?: string }) {
  return useQuery({
    queryKey: adminKeys.purchases(params),
    queryFn: () => adminFetch('/purchases', params),
    staleTime: 10_000,
  })
}

// ── Invalidation helper ──────────────────────────────────────────────────────

export function useInvalidateAdminQueries() {
  const qc = useQueryClient()
  return {
    invalidateAll: () => qc.invalidateQueries({ queryKey: adminKeys.all }),
    invalidateUsers: () => qc.invalidateQueries({ queryKey: adminKeys.users() }),
    invalidateConfig: () => qc.invalidateQueries({ queryKey: adminKeys.config() }),
    invalidatePriceRules: () => qc.invalidateQueries({ queryKey: adminKeys.priceRules() }),
  }
}
