import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { LoginSplash } from '#/components/spa/login-splash'

export const Route = createFileRoute('/auth-splash')({
  ssr: false,
  component: AuthSplashRoute,
})

function AuthSplashRoute() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()

  // Already authenticated → go to my-space
  if (!isPending && session) {
    navigate({ to: '/my-space' })
    return null
  }

  // Still loading session → show nothing
  if (isPending) return null

  return <LoginSplash />
}
