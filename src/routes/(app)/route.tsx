import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getToken } from '#/lib/auth-server'
import { MobileBottomNav, BottomNavProvider, DesktopDrawerProxy } from '#/components/layout'

const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  return await getToken()
})

export const Route = createFileRoute('/(app)')({
  beforeLoad: async () => {
    const token = await getAuth()
    if (!token) {
      throw redirect({ to: '/auth-splash' })
    }
    return { isAuthenticated: true }
  },
  component: AppLayout,
})

function AppLayout() {
  return (
    <BottomNavProvider>
      <main>
        <Outlet />
      </main>

      <DesktopDrawerProxy />
      <MobileBottomNav />
    </BottomNavProvider>
  )
}
