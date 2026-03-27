'use client'

import { useQuery } from '@tanstack/react-query'

export const activationKeys = {
    all: ['activations'] as const,
    history: (page?: number) => [...activationKeys.all, 'history', page ?? 1] as const,
}

export function useActivations(page = 1) {
    return useQuery({
        queryKey: activationKeys.history(page),
        queryFn: async () => {
            const res = await fetch(`/api/client/activations/history?page=${page}`, { cache: 'no-store' })
            if (!res.ok) throw new Error('Failed to fetch activations')
            return res.json()
        },
    })
}
