import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { authClient } from '#/lib/auth-client'
import { LoginSplash } from '#/components/spa/login-splash'

export const Route = createFileRoute('/auth-splash')({
  ssr: false,
  component: AuthSplashRoute,
})

function AuthSplashRoute() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && session) {
      navigate({ to: '/my-space' })
    }
  }, [session, isPending, navigate])

  if (isPending) return null

  return session ? null : <LoginSplash />
}
