'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import type {
  WalletBalance,
  CreditPackage,
  CreatePurchaseInput,
  CreditTransactionInfo,
  CreatePurchaseResponse,
} from '@/type/credit'

// ─── Keys ──────────────────────────────────────────────────────────────────

export const creditsKeys = {
  all: ['credits'] as const,
  balance: () => [...creditsKeys.all, 'balance'] as const,
  packages: () => [...creditsKeys.all, 'packages'] as const,
  transactions: () => [...creditsKeys.all, 'transactions'] as const,
}

// ─── Queries ───────────────────────────────────────────────────────────────

export function useBalance(): UseQueryResult<WalletBalance, Error> {
  return useQuery({
    queryKey: creditsKeys.balance(),
    queryFn: async (): Promise<WalletBalance> => {
      const res = await fetch('/api/client/credits/balance')
      if (!res.ok) throw new Error('Failed to fetch balance')
      return res.json()
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function usePackages(): UseQueryResult<CreditPackage[], Error> {
  return useQuery({
    queryKey: creditsKeys.packages(),
    queryFn: async (): Promise<CreditPackage[]> => {
      const res = await fetch('/api/client/credits/packages')
      if (!res.ok) throw new Error('Failed to fetch packages')
      return res.json()
    },
    staleTime: 60_000,
  })
}

export function useTransactions(): UseQueryResult<{ items: CreditTransactionInfo[] }, Error> {
  return useQuery({
    queryKey: creditsKeys.transactions(),
    queryFn: async (): Promise<{ items: CreditTransactionInfo[] }> => {
      const res = await fetch('/api/client/credits/history')
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
    staleTime: 10_000,
  })
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function useCreatePurchase(): UseMutationResult<
  CreatePurchaseResponse,
  Error,
  CreatePurchaseInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePurchaseInput): Promise<CreatePurchaseResponse> => {
      const res = await fetch('/api/client/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to create purchase')
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: creditsKeys.all })
    },
  })
}
