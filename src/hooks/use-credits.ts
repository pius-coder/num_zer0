'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const creditKeys = {
    all: ['credits'] as const,
    balance: () => [...creditKeys.all, 'balance'] as const,
    packages: () => [...creditKeys.all, 'packages'] as const,
    history: (page?: number) => [...creditKeys.all, 'history', page ?? 1] as const,
}

export type WalletBalance = {
    base: number
    bonus: number
    promotional: number
    total: number
}

export type CreditPackage = {
    id: string
    slug: string
    nameFr: string
    nameEn: string
    credits: number
    priceXaf: number
    bonusPct: number
}

export function useBalance() {
    return useQuery({
        queryKey: creditKeys.balance(),
        queryFn: async () => {
            const res = await fetch('/api/client/credits/balance', { cache: 'no-store' })
            if (!res.ok) throw new Error('Failed to fetch balance')
            const data = await res.json()
            return (data.balance ?? null) as WalletBalance | null
        },
        staleTime: 60 * 1000,
    })
}

export function usePackages() {
    return useQuery({
        queryKey: creditKeys.packages(),
        queryFn: async () => {
            const res = await fetch('/api/client/credits/packages')
            if (!res.ok) throw new Error('Failed to fetch packages')
            const data = await res.json()
            return (data.packages ?? []) as CreditPackage[]
        },
        staleTime: 5 * 60 * 1000,
    })
}

export function useTransactions(page = 1) {
    return useQuery({
        queryKey: creditKeys.history(page),
        queryFn: async () => {
            const res = await fetch(`/api/client/credits/history?page=${page}`)
            if (!res.ok) throw new Error('Failed to fetch history')
            const data = await res.json()
            return data
        },
    })
}

export type CreatePurchaseInput = {
    packageId: string
    paymentMethod: string
    idempotencyKey: string
}

export function useCreatePurchase() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (input: CreatePurchaseInput) => {
            const res = await fetch('/api/client/credits/purchase', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(input),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create purchase')
            return data
        },
        onSuccess: () => {
            // Invalidate balance and history after initiating a purchase (optional, usually done after webhook)
            queryClient.invalidateQueries({ queryKey: creditKeys.all })
        },
    })
}
