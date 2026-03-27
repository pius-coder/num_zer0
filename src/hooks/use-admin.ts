'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const adminKeys = {
  all: ['admin'] as const,
  users: (params: any) => [...adminKeys.all, 'users', params] as const,
  purchases: (params: any) => [...adminKeys.all, 'purchases', params] as const,
  activations: (params: any) => [...adminKeys.all, 'activations', params] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  config: () => [...adminKeys.all, 'config'] as const,
  audit: (params: any) => [...adminKeys.all, 'audit', params] as const,
  fraud: (params: any) => [...adminKeys.all, 'fraud', params] as const,
  logs: (params: any) => [...adminKeys.all, 'logs', params] as const,
  logStats: () => [...adminKeys.all, 'log-stats'] as const,
  packages: () => [...adminKeys.all, 'packages'] as const,
}

export function useAdminPackages() {
  return useQuery({
    queryKey: adminKeys.packages(),
    queryFn: async () => {
      const res = await fetch('/api/admin/credits/packages')
      if (!res.ok) throw new Error('Failed to fetch packages')
      return res.json()
    },
  })
}

export function useAdminUsers(page = 1, limit = 25, q = '') {
  return useQuery({
    queryKey: adminKeys.users({ page, limit, q }),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (q) params.set('q', q)
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })
}

export function useAdminPurchases(page = 1, limit = 25) {
  return useQuery({
    queryKey: adminKeys.purchases({ page, limit }),
    queryFn: async () => {
      const res = await fetch(`/api/admin/purchases?page=${page}&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch purchases')
      return res.json()
    },
  })
}

export function useAdminActivations(page = 1, limit = 25) {
  return useQuery({
    queryKey: adminKeys.activations({ page, limit }),
    queryFn: async () => {
      const res = await fetch(`/api/admin/activations?page=${page}&limit=${limit}`)
      if (!res.ok) throw new Error('Failed to fetch activations')
      return res.json()
    },
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard/overview')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })
}

export function useAdminConfig() {
  return useQuery({
    queryKey: adminKeys.config(),
    queryFn: async () => {
      const res = await fetch('/api/admin/config/settings')
      if (!res.ok) throw new Error('Failed to fetch config')
      return res.json()
    },
  })
}

export function useAdminUpdateConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const res = await fetch('/api/admin/config/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      if (!res.ok) throw new Error('Failed to update config')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.config() })
    },
  })
}

export function useAdminFraud() {
  return useQuery({
    queryKey: adminKeys.fraud({}),
    queryFn: async () => {
      const res = await fetch('/api/admin/fraud/events')
      if (!res.ok) throw new Error('Failed to fetch fraud events')
      return res.json()
    },
  })
}

export function useAdminAudit(page = 1, limit = 25, q = '') {
  return useQuery({
    queryKey: adminKeys.audit({ page, limit, q }),
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (q) params.set('q', q)
      const res = await fetch(`/api/admin/audit/logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      return res.json()
    },
  })
}

export function useAdminLogs(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString()
  return useQuery({
    queryKey: adminKeys.logs(params),
    queryFn: async () => {
      const res = await fetch(`/api/internal/logs?${qs}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || body.detail || `HTTP ${res.status}`)
      }
      return res.json()
    },
  })
}

export function useAdminLogStats() {
  return useQuery({
    queryKey: adminKeys.logStats(),
    queryFn: async () => {
      const res = await fetch('/api/internal/logs?action=stats')
      if (!res.ok) throw new Error('Failed to fetch log stats')
      return res.json()
    },
  })
}
