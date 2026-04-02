'use client'

import { useSession as useAuthSession } from '@/common/auth/auth-client'

export interface AppSession {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  } | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useSession(): AppSession {
  const { data, isPending } = useAuthSession()
  return {
    user: data?.user
      ? {
          id: data.user.id,
          name: data.user.name ?? '',
          email: data.user.email ?? '',
          image: data.user.image,
        }
      : null,
    isLoading: isPending,
    isAuthenticated: !!data?.user,
  }
}
