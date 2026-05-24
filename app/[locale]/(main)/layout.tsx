'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/hooks/use-session'

/**
 * Guards the layout: shows a loading indicator while session state is resolving, redirects unauthenticated users to the localized login route, and renders `children` for authenticated users.
 *
 * @param children - Content to render when the user is authenticated.
 * @returns The `children` when the user is authenticated; a centered loading spinner while the authentication state is loading; `null` after loading if the user is unauthenticated (a navigation to `/{locale}/login` is initiated).
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useSession()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/${locale}/login`)
    }
  }, [isLoading, isAuthenticated, locale, router])

  if (isLoading) {
    return (
      <div className='flex h-dvh items-center justify-center bg-background'>
        <div className='h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent' />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return children
}
